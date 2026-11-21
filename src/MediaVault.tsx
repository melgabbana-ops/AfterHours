import { useCallback, useEffect, useRef, useState } from "react";
import {
  canApplyMediaOverlay,
  createPrivateMediaUrl,
  deletePrivateMedia,
  listPrivateMedia,
  uploadPrivateMedia,
  validatePrivateMediaFile,
  type PrivateMediaItem,
} from "./services/media";
import { supabase, supabaseConfigured } from "./services/supabase";
import { composeImageWithOverlay, composeImageWithEdits, defaultPhotoEditTransform, drawCameraFrame, mediaOverlayFrames, type OverlayFrameStyle, type PhotoEditTransform } from "./mediaOverlay";
import { appendMediaCaptureChunk, canRecoverInterruptedCapture, discardMediaCapture, MAX_MEDIA_CAPTURE_BYTES, missingCaptureTrack, stopMediaRecorder, stopMediaStreams, selectMediaRecorderMimeType, waitForVideoReady, watchMediaStreamInterruption } from "./services/mediaCapture";

interface MediaVaultProps {
  sessionId: string;
  language?: "nl" | "en";
  assignmentTitle?: string;
  assignmentTask?: string;
}

function displayName(name: string): string {
  return name.replace(/^[0-9a-f-]{36}-/i, "");
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MediaVault({ sessionId, language = "nl", assignmentTitle, assignmentTask }: MediaVaultProps) {
  const t = (nl: string, en: string) => language === "nl" ? nl : en;
  const [items, setItems] = useState<PrivateMediaItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [signedUrl, setSignedUrl] = useState("");
  const [deletingPath, setDeletingPath] = useState("");
  const [captureKind,setCaptureKind] = useState<"photo"|"video"|"voice">("video");
  const [cameraFacing,setCameraFacing] = useState<"user"|"environment">("environment");
  const [frameStyle,setFrameStyle] = useState<OverlayFrameStyle>("after-hours");
  const [captureConsent,setCaptureConsent] = useState(false);
  const [isRecording,setIsRecording] = useState(false);
  const [recordingSeconds,setRecordingSeconds] = useState(0);
  const [isPhotoCameraOpen,setIsPhotoCameraOpen] = useState(false);
  const [liveStream,setLiveStream] = useState<MediaStream|null>(null);
  const [pendingCapture,setPendingCapture] = useState<File|null>(null);
  const [pendingOriginalFile,setPendingOriginalFile] = useState<File|null>(null);\n  const [photoEdits,setPhotoEdits] = useState<PhotoEditTransform>(defaultPhotoEditTransform);
  const [pendingUrl,setPendingUrl] = useState("");
  const [isSavingCapture,setIsSavingCapture] = useState(false);
  const mountedRef = useRef(false);
  const livePreviewRef = useRef<HTMLVideoElement|null>(null);
  const liveCanvasRef = useRef<HTMLCanvasElement|null>(null);
  const compositionStreamRef = useRef<MediaStream|null>(null);
  const renderFrameRef = useRef<number|null>(null);
  const frameStyleRef = useRef<OverlayFrameStyle>("after-hours");
  const recorderRef = useRef<MediaRecorder|null>(null);
  const streamRef = useRef<MediaStream|null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const captureBytesRef = useRef(0);
  const captureSizeExceededRef = useRef(false);
  const captureTimeoutRef = useRef<number|undefined>(undefined);
  const saveInProgressRef = useRef(false);
  const streamInterruptionCleanupRef = useRef<(() => void) | null>(null);
  const captureInterruptedRef = useRef(false);
  const captureFailedRef = useRef(false);
  const captureStartInFlightRef = useRef(false);


  useEffect(()=>{
    if(livePreviewRef.current) livePreviewRef.current.srcObject=liveStream;
  },[liveStream]);
  useEffect(()=>{frameStyleRef.current=frameStyle},[frameStyle]);
  useEffect(()=>{
    if(!isRecording){setRecordingSeconds(0);return;}
    const startedAt=Date.now();
    setRecordingSeconds(0);
    const interval=window.setInterval(()=>{
      setRecordingSeconds(Math.min(60,Math.floor((Date.now()-startedAt)/1000)));
    },1000);
    return ()=>window.clearInterval(interval);
  },[isRecording]);
  useEffect(()=>{
    mountedRef.current=true;
    return ()=>{
      mountedRef.current=false;
      if(captureTimeoutRef.current!==undefined) window.clearTimeout(captureTimeoutRef.current);
      streamInterruptionCleanupRef.current?.();
      streamInterruptionCleanupRef.current=null;
      captureInterruptedRef.current=false;
    captureFailedRef.current=false;
      captureStartInFlightRef.current=false;
      if(renderFrameRef.current!==null) window.cancelAnimationFrame(renderFrameRef.current);
      // Leaving the vault discards an unfinished recording instead of creating a preview.
      // Detach recorder callbacks before stopping tracks so no late event can update an unmounted view.
      discardMediaCapture(recorderRef.current,[streamRef.current,compositionStreamRef.current]);
      recorderRef.current=null;
      streamRef.current=null;
      compositionStreamRef.current=null;
      chunksRef.current=[];
      captureBytesRef.current=0;
      captureSizeExceededRef.current=false;
      if(livePreviewRef.current)livePreviewRef.current.srcObject=null;
    };
  },[]);
  useEffect(()=>{
    const currentUrl=pendingUrl;
    return ()=>{if(currentUrl)URL.revokeObjectURL(currentUrl);};
  },[pendingUrl]);

  const refresh = useCallback(async (isActive: () => boolean = () => mountedRef.current): Promise<boolean> => {
    if (isActive()) {
      setLoading(true);
      setMessage("");
    }
    try {
      const nextItems = await listPrivateMedia();
      if (isActive()) setItems(nextItems);
      return true;
    } catch (error) {
      if (isActive()) {
        setMessage(error instanceof Error ? error.message : t("Privébestanden konden niet worden geladen.", "Private files could not be loaded."));
      }
      return false;
    } finally {
      if (isActive()) setLoading(false);
    }
  }, [language]);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!supabaseConfigured || !supabase) return;
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) throw error;
        if (data.user && active) await refresh(() => active);
        else if (active) setMessage(t("Log in via Session Control om je privékluis te openen.", "Sign in through Session Control to open your private vault."));
      } catch (error) {
        if (active) setMessage(error instanceof Error ? error.message : t("Aanmelden is nodig voor privéopslag.", "Sign-in is required for private storage."));
      }
    }
    void load();
    return () => { active = false; };
  }, [refresh, language]);

  const upload = async (file?: File): Promise<boolean> => {
    if (!file || !mountedRef.current) return false;
    setBusy(true);
    setMessage("");
    setSignedUrl("");
    try {
      await uploadPrivateMedia(file, sessionId, assignmentTitle);
      if(!mountedRef.current)return true;
      const refreshed = await refresh(() => mountedRef.current);
      if(!mountedRef.current)return true;
      setMessage(
        refreshed
          ? t("Bestand veilig geüpload naar je privékluis.", "File safely uploaded to your private vault.")
          : t("Bestand is geüpload, maar de lijst kon niet worden vernieuwd. Tik op Vernieuwen om opnieuw te proberen.", "The file uploaded, but the list could not refresh. Tap Refresh to try again."),
      );
      return true;
    } catch (error) {
      if(mountedRef.current)setMessage(error instanceof Error ? error.message : t("Uploaden is mislukt.", "Upload failed."));
      return false;
    } finally {
      if(mountedRef.current)setBusy(false);
    }
  };

  const stopCaptureTracks=()=>{
    streamInterruptionCleanupRef.current?.();
    streamInterruptionCleanupRef.current=null;
    if(renderFrameRef.current!==null){window.cancelAnimationFrame(renderFrameRef.current);renderFrameRef.current=null;}
    stopMediaStreams([compositionStreamRef.current,streamRef.current]);
    compositionStreamRef.current=null;
    streamRef.current=null;
    recorderRef.current=null;
    chunksRef.current=[];
    captureBytesRef.current=0;
    if(livePreviewRef.current)livePreviewRef.current.srcObject=null;
    if(mountedRef.current){
      setLiveStream(null);
      setIsRecording(false);
      setIsPhotoCameraOpen(false);
    }
    if(captureTimeoutRef.current!==undefined){window.clearTimeout(captureTimeoutRef.current);captureTimeoutRef.current=undefined;}
  };

  const stageSelectedFile=async(file?:File,overlayAlreadyApplied=false)=>{
    if(!file||!mountedRef.current)return;
    if(!captureConsent){
      setMessage(t("Bevestig eerst dat de betrokkenen akkoord zijn met deze media en privéopslag.","First confirm that the people involved agree to this media and private storage."));
      return;
    }
    setBusy(true);
    try{
      validatePrivateMediaFile(file);
      const overlayApplied=canApplyMediaOverlay(file.type)&&!overlayAlreadyApplied;
      const previewFile=overlayApplied?await composeImageWithOverlay(file,frameStyleRef.current):file;
      if(!mountedRef.current)return;
      validatePrivateMediaFile(previewFile);
      if(pendingUrl) URL.revokeObjectURL(pendingUrl);
      setPendingCapture(previewFile);
      setPendingOriginalFile(overlayApplied?file:null);
      setPendingUrl(URL.createObjectURL(previewFile));
      setMessage(overlayApplied
        ?t("AH-overlay toegepast. Controleer de foto en kies daarna zelf voor privé opslaan.","AH overlay applied. Review the photo, then choose whether to save it privately.")
        :file.type.startsWith("image/")&&!overlayAlreadyApplied
          ?t("Voorbeeld klaar. Dit fotoformaat wordt ongewijzigd bewaard omdat de browser het niet betrouwbaar via canvas kan verwerken.","Preview ready. This photo format will be kept unchanged because the browser cannot reliably process it through canvas.")
          :t("Voorbeeld klaar. Kies daarna zelf voor privé opslaan. Bestaande video's worden niet opnieuw gerenderd.","Preview ready. Choose whether to save privately. Existing videos are not re-rendered."));
    }catch(error){
      if(mountedRef.current)setMessage(error instanceof Error ? error.message : t("Dit bestand kan niet worden gebruikt.","This file cannot be used."));
    }finally{if(mountedRef.current)setBusy(false)}
  };

  const updatePendingImageEdit=async(style:OverlayFrameStyle,edits:PhotoEditTransform)=>{
    const original=pendingOriginalFile;
    if(!original||!pendingCapture||busy||isSavingCapture)return;
    setBusy(true);
    setMessage("");
    try{
      const updated=await composeImageWithEdits(original,style,edits);
      if(!mountedRef.current)return;
      validatePrivateMediaFile(updated);
      setFrameStyle(style);
      setPhotoEdits(edits);
      setPendingCapture(updated);
      setPendingUrl(URL.createObjectURL(updated));
      setMessage(t("Foto bewerkt. Controleer de preview voordat je privé opslaat.","Photo edited. Review the preview before saving it privately."));
    }catch(error){
      if(mountedRef.current)setMessage(error instanceof Error?error.message:t("De foto kon niet worden bijgewerkt.","Could not update the photo."));
    }finally{
      if(mountedRef.current)setBusy(false);
    }
  };

  const startCapture=async()=>{
    if(!captureConsent){
      setMessage(t("Bevestig eerst dat iedereen op de opname expliciet akkoord is met opnemen én privé opslaan.","First confirm that everyone recorded explicitly agrees to recording and private storage."));
      return;
    }
    if(typeof navigator.mediaDevices?.getUserMedia!=="function"||(captureKind!=="photo"&&typeof MediaRecorder==="undefined")){
      setMessage(t("Opnemen wordt niet ondersteund door deze browser. Probeer een recente browser of gebruik Bestand kiezen.","Recording is not supported by this browser. Try a recent browser or choose a file instead."));
      return;
    }
    if(captureStartInFlightRef.current)return;
    captureStartInFlightRef.current=true;
    setBusy(true);
    setMessage("");
    captureInterruptedRef.current=false;
    try{
      const stream=await navigator.mediaDevices.getUserMedia(captureKind==="photo"
        ? {video:{facingMode:{ideal:cameraFacing},width:{ideal:1920},height:{ideal:1080}},audio:false}
        : captureKind==="video"
          ? {video:{facingMode:{ideal:cameraFacing},width:{ideal:1280},height:{ideal:720}},audio:true}
          : {video:false,audio:true});
      if(!mountedRef.current){stopMediaStreams([stream]);return;}
      const missingTrack=missingCaptureTrack(stream,captureKind!=="voice",captureKind!=="photo");
      if(missingTrack){
        stopMediaStreams([stream]);
        throw new Error(missingTrack==="video"
          ? t("De camera heeft geen actief videosignaal geleverd. Controleer de cameratoestemming en probeer opnieuw.","The camera did not provide an active video track. Check camera permission and try again.")
          : t("De microfoon heeft geen actief audiosignaal geleverd. Controleer de microfoontoestemming en probeer opnieuw.","The microphone did not provide an active audio track. Check microphone permission and try again."));
      }
      streamRef.current=stream;
      streamInterruptionCleanupRef.current=watchMediaStreamInterruption(stream,()=>{
        if(!mountedRef.current)return;
        captureInterruptedRef.current=true;
        const activeRecorder=recorderRef.current;
        if(stopMediaRecorder(activeRecorder))return;
        stopCaptureTracks();
        setCaptureConsent(false);
        setMessage(t("Camera of microfoon is onderbroken. Er is niets opgeslagen. Start opnieuw als je wilt.","Camera or microphone was interrupted. Nothing was saved. Start again if you want."));
      });
      if(streamRef.current!==stream)return;
      setLiveStream(stream);
      chunksRef.current=[];
      captureBytesRef.current=0;
      captureSizeExceededRef.current=false;
      if(captureKind==="photo"){
        await new Promise<void>(resolve=>window.requestAnimationFrame(()=>window.requestAnimationFrame(()=>resolve())));
        if(!mountedRef.current||streamRef.current!==stream)return;
        const video=livePreviewRef.current;
        const canvas=liveCanvasRef.current;
        if(!video||!canvas)throw new Error(t("De camera-preview is niet beschikbaar.","Camera preview is not available."));
        video.srcObject=stream;
        await video.play();
        if(!mountedRef.current||streamRef.current!==stream)return;
        await waitForVideoReady(
          video,
          5000,
          t("De camera startte niet op tijd.","The camera did not start in time."),
          t("De camera kon geen beeld leveren.","The camera could not provide a video frame."),
        );
        if(!mountedRef.current||streamRef.current!==stream)return;
        canvas.width=Math.min(1920,video.videoWidth);
        canvas.height=Math.max(1,Math.round(canvas.width/(video.videoWidth/video.videoHeight)));
        const ctx=canvas.getContext("2d");
        if(!ctx)throw new Error(t("Canvas wordt niet ondersteund door deze browser.","Canvas is not supported in this browser."));
        const render=()=>{
          if(video.readyState>=2)drawCameraFrame(ctx,video,canvas.width,canvas.height,frameStyleRef.current);
          renderFrameRef.current=window.requestAnimationFrame(render);
        };
        render();
        setIsPhotoCameraOpen(true);
        setPendingCapture(null);
        if(pendingUrl){URL.revokeObjectURL(pendingUrl);setPendingUrl("");}
        return;
      }
      let recorderStream=stream;
      if(captureKind==="video"){
        await new Promise<void>(resolve=>window.requestAnimationFrame(()=>window.requestAnimationFrame(()=>resolve())));
        if(!mountedRef.current||streamRef.current!==stream)return;
        const video=livePreviewRef.current;
        const canvas=liveCanvasRef.current;
        if(!video||!canvas||typeof canvas.captureStream!=="function")throw new Error(t("Deze browser kan de AH-overlay niet in de video opnemen. Gebruik een recente browser of maak een foto.","This browser cannot composite the AH overlay into video. Try a recent browser or take a photo."));
        video.srcObject=stream;
        await video.play();
        if(!mountedRef.current||streamRef.current!==stream)return;
        await waitForVideoReady(
          video,
          5000,
          t("De camera startte niet op tijd.","The camera did not start in time."),
          t("De camera kon geen beeld leveren.","The camera could not provide a video frame."),
        );
        if(!mountedRef.current||streamRef.current!==stream)return;
        const ratio=video.videoWidth/video.videoHeight;
        canvas.width=Math.min(1920,video.videoWidth);
        canvas.height=Math.max(1,Math.round(canvas.width/ratio));
        const ctx=canvas.getContext("2d");
        if(!ctx)throw new Error(t("Canvas wordt niet ondersteund door deze browser.","Canvas is not supported in this browser."));
        const render=()=>{
          if(video.readyState>=2)drawCameraFrame(ctx,video,canvas.width,canvas.height,frameStyleRef.current);
          renderFrameRef.current=window.requestAnimationFrame(render);
        };
        render();
        const composited=canvas.captureStream(30);
        stream.getAudioTracks().forEach(track=>composited.addTrack(track));
        compositionStreamRef.current=composited;
        recorderStream=composited;
      }
      const candidates=captureKind==="video"
        ? ["video/mp4","video/webm;codecs=vp8,opus","video/webm"]
        : ["audio/mp4","audio/webm;codecs=opus","audio/webm","audio/ogg;codecs=opus"];
      const mimeType=selectMediaRecorderMimeType(candidates,type=>MediaRecorder.isTypeSupported(type));
      const recorder=mimeType?new MediaRecorder(recorderStream,{mimeType}):new MediaRecorder(recorderStream);
      recorderRef.current=recorder;
      recorder.ondataavailable=event=>{
        if(!mountedRef.current||captureSizeExceededRef.current||event.data.size===0)return;
        const nextBytes=appendMediaCaptureChunk(chunksRef.current,captureBytesRef.current,event.data);
        if(nextBytes===null){
          captureSizeExceededRef.current=true;
          chunksRef.current=[];
          captureBytesRef.current=0;
          if(stopMediaRecorder(recorder))return;
          return;
        }
        captureBytesRef.current=nextBytes;
      };
      recorder.onerror=()=>{
        // Suppress any trailing stop event: a recorder error must never publish
        // the remaining chunks as if this were a clean, user-approved preview.
        captureFailedRef.current=true;
        captureInterruptedRef.current=false;
        stopCaptureTracks();
        setCaptureConsent(false);
        if(mountedRef.current)setMessage(t("De opname is mislukt en de tijdelijke gegevens zijn weggegooid. Controleer camera- of microfoontoestemming en probeer opnieuw.","Recording failed and temporary data was discarded. Check camera or microphone permission and try again."));
      };
      recorder.onstop=()=>{
        if(!mountedRef.current){chunksRef.current=[];return;}
        if(captureFailedRef.current){
          captureFailedRef.current=false;
          chunksRef.current=[];
          captureBytesRef.current=0;
          captureSizeExceededRef.current=false;
          stopCaptureTracks();
          return;
        }
        const interrupted=captureInterruptedRef.current;
        captureInterruptedRef.current=false;
        if(interrupted){
          const interruptedType=recorder.mimeType||(captureKind==="video"?"video/webm":"audio/webm");
          const interruptedBlob=new Blob(chunksRef.current,{type:interruptedType});
          chunksRef.current=[];
          captureBytesRef.current=0;
          captureSizeExceededRef.current=false;
          stopCaptureTracks();
          setCaptureConsent(false);
          if(canRecoverInterruptedCapture(interruptedBlob.size)){
            const extension=interruptedType.includes("mp4")?".mp4":interruptedType.includes("ogg")?".ogg":".webm";
            const partialFile=new File([interruptedBlob],`after-hours-${captureKind}-recovered-${Date.now()}${extension}`,{type:interruptedType});
            setPendingCapture(partialFile);
            setPendingOriginalFile(null);
            // Release any previous local preview URL before replacing it.
            if(pendingUrl)URL.revokeObjectURL(pendingUrl);
            setPendingUrl(URL.createObjectURL(interruptedBlob));
            setMessage(t("Opname onderbroken. Er is een lokaal gedeeltelijk voorbeeld hersteld. Controleer het bestand en bevestig opnieuw toestemming voordat je het privé opslaat.","Recording interrupted. A local partial preview was recovered. Review it and reconfirm consent before saving it privately."));
          }else{
            setMessage(t("Camera of microfoon is onderbroken. Er was geen bruikbaar gedeeltelijk voorbeeld. Er is niets opgeslagen.","Camera or microphone was interrupted. No usable partial preview was available. Nothing was saved."));
          }
          return;
        }
        const sizeExceeded=captureSizeExceededRef.current;
        const type=recorder.mimeType|| (captureKind==="video"?"video/webm":"audio/webm");
        const blob=new Blob(chunksRef.current,{type});
        chunksRef.current=[];
        captureBytesRef.current=0;
        captureSizeExceededRef.current=false;
        stopCaptureTracks();
        if(sizeExceeded){
          setCaptureConsent(false);
          setMessage(t("Opname automatisch gestopt bij 20 MB. Er is niets opgeslagen. Maak een kortere opname of kies een lagere kwaliteit.","Recording stopped automatically at 20 MB. Nothing was saved. Make a shorter recording or choose a lower quality."));
          return;
        }
        if(blob.size===0){setCaptureConsent(false);setMessage(t("Er is geen opname gemaakt.","No recording was created."));return;}
        if(blob.size>MAX_MEDIA_CAPTURE_BYTES){setCaptureConsent(false);setMessage(t("De opname is groter dan 20 MB en is niet opgeslagen. Maak een kortere opname.","The recording exceeded 20 MB and was not saved. Make a shorter recording."));return;}
        const extension=type.includes("mp4")?".mp4":type.includes("ogg")?".ogg":".webm";
        const file=new File([blob],`after-hours-${captureKind}-${Date.now()}${extension}`,{type});
        if(pendingUrl)URL.revokeObjectURL(pendingUrl);
        setPendingCapture(file);
        setPendingOriginalFile(null);
        setPendingUrl(URL.createObjectURL(blob));
        setMessage(t("Voorbeeld klaar. Controleer de opname en sla alleen op als je dat nog steeds wilt.","Preview ready. Review the recording and save it only if you still want to."));
      };
      recorder.start(1000);
      setIsRecording(true);
      setPendingCapture(null);
      setPendingOriginalFile(null);
      if(pendingUrl){URL.revokeObjectURL(pendingUrl);setPendingUrl("");}
      captureTimeoutRef.current=window.setTimeout(()=>{
        if(!mountedRef.current)return;
        if(stopMediaRecorder(recorder)){
          setMessage(t("De opname is automatisch gestopt na 60 seconden.","Recording stopped automatically after 60 seconds."));
        }
      },60_000);
    }catch(error){
      stopCaptureTracks();
      if(!mountedRef.current)return;
      setCaptureConsent(false);
      setMessage(error instanceof Error?t(error.message,"Recording could not start: "+error.message):t("Geen toegang tot camera of microfoon. Controleer de browsertoestemming.","Camera or microphone access was denied. Check browser permissions."));
    }finally{
      captureStartInFlightRef.current=false;
      if(mountedRef.current)setBusy(false);
    }
  };

  const takePhoto=async()=>{
    const canvas=liveCanvasRef.current;
    if(!canvas||!isPhotoCameraOpen){setMessage(t("De camera is niet actief.","Camera is not active."));return;}
    try{
      const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(value=>value?resolve(value):reject(new Error(t("De foto kon niet worden gemaakt.","Could not capture the photo."))),"image/jpeg",.94));
      if(!mountedRef.current)return;
      if(blob.size>20*1024*1024)throw new Error(t("De foto is te groot om veilig op te slaan.","The photo is too large to store safely."));
      const file=new File([blob],`after-hours-photo-${Date.now()}.jpg`,{type:"image/jpeg"});
      stopCaptureTracks();
      await stageSelectedFile(file,true);
    }catch(error){if(mountedRef.current)setMessage(error instanceof Error?error.message:t("De foto kon niet worden gemaakt.","Could not capture the photo."));}
  };

  const recordingRemainingSeconds=Math.max(0,60-recordingSeconds);

  const stopCapture=()=>{
    const recorder=recorderRef.current;
    stopMediaRecorder(recorder);
  };

  const saveCapture=async()=>{
    if(!pendingCapture||!mountedRef.current||saveInProgressRef.current)return;
    if(!captureConsent){
      setMessage(t("Bevestig opnieuw dat iedereen akkoord is voordat je deze opname privé opslaat.","Please reconfirm that everyone agrees before saving this recording privately."));
      return;
    }
    saveInProgressRef.current=true;
    setIsSavingCapture(true);
    try{
      const saved=await upload(pendingCapture);
      if(!saved||!mountedRef.current)return;
      setPendingCapture(null);
      setPendingOriginalFile(null);
      if(pendingUrl){URL.revokeObjectURL(pendingUrl);setPendingUrl("");}
      setCaptureConsent(false);
    }finally{
      saveInProgressRef.current=false;
      if(mountedRef.current)setIsSavingCapture(false);
    }
  };

  const discardCapture=()=>{
    if(saveInProgressRef.current)return;
    setPendingCapture(null);
    setPendingOriginalFile(null);
    if(pendingUrl){URL.revokeObjectURL(pendingUrl);setPendingUrl("");}
    setCaptureConsent(false);
    setMessage(t("Media weggegooid. Er is niets geüpload.","Media discarded. Nothing was uploaded."));
  };

  const openItem = async (item: PrivateMediaItem) => {
    if(!mountedRef.current)return;
    setBusy(true);
    setMessage("");
    setSignedUrl("");
    try {
      const url=await createPrivateMediaUrl(item.path);
      if(mountedRef.current)setSignedUrl(url);
    } catch (error) {
      if(mountedRef.current)setMessage(error instanceof Error ? error.message : t("Het bestand kon niet worden geopend.", "The file could not be opened."));
    } finally {
      if(mountedRef.current)setBusy(false);
    }
  };

  const removeItem = async (path: string) => {
    if(!mountedRef.current)return;
    if (deletingPath !== path) {
      setDeletingPath(path);
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      await deletePrivateMedia(path);
      if(!mountedRef.current)return;
      setItems(current => current.filter(item => item.path !== path));
      setDeletingPath("");
      setSignedUrl("");
      setMessage(t("Bestand verwijderd.", "File deleted."));
    } catch (error) {
      if(mountedRef.current)setMessage(error instanceof Error ? error.message : t("Verwijderen is mislukt.", "Could not delete the file."));
    } finally {
      if(mountedRef.current)setBusy(false);
    }
  };

  return (
    <section className="media-vault auth-panel" aria-labelledby="media-vault-title">
      <span className="eyebrow">{t("PRIVÉOPSLAG", "PRIVATE STORAGE")}</span>
      <h3 id="media-vault-title">{assignmentTitle ? t("Opname bij opdracht", "Assignment capture") : t("Mijn privékluis", "My private vault")}</h3>
      {assignmentTitle&&<div className="assignment-captions"><strong>{assignmentTitle}</strong>{assignmentTask&&<p>{assignmentTask}</p>}<small>{t("Media wordt opgeslagen in de privékluis onder de huidige sessie. De opdracht wordt niet als openbare metadata gepubliceerd.","Media is stored privately under the current session. Assignment details are not published as public metadata.")}</small></div>}
      <p>{t("Afbeeldingen, video en audio blijven privé. Open-links zijn maximaal 60 seconden geldig.", "Images, video and audio stay private. Open links are valid for up to 60 seconds.")}</p>
      {!supabaseConfigured ? (
        <small role="status">{t("Privéopslag verschijnt zodra Supabase is geconfigureerd.", "Private storage will appear once Supabase is configured.")}</small>
      ) : (
        <>
          <label className="media-upload">
            <span>{busy ? t("Even wachten…", "Please wait…") : t("Afbeelding, video of audio kiezen", "Choose image, video or audio")}</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,image/avif,image/heic,image/heif,video/webm,video/mp4,video/quicktime,audio/mpeg,audio/mp4,audio/aac,audio/wav,audio/x-wav,audio/ogg,audio/webm,audio/flac"
              disabled={busy||isRecording||!!pendingCapture}
              onChange={event => {
                const file = event.currentTarget.files?.[0];
                void stageSelectedFile(file);
                event.currentTarget.value = "";
              }}
            />
          </label>
          <section className="media-capture" aria-labelledby="media-capture-title">
            <span className="eyebrow">{t("CAMERA & STEM","CAMERA & VOICE")}</span>
            <h4 id="media-capture-title">{t("Maak een privéopname","Create a private recording")}</h4>
            <p>{t("Opnames zijn optioneel. Geef alleen toestemming wanneer iedereen vrij en duidelijk akkoord is. De opname wordt eerst lokaal getoond en pas na jouw keuze geüpload.","Recordings are optional. Proceed only when everyone freely and clearly agrees. The recording is previewed locally and uploaded only after you choose to save it.")}</p>
            <label className="media-upload media-photo-capture">
              <span>{t("Maak een foto met de camera","Take a photo with the camera")}</span>
              <input type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif,image/heic,image/heif" capture="environment" disabled={busy||isRecording||!!pendingCapture} onChange={event=>{const file=event.currentTarget.files?.[0];void stageSelectedFile(file);event.currentTarget.value="";}}/>
            </label>
            <div className="media-frame-picker" role="group" aria-label={t("Stijl van de AFTER HOURS-overlay","AFTER HOURS overlay style")}>
              <span>{pendingOriginalFile?t("Pas het frame van je preview aan","Adjust the preview frame"):t("Kies je AH-frame","Choose your AH frame")}</span>
              <div>{mediaOverlayFrames.map(frame=><button key={frame.id} type="button" className={frameStyle===frame.id?"selected":""} aria-pressed={frameStyle===frame.id} onClick={()=>pendingOriginalFile?void updatePendingImageEdit(frame.id,photoEdits):setFrameStyle(frame.id)} disabled={isRecording||busy||isPhotoCameraOpen||!!pendingCapture&&!pendingOriginalFile}><strong>{language==="nl"?frame.titleNL:frame.titleEN}</strong><small>{language==="nl"?frame.descriptionNL:frame.descriptionEN}</small></button>)}</div>
            </div>
            <p className="media-overlay-note">{t("Het gekozen frame wordt in de camera-preview, nieuwe video-opnamen en foto's gebrand. Bestaande video's worden niet aangepast.","The selected frame is burned into the camera preview, new video recordings and photos. Existing videos are not modified.")}</p>
            <div className="media-capture-controls">
              <label>{t("Opnametype","Recording type")}<select value={captureKind} disabled={isRecording||isPhotoCameraOpen||busy} onChange={e=>setCaptureKind(e.target.value as "photo"|"video"|"voice")}><option value="photo">{t("Foto met live overlay","Photo with live overlay")}</option><option value="video">{t("Video met camera","Video with camera")}</option><option value="voice">{t("Alleen stem","Voice only")}</option></select></label>
              {captureKind!=="voice"&&<label>{t("Camerapositie","Camera")}<select value={cameraFacing} disabled={isRecording||isPhotoCameraOpen||busy} onChange={e=>setCameraFacing(e.target.value as "user"|"environment")}><option value="environment">{t("Achtercamera","Rear camera")}</option><option value="user">{t("Selfiecamera","Front camera")}</option></select></label>}
              <label className="media-consent-check"><input type="checkbox" checked={captureConsent} disabled={isRecording||busy||!!pendingCapture} onChange={e=>setCaptureConsent(e.target.checked)}/><span>{t("Ik bevestig dat de betrokkenen akkoord zijn met het maken of uploaden van deze media en privéopslag. Delen vereist aparte toestemming.","I confirm that everyone involved agrees to capture or upload this media and store it privately. Sharing requires separate consent.")}</span></label>
              {!isRecording&&!isPhotoCameraOpen&&!pendingCapture&&<button type="button" onClick={()=>void startCapture()} disabled={busy||!captureConsent}>{captureKind==="photo"?t("Open camera met live overlay","Open camera with live overlay"):t("Start opname · max. 60 sec.","Start recording · max 60 sec")}</button>}{isPhotoCameraOpen&&<div className="media-capture-controls"><button type="button" className="gold" onClick={()=>void takePhoto()} disabled={busy}>{t("Maak foto","Take photo")}</button><button type="button" onClick={()=>{stopCaptureTracks();setCaptureConsent(false);setMessage(t("Camera gesloten. Er is niets opgeslagen.","Camera closed. Nothing was saved."))}}>{t("Annuleren","Cancel")}</button></div>}
              {isRecording&&<button type="button" className="media-stop-recording" onClick={stopCapture}>{t("Stop opname","Stop recording")}</button>}
            </div>
            {isRecording&&<div className="media-recording-status" role="status"><span/> {t("Opname actief. Je kunt op elk moment stoppen.","Recording is active. You can stop at any time.")}<strong className="media-recording-clock" aria-label={t("Resterende opnametijd","Recording time remaining")}>00:{String(recordingRemainingSeconds).padStart(2,"0")}</strong><div className="media-recording-progress" role="progressbar" aria-valuemin={0} aria-valuemax={60} aria-valuenow={recordingSeconds} aria-label={t("Opnameduur van maximaal 60 seconden","Recording duration, maximum 60 seconds")}><span style={{width:`${(recordingSeconds/60)*100}%`}}/></div></div>}
            {liveStream&&(captureKind==="video"||captureKind==="photo")&&<div className="media-live-frame"><video className="media-live-source" ref={livePreviewRef} autoPlay muted playsInline aria-hidden="true"/><canvas className="media-live-preview media-live-composite" ref={liveCanvasRef} aria-label={t("Live cameravoorbeeld met AFTER HOURS-overlay","Live camera preview with AFTER HOURS overlay")}/><span className="media-live-watermark">AFTER HOURS <i>◐</i></span></div>}
            {pendingCapture&&pendingOriginalFile&&<div className="media-photo-editor" aria-label={t("Foto bewerken","Edit photo")}>
              <strong>{t("FOTO-EDITOR","PHOTO EDITOR")}</strong>
              <div className="media-item-actions">
                <button type="button" onClick={()=>void updatePendingImageEdit(frameStyle,{...photoEdits,rotation:((photoEdits.rotation+270)%360) as PhotoEditTransform["rotation"]})} disabled={busy}>{t("↶ Linksom draaien","↶ Rotate left")}</button>
                <button type="button" onClick={()=>void updatePendingImageEdit(frameStyle,{...photoEdits,rotation:((photoEdits.rotation+90)%360) as PhotoEditTransform["rotation"]})} disabled={busy}>{t("Rechtsom draaien ↷","Rotate right ↷")}</button>
                <button type="button" onClick={()=>void updatePendingImageEdit(frameStyle,defaultPhotoEditTransform)} disabled={busy}>{t("Herstellen","Reset")}</button>
              </div>
              <label>{t("Uitsnede / zoom","Crop / zoom")} · {photoEdits.zoom.toFixed(1)}×
                <input type="range" min="1" max="2.5" step="0.1" value={photoEdits.zoom} disabled={busy} onChange={event=>void updatePendingImageEdit(frameStyle,{...photoEdits,zoom:Number(event.target.value)})}/>
              </label>
              <label>{t("Horizontale positie","Horizontal position")}
                <input type="range" min="-1" max="1" step="0.05" value={photoEdits.offsetX} disabled={busy} onChange={event=>void updatePendingImageEdit(frameStyle,{...photoEdits,offsetX:Number(event.target.value)})}/>
              </label>
              <label>{t("Verticale positie","Vertical position")}
                <input type="range" min="-1" max="1" step="0.05" value={photoEdits.offsetY} disabled={busy} onChange={event=>void updatePendingImageEdit(frameStyle,{...photoEdits,offsetY:Number(event.target.value)})}/>
              </label>
              <small>{t("Origineel blijft behouden tot je de bewerkte foto opslaat. Alle aanpassingen worden lokaal verwerkt.","The original is preserved until you save the edited photo. All adjustments are processed locally.")}</small>
            </div>}
            {pendingCapture&&pendingUrl&&<div className="media-pending-preview">
              <strong>{t("Lokale preview","Local preview")} · {formatSize(pendingCapture.size)}</strong>
              {pendingCapture.type.startsWith("image/")?<img src={pendingUrl} alt={t("Lokale voorbeeldweergave van geselecteerde afbeelding","Local preview of selected image")}/>:pendingCapture.type.startsWith("video/")?<video src={pendingUrl} controls playsInline/>:<audio src={pendingUrl} controls/>}
              <div className="media-item-actions"><button type="button" onClick={()=>void saveCapture()} disabled={busy||isSavingCapture}>{isSavingCapture?t("Opslaan…","Saving…"):t("Opslaan in privékluis","Save to private vault")}</button><button type="button" onClick={discardCapture} disabled={busy||isSavingCapture}>{t("Weggooien","Discard")}</button></div>
            </div>}
          </section>
          <div className="media-vault-head">
            <strong>{t("Opgeslagen bestanden", "Saved files")}</strong>
            <button type="button" onClick={() => void refresh()} disabled={loading || busy}>
              {loading ? t("Laden…", "Loading…") : t("Vernieuwen", "Refresh")}
            </button>
          </div>
          {loading ? <small>{t("Privébestanden laden…", "Loading private files…")}</small> : items.length === 0 ? (
            <small role="status" aria-live="polite">{t("Nog geen bestanden gevonden. Je bestanden zijn alleen zichtbaar na veilig inloggen.", "No files yet. Your files are only visible after you sign in securely.")}</small>
          ) : (
            <div className="media-list" role="list" aria-label={t("Bestanden in je privékluis", "Files in your private vault")}>
              {items.map(item => (
                <div className="media-item" key={item.path} role="listitem">
                  <div className="media-item-copy">
                    <strong>{displayName(item.name)}</strong>
                    <small>{item.contentType ?? t("Privébestand", "Private file")} · {formatSize(item.size)}</small>
                  </div>
                  {deletingPath === item.path ? (
                    <div className="media-item-actions">
                      <button type="button" onClick={() => void removeItem(item.path)} disabled={busy}>{t("Bevestig", "Confirm")}</button>
                      <button type="button" onClick={() => setDeletingPath("")} disabled={busy}>{t("Annuleer", "Cancel")}</button>
                    </div>
                  ) : (
                    <div className="media-item-actions">
                      <button type="button" onClick={() => void openItem(item)} disabled={busy}>{t("Open", "Open")}</button>
                      <button type="button" onClick={() => void removeItem(item.path)} disabled={busy}>{t("Verwijder", "Delete")}</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          {signedUrl && <a className="media-signed-link" href={signedUrl} target="_blank" rel="noopener noreferrer">{t("Open privébestand (link verloopt na 60 seconden)", "Open private file (link expires after 60 seconds)")}</a>}
          {message && <small role="status">{message}</small>}
        </>
      )}
    </section>
  );
}
