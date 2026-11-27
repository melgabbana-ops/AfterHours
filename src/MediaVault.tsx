import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { createMediaPreviewUrlRegistry } from "./mediaPreviewUrls";
import { createPrivateMediaUrlExpiryTimer } from "./privateMediaUrlExpiry";
import { bindVaultAuthSession } from "./vaultAuthSession";
import { bindMediaCaptureBackgroundGuard, isMediaCaptureAttemptCurrent } from "./mediaCaptureLifecycle";
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
import { appendPhotoEditHistory, applyPhotoEditPreset, composeImageWithOverlay, composeImageWithEdits, defaultPhotoEditTransform, drawCameraFrame, getPhotoEditHistoryEntry, getPhotoEditHistoryShortcut, mediaOverlayFrames, photoEditPresets, type OverlayFrameStyle, type PhotoEditHistoryEntry, type PhotoEditPresetId, type PhotoEditTransform } from "./mediaOverlay";
import { appendMediaCaptureChunk, canRecoverInterruptedCapture, discardMediaCapture, MAX_MEDIA_CAPTURE_BYTES, missingCaptureTrack, requestMediaStream, stopMediaRecorder, stopMediaStreams, selectMediaRecorderMimeType, waitForVideoReady, watchMediaStreamInterruption } from "./services/mediaCapture";

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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
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
  const [pendingOriginalFile,setPendingOriginalFile] = useState<File|null>(null);
  const [originalPreviewUrl,setOriginalPreviewUrl] = useState("");
  const [showOriginalPhoto,setShowOriginalPhoto] = useState(false);
  const [photoEdits,setPhotoEdits] = useState<PhotoEditTransform>(defaultPhotoEditTransform);
  const [photoHistory,setPhotoHistory] = useState<PhotoEditHistoryEntry[]>([]);
  const [photoHistoryIndex,setPhotoHistoryIndex] = useState(-1);
  const [pendingUrl,setPendingUrl] = useState("");
  const [isSavingCapture,setIsSavingCapture] = useState(false);
  const mountedRef = useRef(false);
  const authValidRef = useRef(false);
  const authEventGenerationRef = useRef(0);
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
  const captureGenerationRef = useRef(0);
  const vaultVisibilityGenerationRef = useRef(0);
  const vaultNeedsRefreshRef = useRef(false);
  const previewUrlRegistryRef = useRef<ReturnType<typeof createMediaPreviewUrlRegistry> | null>(null);
  if (!previewUrlRegistryRef.current) previewUrlRegistryRef.current = createMediaPreviewUrlRegistry();
  const signedUrlExpiryRef = useRef<ReturnType<typeof createPrivateMediaUrlExpiryTimer> | null>(null);
  if (!signedUrlExpiryRef.current) signedUrlExpiryRef.current = createPrivateMediaUrlExpiryTimer();
  const clearSignedUrl = useCallback(() => {
    signedUrlExpiryRef.current?.clear();
    setSignedUrl("");
  }, []);


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
      previewUrlRegistryRef.current?.revokeAll();
      signedUrlExpiryRef.current?.clear();
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
    if(!pendingOriginalFile){setOriginalPreviewUrl("");setShowOriginalPhoto(false);return;}
    const url=previewUrlRegistryRef.current!.create(pendingOriginalFile);
    setOriginalPreviewUrl(url);
    setShowOriginalPhoto(false);
    return ()=>{previewUrlRegistryRef.current?.revoke(url);};
  },[pendingOriginalFile]);


  const refresh = useCallback(async (isActive: () => boolean = () => mountedRef.current): Promise<boolean> => {
    const generation = vaultVisibilityGenerationRef.current;
    const canUpdate = () => authValidRef.current
      && isActive()
      && generation === vaultVisibilityGenerationRef.current
      && document.visibilityState === "visible";
    if (!authValidRef.current || document.visibilityState !== "visible") return false;
    if (canUpdate()) {
      setLoading(true);
      setMessage("");
    }
    try {
      const nextItems = await listPrivateMedia();
      if (canUpdate()) setItems(nextItems);
      return true;
    } catch (error) {
      if (canUpdate()) {
        setMessage(error instanceof Error ? error.message : t("Privébestanden konden niet worden geladen.", "Private files could not be loaded."));
      }
      return false;
    } finally {
      if (canUpdate()) setLoading(false);
    }
  }, [language]);

  useEffect(() => {
    let active = true;
    const authGeneration = authEventGenerationRef.current;
    async function load() {
      if (!supabaseConfigured || !supabase) return;
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) throw error;
        if (!active || authGeneration !== authEventGenerationRef.current) return;
        if (data.user) {
          authValidRef.current = true;
          setIsAuthenticated(true);
          await refresh(() => active && authGeneration === authEventGenerationRef.current);
        } else {
          authValidRef.current = false;
          setIsAuthenticated(false);
          setMessage(t("Log in via Session Control om je privékluis te openen.", "Sign in through Session Control to open your private vault."));
        }
      } catch (error) {
        if (active && authGeneration === authEventGenerationRef.current) {
          setMessage(error instanceof Error ? error.message : t("Aanmelden is nodig voor privéopslag.", "Sign-in is required for private storage."));
        }
      }
    }
    void load();
    return () => { active = false; };
  }, [refresh, language]);

  const upload = async (file?: File): Promise<boolean> => {
    if (!file || !mountedRef.current || !authValidRef.current) return false;
    const generation = vaultVisibilityGenerationRef.current;
    setBusy(true);
    setMessage("");
    clearSignedUrl();
    try {
      await uploadPrivateMedia(file, sessionId, assignmentTitle, language);
      if(!mountedRef.current)return true;
      if (!authValidRef.current || generation !== vaultVisibilityGenerationRef.current) return false;
      const refreshed = await refresh(() => mountedRef.current && generation === vaultVisibilityGenerationRef.current);
      if(!mountedRef.current)return true;
      if (!authValidRef.current || generation !== vaultVisibilityGenerationRef.current) return false;
      setMessage(
        refreshed
          ? t("Bestand veilig geüpload naar je privékluis.", "File safely uploaded to your private vault.")
          : t("Bestand is geüpload, maar de lijst kon niet worden vernieuwd. Tik op Vernieuwen om opnieuw te proberen.", "The file uploaded, but the list could not refresh. Tap Refresh to try again."),
      );
      return true;
    } catch (error) {
      if(mountedRef.current && authValidRef.current && generation === vaultVisibilityGenerationRef.current)setMessage(error instanceof Error ? error.message : t("Uploaden is mislukt.", "Upload failed."));
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



  const handleCaptureBackground = useCallback((reason: "background" | "auth" = "background") => {
    const captureWasStarting = captureStartInFlightRef.current;
    captureGenerationRef.current += 1;
    vaultVisibilityGenerationRef.current += 1;
    captureStartInFlightRef.current = false;

    streamInterruptionCleanupRef.current?.();
    streamInterruptionCleanupRef.current = null;
    if (renderFrameRef.current !== null) {
      window.cancelAnimationFrame(renderFrameRef.current);
      renderFrameRef.current = null;
    }
    discardMediaCapture(recorderRef.current, [streamRef.current, compositionStreamRef.current]);
    recorderRef.current = null;
    streamRef.current = null;
    compositionStreamRef.current = null;
    chunksRef.current = [];
    captureBytesRef.current = 0;
    captureSizeExceededRef.current = false;
    captureInterruptedRef.current = false;
    captureFailedRef.current = false;
    if (captureTimeoutRef.current !== undefined) {
      window.clearTimeout(captureTimeoutRef.current);
      captureTimeoutRef.current = undefined;
    }
    if (livePreviewRef.current) livePreviewRef.current.srcObject = null;
    // Revoke every private preview synchronously before the browser can snapshot the app.
    previewUrlRegistryRef.current?.revokeAll();
    vaultNeedsRefreshRef.current = true;

    // Hide local previews and private file metadata before the OS can snapshot the app.
    flushSync(() => {
      setLiveStream(null);
      setIsRecording(false);
      setIsPhotoCameraOpen(false);
      setCaptureConsent(false);
      setPendingCapture(null);
      setPendingOriginalFile(null);
      setPendingUrl("");
      setOriginalPreviewUrl("");
      setShowOriginalPhoto(false);
      setPhotoEdits(defaultPhotoEditTransform);
      setPhotoHistory([]);
      setPhotoHistoryIndex(-1);
      clearSignedUrl();
      setItems([]);
      setDeletingPath("");
      setLoading(false);
      if (reason === "auth") setIsAuthenticated(false);
      if (captureWasStarting) setBusy(false);
      setMessage(reason === "auth"
        ? t("Je sessie is niet meer actief. Meld je opnieuw aan via Session Control om de privékluis te openen.", "Your sign-in session is no longer active. Sign in again through Session Control to open your private vault.")
        : language === "nl"
          ? "Privékluis afgeschermd toen de app naar de achtergrond ging. Camera en microfoon zijn gestopt; bestanden worden opnieuw geladen wanneer je terugkeert."
          : "Private vault hidden when the app went into the background. Camera and microphone were stopped; files will reload when you return.");
    });
  }, [language, clearSignedUrl]);

  const handleCaptureForeground = useCallback(() => {
    if (!vaultNeedsRefreshRef.current) return;
    vaultNeedsRefreshRef.current = false;
    void refresh();
  }, [refresh]);

  useEffect(() => bindMediaCaptureBackgroundGuard(
    window,
    document,
    handleCaptureBackground,
    handleCaptureForeground,
  ), [handleCaptureBackground, handleCaptureForeground]);

  useEffect(() => {
    if (!supabase) return;
    return bindVaultAuthSession(supabase.auth, ({ event, authenticated }) => {
      if (!authenticated) {
        authEventGenerationRef.current += 1;
        authValidRef.current = false;
        handleCaptureBackground("auth");
        return;
      }

      const wasAuthenticated = authValidRef.current;
      authValidRef.current = true;
      setIsAuthenticated(true);

      if (event === "SIGNED_IN" || (!wasAuthenticated && event !== "INITIAL_SESSION")) {
        authEventGenerationRef.current += 1;
        const authGeneration = authEventGenerationRef.current;
        if (document.visibilityState === "visible") {
          vaultNeedsRefreshRef.current = false;
          window.setTimeout(() => {
            if (
              mountedRef.current
              && authValidRef.current
              && authGeneration === authEventGenerationRef.current
              && document.visibilityState === "visible"
            ) {
              void refresh();
            }
          }, 0);
        } else {
          vaultNeedsRefreshRef.current = true;
        }
      }
    });
  }, [handleCaptureBackground, refresh]);

  const stageSelectedFile=async(file?:File,overlayAlreadyApplied=false)=>{
    if(!file||!mountedRef.current||!authValidRef.current)return;
    const generation = vaultVisibilityGenerationRef.current;
    if(!captureConsent){
      setMessage(t("Bevestig eerst dat de betrokkenen akkoord zijn met deze media en privéopslag.","First confirm that the people involved agree to this media and private storage."));
      return;
    }
    setBusy(true);
    try{
      validatePrivateMediaFile(file, language);
      const overlayApplied=canApplyMediaOverlay(file.type)&&!overlayAlreadyApplied;
      const previewFile=overlayApplied?await composeImageWithOverlay(file,frameStyleRef.current):file;
      if(!mountedRef.current||generation!==vaultVisibilityGenerationRef.current||document.visibilityState!=="visible")return;
      validatePrivateMediaFile(previewFile, language);
      if(pendingUrl) previewUrlRegistryRef.current?.revoke(pendingUrl);
      setPendingCapture(previewFile);
      setPendingOriginalFile(overlayApplied?file:null);
      setPhotoEdits(defaultPhotoEditTransform);
      const initialHistory:PhotoEditHistoryEntry[] = overlayApplied?[{style:frameStyleRef.current,edits:defaultPhotoEditTransform}]:[];
      setPhotoHistory(initialHistory);
      setPhotoHistoryIndex(initialHistory.length-1);
      setPendingUrl(previewUrlRegistryRef.current!.create(previewFile));
      setMessage(overlayApplied
        ?t("AH-overlay toegepast. Controleer de foto en kies daarna zelf voor privé opslaan.","AH overlay applied. Review the photo, then choose whether to save it privately.")
        :file.type.startsWith("image/")&&!overlayAlreadyApplied
          ?t("Voorbeeld klaar. Dit fotoformaat wordt ongewijzigd bewaard omdat de browser het niet betrouwbaar via canvas kan verwerken.","Preview ready. This photo format will be kept unchanged because the browser cannot reliably process it through canvas.")
          :t("Voorbeeld klaar. Kies daarna zelf voor privé opslaan. Bestaande video's worden niet opnieuw gerenderd.","Preview ready. Choose whether to save privately. Existing videos are not re-rendered."));
    }catch(error){
      if(mountedRef.current&&generation===vaultVisibilityGenerationRef.current&&document.visibilityState==="visible")setMessage(error instanceof Error ? error.message : t("Dit bestand kan niet worden gebruikt.","This file cannot be used."));
    }finally{if(mountedRef.current)setBusy(false)}
  };

  const updatePendingImageEdit=async(style:OverlayFrameStyle,edits:PhotoEditTransform,recordHistory=true):Promise<boolean>=>{
    const original=pendingOriginalFile;
    if(!authValidRef.current||!original||!pendingCapture||busy||isSavingCapture)return false;
    const generation = vaultVisibilityGenerationRef.current;
    setBusy(true);
    setMessage("");
    try{
      const updated=await composeImageWithEdits(original,style,edits);
      if(!mountedRef.current||generation!==vaultVisibilityGenerationRef.current||document.visibilityState!=="visible")return false;
      validatePrivateMediaFile(updated, language);
      setFrameStyle(style);
      setPhotoEdits(edits);
      if(recordHistory){
        const next=appendPhotoEditHistory(photoHistory,photoHistoryIndex,{style,edits});
        setPhotoHistory(next.history);
        setPhotoHistoryIndex(next.index);
      }
      setPendingCapture(updated);
      if(pendingUrl) previewUrlRegistryRef.current?.revoke(pendingUrl);
      setPendingUrl(previewUrlRegistryRef.current!.create(updated));
      setMessage(t("Foto bewerkt. Controleer de preview voordat je privé opslaat.","Photo edited. Review the preview before saving it privately."));
      return true;
    }catch(error){
      if(mountedRef.current&&generation===vaultVisibilityGenerationRef.current&&document.visibilityState==="visible")setMessage(error instanceof Error?error.message:t("De foto kon niet worden bijgewerkt.","Could not update the photo."));
      return false;
    }finally{
      if(mountedRef.current)setBusy(false);
    }
  };

  const movePhotoHistory=async(direction:-1|1)=>{
    const target=getPhotoEditHistoryEntry(photoHistory,photoHistoryIndex,direction);
    if(!target||busy||isSavingCapture)return;
    const restored=await updatePendingImageEdit(target.entry.style,target.entry.edits,false);
    if(restored)setPhotoHistoryIndex(target.index);
  };

  useEffect(()=>{
    if(!pendingOriginalFile)return;
    const handlePhotoHistoryShortcut=(event:KeyboardEvent)=>{
      const direction=getPhotoEditHistoryShortcut(event);
      if(direction===null)return;
      const target=event.target;
      if(target instanceof HTMLElement&&(target.isContentEditable||
        (/^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)&&!(target instanceof HTMLInputElement&&target.type==="range"))))return;
      event.preventDefault();
      void movePhotoHistory(direction);
    };
    window.addEventListener("keydown",handlePhotoHistoryShortcut);
    return ()=>window.removeEventListener("keydown",handlePhotoHistoryShortcut);
  },[pendingOriginalFile,photoHistoryIndex,photoHistory.length,busy,isSavingCapture]);

  const startCapture=async()=>{
    if(!authValidRef.current)return;
    if(!captureConsent){
      setMessage(t("Bevestig eerst dat iedereen op de opname expliciet akkoord is met opnemen én privé opslaan.","First confirm that everyone recorded explicitly agrees to recording and private storage."));
      return;
    }
    if(typeof navigator.mediaDevices?.getUserMedia!=="function"||(captureKind!=="photo"&&typeof MediaRecorder==="undefined")){
      setMessage(t("Opnemen wordt niet ondersteund door deze browser. Probeer een recente browser of gebruik Bestand kiezen.","Recording is not supported by this browser. Try a recent browser or choose a file instead."));
      return;
    }
    if(captureStartInFlightRef.current)return;
    const generation = ++captureGenerationRef.current;
    captureStartInFlightRef.current=true;
    setBusy(true);
    setMessage("");
    captureInterruptedRef.current=false;
    try{
      const stream=await requestMediaStream(()=>navigator.mediaDevices.getUserMedia(captureKind==="photo"
        ? {video:{facingMode:{ideal:cameraFacing},width:{ideal:1920},height:{ideal:1080}},audio:false}
        : captureKind==="video"
          ? {video:{facingMode:{ideal:cameraFacing},width:{ideal:1280},height:{ideal:720}},audio:true}
          : {video:false,audio:true}),30000,t("De toestemmingsaanvraag voor camera of microfoon duurde te lang. Controleer je browserinstellingen en probeer opnieuw.","The camera or microphone permission request took too long. Check your browser settings and try again."));
      if(!isMediaCaptureAttemptCurrent(generation,captureGenerationRef.current,document.visibilityState,mountedRef.current)){stopMediaStreams([stream]);return;}
      const missingTrack=missingCaptureTrack(stream,captureKind!=="voice",captureKind!=="photo");
      if(missingTrack){
        stopMediaStreams([stream]);
        throw new Error(missingTrack==="video"
          ? t("De camera heeft geen actief videosignaal geleverd. Controleer de cameratoestemming en probeer opnieuw.","The camera did not provide an active video track. Check camera permission and try again.")
          : t("De microfoon heeft geen actief audiosignaal geleverd. Controleer de microfoontoestemming en probeer opnieuw.","The microphone did not provide an active audio track. Check microphone permission and try again."));
      }
      streamRef.current=stream;
      const stopIfCaptureStale = () => {
        const current = isMediaCaptureAttemptCurrent(generation,captureGenerationRef.current,document.visibilityState,mountedRef.current)
          && streamRef.current === stream;
        if (current) return false;
        if (streamRef.current === stream) stopCaptureTracks();
        else stopMediaStreams([stream]);
        return true;
      };
      streamInterruptionCleanupRef.current=watchMediaStreamInterruption(stream,()=>{
        if(!mountedRef.current)return;
        captureInterruptedRef.current=true;
        const activeRecorder=recorderRef.current;
        if(stopMediaRecorder(activeRecorder))return;
        stopCaptureTracks();
        setCaptureConsent(false);
        setMessage(t("Camera of microfoon is onderbroken. Er is niets opgeslagen. Start opnieuw als je wilt.","Camera or microphone was interrupted. Nothing was saved. Start again if you want."));
      });
      if(stopIfCaptureStale())return;
      setLiveStream(stream);
      chunksRef.current=[];
      captureBytesRef.current=0;
      captureSizeExceededRef.current=false;
      if(captureKind==="photo"){
        await new Promise<void>(resolve=>window.requestAnimationFrame(()=>window.requestAnimationFrame(()=>resolve())));
        if(stopIfCaptureStale())return;
        const video=livePreviewRef.current;
        const canvas=liveCanvasRef.current;
        if(!video||!canvas)throw new Error(t("De camera-preview is niet beschikbaar.","Camera preview is not available."));
        video.srcObject=stream;
        await video.play();
        if(stopIfCaptureStale())return;
        await waitForVideoReady(
          video,
          5000,
          t("De camera startte niet op tijd.","The camera did not start in time."),
          t("De camera kon geen beeld leveren.","The camera could not provide a video frame."),
        );
        if(stopIfCaptureStale())return;
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
        if(pendingUrl){previewUrlRegistryRef.current?.revoke(pendingUrl);setPendingUrl("");}
        return;
      }
      let recorderStream=stream;
      if(captureKind==="video"){
        await new Promise<void>(resolve=>window.requestAnimationFrame(()=>window.requestAnimationFrame(()=>resolve())));
        if(stopIfCaptureStale())return;
        const video=livePreviewRef.current;
        const canvas=liveCanvasRef.current;
        if(!video||!canvas||typeof canvas.captureStream!=="function")throw new Error(t("Deze browser kan de AH-overlay niet in de video opnemen. Gebruik een recente browser of maak een foto.","This browser cannot composite the AH overlay into video. Try a recent browser or take a photo."));
        video.srcObject=stream;
        await video.play();
        if(stopIfCaptureStale())return;
        await waitForVideoReady(
          video,
          5000,
          t("De camera startte niet op tijd.","The camera did not start in time."),
          t("De camera kon geen beeld leveren.","The camera could not provide a video frame."),
        );
        if(stopIfCaptureStale())return;
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
            if(pendingUrl)previewUrlRegistryRef.current?.revoke(pendingUrl);
            setPendingUrl(previewUrlRegistryRef.current!.create(interruptedBlob));
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
        if(pendingUrl)previewUrlRegistryRef.current?.revoke(pendingUrl);
        setPendingCapture(file);
        setPendingOriginalFile(null);
        setPendingUrl(previewUrlRegistryRef.current!.create(blob));
        setMessage(t("Voorbeeld klaar. Controleer de opname en sla alleen op als je dat nog steeds wilt.","Preview ready. Review the recording and save it only if you still want to."));
      };
      recorder.start(1000);
      setIsRecording(true);
      setPendingCapture(null);
      setPendingOriginalFile(null);
      if(pendingUrl){previewUrlRegistryRef.current?.revoke(pendingUrl);setPendingUrl("");}
      captureTimeoutRef.current=window.setTimeout(()=>{
        if(!mountedRef.current)return;
        if(stopMediaRecorder(recorder)){
          setMessage(t("De opname is automatisch gestopt na 60 seconden.","Recording stopped automatically after 60 seconds."));
        }
      },60_000);
    }catch(error){
      if(generation!==captureGenerationRef.current)return;
      stopCaptureTracks();
      if(!mountedRef.current)return;
      setCaptureConsent(false);
      setMessage(error instanceof Error?t(error.message,"Recording could not start: "+error.message):t("Geen toegang tot camera of microfoon. Controleer de browsertoestemming.","Camera or microphone access was denied. Check browser permissions."));
    }finally{
      if(generation===captureGenerationRef.current){
        captureStartInFlightRef.current=false;
        if(mountedRef.current)setBusy(false);
      }
    }
  };

  const takePhoto=async()=>{
    const generation = captureGenerationRef.current;
    const stream = streamRef.current;
    const canvas=liveCanvasRef.current;
    if(!canvas||!isPhotoCameraOpen||!stream){setMessage(t("De camera is niet actief.","Camera is not active."));return;}
    try{
      const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(value=>value?resolve(value):reject(new Error(t("De foto kon niet worden gemaakt.","Could not capture the photo."))),"image/jpeg",.94));
      if(!isMediaCaptureAttemptCurrent(generation,captureGenerationRef.current,document.visibilityState,mountedRef.current)||streamRef.current!==stream)return;
      if(blob.size>20*1024*1024)throw new Error(t("De foto is te groot om veilig op te slaan.","The photo is too large to store safely."));
      const file=new File([blob],`after-hours-photo-${Date.now()}.jpg`,{type:"image/jpeg"});
      stopCaptureTracks();
      await stageSelectedFile(file,true);
    }catch(error){if(mountedRef.current&&generation===captureGenerationRef.current&&document.visibilityState==="visible")setMessage(error instanceof Error?error.message:t("De foto kon niet worden gemaakt.","Could not capture the photo."));}
  };
  const recordingRemainingSeconds=Math.max(0,60-recordingSeconds);

  const stopCapture=()=>{
    const recorder=recorderRef.current;
    stopMediaRecorder(recorder);
  };

  const saveCapture=async()=>{
    if(!pendingCapture||!mountedRef.current||!authValidRef.current||saveInProgressRef.current)return;
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
      if(pendingUrl){previewUrlRegistryRef.current?.revoke(pendingUrl);setPendingUrl("");}
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
    if(pendingUrl){previewUrlRegistryRef.current?.revoke(pendingUrl);setPendingUrl("");}
    setCaptureConsent(false);
    setMessage(t("Media weggegooid. Er is niets geüpload.","Media discarded. Nothing was uploaded."));
  };

  const openItem = async (item: PrivateMediaItem) => {
    if(!mountedRef.current||!authValidRef.current||document.visibilityState!=="visible")return;
    const generation = vaultVisibilityGenerationRef.current;
    setBusy(true);
    setMessage("");
    clearSignedUrl();
    try {
      const url=await createPrivateMediaUrl(item.path);
      if(mountedRef.current&&generation===vaultVisibilityGenerationRef.current&&document.visibilityState==="visible"){
        setSignedUrl(url);
        signedUrlExpiryRef.current?.schedule(() => {
          if (!mountedRef.current) return;
          setSignedUrl("");
          if (generation === vaultVisibilityGenerationRef.current && document.visibilityState === "visible") {
            setMessage(t(
              "De tijdelijke link is verlopen. Open het bestand opnieuw om een nieuwe link te maken.",
              "The temporary link has expired. Open the file again to create a new link.",
            ));
          }
        });
      }
    } catch (error) {
      if(mountedRef.current&&generation===vaultVisibilityGenerationRef.current&&document.visibilityState==="visible")setMessage(error instanceof Error ? error.message : t("Het bestand kon niet worden geopend.", "The file could not be opened."));
    } finally {
      if(mountedRef.current)setBusy(false);
    }
  };

  const removeItem = async (path: string) => {
    if(!mountedRef.current || !authValidRef.current)return;
    if (deletingPath !== path) {
      setDeletingPath(path);
      return;
    }
    const generation = vaultVisibilityGenerationRef.current;
    setBusy(true);
    setMessage("");
    try {
      await deletePrivateMedia(path);
      if(!mountedRef.current || !authValidRef.current || generation !== vaultVisibilityGenerationRef.current)return;
      setItems(current => current.filter(item => item.path !== path));
      setDeletingPath("");
      clearSignedUrl();
      setMessage(t("Bestand verwijderd.", "File deleted."));
    } catch (error) {
      if(mountedRef.current && authValidRef.current && generation === vaultVisibilityGenerationRef.current)setMessage(error instanceof Error ? error.message : t("Verwijderen is mislukt.", "Could not delete the file."));
    } finally {
      if(mountedRef.current)setBusy(false);
    }
  };

  return (
    <section className="media-vault auth-panel" aria-labelledby="media-vault-title">
      <span className="eyebrow">{t("PRIVÉOPSLAG", "PRIVATE STORAGE")}</span>
      <h3 id="media-vault-title">{assignmentTitle ? t("Opname bij opdracht", "Assignment capture") : t("Mijn privékluis", "My private vault")}</h3>
      {isAuthenticated&&assignmentTitle&&<div className="assignment-captions"><strong>{assignmentTitle}</strong>{assignmentTask&&<p>{assignmentTask}</p>}<small>{t("Media wordt opgeslagen in de privékluis onder de huidige sessie. De opdracht wordt niet als openbare metadata gepubliceerd.","Media is stored privately under the current session. Assignment details are not published as public metadata.")}</small></div>}
      <p>{t("Afbeeldingen, video en audio blijven privé. Open-links zijn maximaal 60 seconden geldig.", "Images, video and audio stay private. Open links are valid for up to 60 seconds.")}</p>
      {!supabaseConfigured ? (
        <small role="status">{t("Privéopslag verschijnt zodra Supabase is geconfigureerd.", "Private storage will appear once Supabase is configured.")}</small>
      ) : !isAuthenticated ? (
        <small role="status" aria-live="polite">{message || t("Log in via Session Control om je privékluis te openen.", "Sign in through Session Control to open your private vault.")}</small>
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
                <button type="button" onClick={()=>void movePhotoHistory(-1)} disabled={busy||photoHistoryIndex<=0} aria-label={t("Vorige bewerking","Undo last edit")}>{t("Ongedaan maken","Undo")}</button>
                <button type="button" onClick={()=>void movePhotoHistory(1)} disabled={busy||photoHistoryIndex<0||photoHistoryIndex>=photoHistory.length-1} aria-label={t("Bewerking opnieuw uitvoeren","Redo edit")}>{t("Opnieuw","Redo")}</button>
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
              <div className="media-photo-editor-presets" role="group" aria-label={t("Kleurpresets","Color presets")}>
                <strong>{t("SNELLE PRESETS","QUICK PRESETS")}</strong>
                <div>{photoEditPresets.map(preset=><button key={preset.id} type="button" className="media-photo-preset" onClick={()=>void updatePendingImageEdit(frameStyle,applyPhotoEditPreset(photoEdits,preset.id))} disabled={busy}>{language==="nl"?preset.titleNL:preset.titleEN}</button>)}</div>
              </div>
              <div className="media-photo-editor-grade">
                <strong>{t("KLEUR & LICHT","COLOR & LIGHT")}</strong>
                <label>{t("Helderheid","Brightness")} · {Math.round(photoEdits.brightness*100)}%
                  <input type="range" min="0.65" max="1.35" step="0.01" value={photoEdits.brightness} disabled={busy} onChange={event=>void updatePendingImageEdit(frameStyle,{...photoEdits,brightness:Number(event.target.value)})}/>
                </label>
                <label>{t("Contrast","Contrast")} · {Math.round(photoEdits.contrast*100)}%
                  <input type="range" min="0.7" max="1.4" step="0.01" value={photoEdits.contrast} disabled={busy} onChange={event=>void updatePendingImageEdit(frameStyle,{...photoEdits,contrast:Number(event.target.value)})}/>
                </label>
                <label>{t("Verzadiging","Saturation")} · {Math.round(photoEdits.saturation*100)}%
                  <input type="range" min="0" max="1.8" step="0.01" value={photoEdits.saturation} disabled={busy} onChange={event=>void updatePendingImageEdit(frameStyle,{...photoEdits,saturation:Number(event.target.value)})}/>
                </label>
                <label>{t("Kleurtemperatuur","Color temperature")} · {photoEdits.warmth>0?"+":""}{Math.round(photoEdits.warmth*100)}
                  <input type="range" min="-1" max="1" step="0.02" value={photoEdits.warmth} disabled={busy} onChange={event=>void updatePendingImageEdit(frameStyle,{...photoEdits,warmth:Number(event.target.value)})}/>
                </label>
              </div>
              <small>{t("Origineel blijft behouden tot je de bewerkte foto opslaat. Alle aanpassingen worden lokaal verwerkt.","The original is preserved until you save the edited photo. All adjustments are processed locally.")}</small>
            </div>}
            {pendingCapture&&pendingUrl&&<div className="media-pending-preview">
              <strong>{t("Lokale preview","Local preview")} · {formatSize(pendingCapture.size)}</strong>
              {pendingOriginalFile&&originalPreviewUrl&&<div className="media-photo-compare"><button type="button" onClick={()=>setShowOriginalPhoto(value=>!value)} aria-pressed={showOriginalPhoto} disabled={busy}>{showOriginalPhoto?t("Toon bewerkte versie","Show edited version"):t("Vergelijk met origineel","Compare with original")}</button><small>{showOriginalPhoto?t("Origineel, nog niet opgeslagen","Original, not saved yet"):t("Bewerkte preview","Edited preview")}</small></div>}
              {pendingCapture.type.startsWith("image/")?<img src={showOriginalPhoto&&originalPreviewUrl?originalPreviewUrl:pendingUrl} alt={showOriginalPhoto?t("Originele, onbewerkte foto","Original unedited photo"):t("Lokale voorbeeldweergave van geselecteerde afbeelding","Local preview of selected image")}/>:pendingCapture.type.startsWith("video/")?<video src={pendingUrl} controls playsInline/>:<audio src={pendingUrl} controls/>}
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
          {message && <small role="status" aria-live="polite" aria-atomic="true">{message}</small>}
        </>
      )}
    </section>
  );
}