import { useCallback, useEffect, useRef, useState } from "react";
import {
  createPrivateMediaUrl,
  deletePrivateMedia,
  listPrivateMedia,
  uploadPrivateMedia,
  type PrivateMediaItem,
} from "./services/media";
import { supabase, supabaseConfigured } from "./services/supabase";

interface MediaVaultProps {
  sessionId: string;
  language?: "nl" | "en";
}

function displayName(name: string): string {
  return name.replace(/^[0-9a-f-]{36}-/i, "");
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MediaVault({ sessionId, language = "nl" }: MediaVaultProps) {
  const t = (nl: string, en: string) => language === "nl" ? nl : en;
  const [items, setItems] = useState<PrivateMediaItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [signedUrl, setSignedUrl] = useState("");
  const [deletingPath, setDeletingPath] = useState("");
  const [captureKind,setCaptureKind] = useState<"video"|"voice">("video");
  const [captureConsent,setCaptureConsent] = useState(false);
  const [isRecording,setIsRecording] = useState(false);
  const [liveStream,setLiveStream] = useState<MediaStream|null>(null);
  const [pendingCapture,setPendingCapture] = useState<File|null>(null);
  const [pendingUrl,setPendingUrl] = useState("");
  const livePreviewRef = useRef<HTMLVideoElement|null>(null);
  const recorderRef = useRef<MediaRecorder|null>(null);
  const streamRef = useRef<MediaStream|null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const captureTimeoutRef = useRef<number|undefined>(undefined);


  useEffect(()=>{
    if(livePreviewRef.current) livePreviewRef.current.srcObject=liveStream;
  },[liveStream]);
  useEffect(()=>()=> {
    if(captureTimeoutRef.current!==undefined) window.clearTimeout(captureTimeoutRef.current);
    streamRef.current?.getTracks().forEach(track=>track.stop());
  },[]);
  useEffect(()=>{
    const currentUrl=pendingUrl;
    return ()=>{if(currentUrl)URL.revokeObjectURL(currentUrl);};
  },[pendingUrl]);

  const refresh = useCallback(async (isActive: () => boolean = () => true): Promise<boolean> => {
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

  const upload = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    setMessage("");
    setSignedUrl("");
    try {
      await uploadPrivateMedia(file, sessionId);
      const refreshed = await refresh();
      setMessage(
        refreshed
          ? t("Bestand veilig geüpload naar je privékluis.", "File safely uploaded to your private vault.")
          : t("Bestand is geüpload, maar de lijst kon niet worden vernieuwd. Tik op Vernieuwen om opnieuw te proberen.", "The file uploaded, but the list could not refresh. Tap Refresh to try again."),
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("Uploaden is mislukt.", "Upload failed."));
    } finally {
      setBusy(false);
    }
  };

  const stopCaptureTracks=()=>{
    streamRef.current?.getTracks().forEach(track=>track.stop());
    streamRef.current=null;
    recorderRef.current=null;
    setLiveStream(null);
    setIsRecording(false);
    if(captureTimeoutRef.current!==undefined){window.clearTimeout(captureTimeoutRef.current);captureTimeoutRef.current=undefined;}
  };

  const startCapture=async()=>{
    if(!captureConsent){
      setMessage(t("Bevestig eerst dat iedereen op de opname expliciet akkoord is met opnemen én privé opslaan.","First confirm that everyone recorded explicitly agrees to recording and private storage."));
      return;
    }
    if(typeof navigator.mediaDevices?.getUserMedia!=="function"||typeof MediaRecorder==="undefined"){
      setMessage(t("Opnemen wordt niet ondersteund door deze browser. Probeer een recente browser of gebruik Bestand kiezen.","Recording is not supported by this browser. Try a recent browser or choose a file instead."));
      return;
    }
    setMessage("");
    try{
      const stream=await navigator.mediaDevices.getUserMedia(captureKind==="video"
        ? {video:{facingMode:"user",width:{ideal:1280},height:{ideal:720}},audio:true}
        : {video:false,audio:true});
      streamRef.current=stream;
      setLiveStream(stream);
      chunksRef.current=[];
      const candidates=captureKind==="video"
        ? ["video/mp4","video/webm;codecs=vp8,opus","video/webm"]
        : ["audio/mp4","audio/webm;codecs=opus","audio/webm","audio/ogg;codecs=opus"];
      const mimeType=candidates.find(type=>MediaRecorder.isTypeSupported(type));
      const recorder=mimeType?new MediaRecorder(stream,{mimeType}):new MediaRecorder(stream);
      recorderRef.current=recorder;
      recorder.ondataavailable=event=>{if(event.data.size>0)chunksRef.current.push(event.data);};
      recorder.onerror=()=>{stopCaptureTracks();setMessage(t("De opname is onderbroken. Controleer de cameratoestemming en probeer opnieuw.","Recording was interrupted. Check camera permissions and try again."));};
      recorder.onstop=()=>{
        const type=recorder.mimeType|| (captureKind==="video"?"video/webm":"audio/webm");
        const blob=new Blob(chunksRef.current,{type});
        chunksRef.current=[];
        stopCaptureTracks();
        setCaptureConsent(false);
        if(blob.size===0){setMessage(t("Er is geen opname gemaakt.","No recording was created."));return;}
        if(blob.size>20*1024*1024){setMessage(t("De opname is groter dan 20 MB en is niet opgeslagen. Maak een kortere opname.","The recording exceeded 20 MB and was not saved. Make a shorter recording."));return;}
        const extension=type.includes("mp4")?".mp4":type.includes("ogg")?".ogg":".webm";
        const file=new File([blob],`after-hours-${captureKind}-${Date.now()}${extension}`,{type});
        if(pendingUrl)URL.revokeObjectURL(pendingUrl);
        setPendingCapture(file);
        setPendingUrl(URL.createObjectURL(blob));
        setMessage(t("Voorbeeld klaar. Controleer de opname en sla alleen op als je dat nog steeds wilt.","Preview ready. Review the recording and save it only if you still want to."));
      };
      recorder.start(1000);
      setIsRecording(true);
      setPendingCapture(null);
      if(pendingUrl){URL.revokeObjectURL(pendingUrl);setPendingUrl("");}
      captureTimeoutRef.current=window.setTimeout(()=>{
        if(recorder.state==="recording"){
          recorder.stop();
          setMessage(t("De opname is automatisch gestopt na 60 seconden.","Recording stopped automatically after 60 seconds."));
        }
      },60_000);
    }catch(error){
      stopCaptureTracks();
      setCaptureConsent(false);
      setMessage(error instanceof Error?t(error.message,"Recording could not start: "+error.message):t("Geen toegang tot camera of microfoon. Controleer de browsertoestemming.","Camera or microphone access was denied. Check browser permissions."));
    }
  };

  const stopCapture=()=>{
    const recorder=recorderRef.current;
    if(recorder&&recorder.state!=="inactive")recorder.stop();
  };

  const saveCapture=async()=>{
    if(!pendingCapture)return;
    await upload(pendingCapture);
    setPendingCapture(null);
    if(pendingUrl){URL.revokeObjectURL(pendingUrl);setPendingUrl("");}
    setCaptureConsent(false);
  };

  const discardCapture=()=>{
    setPendingCapture(null);
    if(pendingUrl){URL.revokeObjectURL(pendingUrl);setPendingUrl("");}
    setCaptureConsent(false);
    setMessage(t("Opname weggegooid. Er is niets geüpload.","Recording discarded. Nothing was uploaded."));
  };

  const openItem = async (item: PrivateMediaItem) => {
    setBusy(true);
    setMessage("");
    setSignedUrl("");
    try {
      setSignedUrl(await createPrivateMediaUrl(item.path));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("Het bestand kon niet worden geopend.", "The file could not be opened."));
    } finally {
      setBusy(false);
    }
  };

  const removeItem = async (path: string) => {
    if (deletingPath !== path) {
      setDeletingPath(path);
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      await deletePrivateMedia(path);
      setItems(current => current.filter(item => item.path !== path));
      setDeletingPath("");
      setSignedUrl("");
      setMessage(t("Bestand verwijderd.", "File deleted."));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("Verwijderen is mislukt.", "Could not delete the file."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="media-vault auth-panel" aria-labelledby="media-vault-title">
      <span className="eyebrow">{t("PRIVÉOPSLAG", "PRIVATE STORAGE")}</span>
      <h3 id="media-vault-title">{t("Mijn privékluis", "My private vault")}</h3>
      <p>{t("Afbeeldingen, video en audio blijven privé. Open-links zijn maximaal 60 seconden geldig.", "Images, video and audio stay private. Open links are valid for up to 60 seconds.")}</p>
      {!supabaseConfigured ? (
        <small role="status">{t("Privéopslag verschijnt zodra Supabase is geconfigureerd.", "Private storage will appear once Supabase is configured.")}</small>
      ) : (
        <>
          <label className="media-upload">
            <span>{busy ? t("Even wachten…", "Please wait…") : t("Afbeelding, video of audio kiezen", "Choose image, video or audio")}</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,image/avif,video/webm,video/mp4,audio/mpeg,audio/mp4,audio/aac,audio/wav,audio/x-wav,audio/ogg,audio/webm,audio/flac"
              disabled={busy}
              onChange={event => {
                const file = event.currentTarget.files?.[0];
                void upload(file);
                event.currentTarget.value = "";
              }}
            />
          </label>
          <section className="media-capture" aria-labelledby="media-capture-title">
            <span className="eyebrow">{t("CAMERA & STEM","CAMERA & VOICE")}</span>
            <h4 id="media-capture-title">{t("Maak een privéopname","Create a private recording")}</h4>
            <p>{t("Opnames zijn optioneel. Geef alleen toestemming wanneer iedereen vrij en duidelijk akkoord is. De opname wordt eerst lokaal getoond en pas na jouw keuze geüpload.","Recordings are optional. Proceed only when everyone freely and clearly agrees. The recording is previewed locally and uploaded only after you choose to save it.")}</p>
            <div className="media-capture-controls">
              <label>{t("Opnametype","Recording type")}<select value={captureKind} disabled={isRecording||busy} onChange={e=>setCaptureKind(e.target.value as "video"|"voice")}><option value="video">{t("Video met camera","Video with camera")}</option><option value="voice">{t("Alleen stem","Voice only")}</option></select></label>
              <label className="media-consent-check"><input type="checkbox" checked={captureConsent} disabled={isRecording||busy||!!pendingCapture} onChange={e=>setCaptureConsent(e.target.checked)}/><span>{t("Ik bevestig dat iedereen die wordt opgenomen expliciet akkoord is met deze opname en privéopslag. Delen vereist aparte toestemming.","I confirm that everyone recorded explicitly agrees to this recording and private storage. Sharing requires separate consent.")}</span></label>
              {!isRecording&&!pendingCapture&&<button type="button" onClick={()=>void startCapture()} disabled={busy||!captureConsent}>{t("Start opname · max. 60 sec.","Start recording · max 60 sec")}</button>}
              {isRecording&&<button type="button" className="media-stop-recording" onClick={stopCapture}>{t("Stop opname","Stop recording")}</button>}
            </div>
            {isRecording&&<div className="media-recording-status" role="status"><span/> {t("Opname actief. Je kunt op elk moment stoppen.","Recording is active. You can stop at any time.")}</div>}
            {liveStream&&<video className="media-live-preview" ref={livePreviewRef} autoPlay muted playsInline aria-label={t("Live cameravoorbeeld","Live camera preview")}/>}
            {pendingCapture&&pendingUrl&&<div className="media-pending-preview">
              <strong>{t("Lokale preview","Local preview")} · {formatSize(pendingCapture.size)}</strong>
              {pendingCapture.type.startsWith("video/")?<video src={pendingUrl} controls playsInline/>:<audio src={pendingUrl} controls/>}
              <div className="media-item-actions"><button type="button" onClick={()=>void saveCapture()} disabled={busy}>{t("Opslaan in privékluis","Save to private vault")}</button><button type="button" onClick={discardCapture} disabled={busy}>{t("Weggooien","Discard")}</button></div>
            </div>}
          </section>
          <div className="media-vault-head">
            <strong>{t("Opgeslagen bestanden", "Saved files")}</strong>
            <button type="button" onClick={() => void refresh()} disabled={loading || busy}>
              {loading ? t("Laden…", "Loading…") : t("Vernieuwen", "Refresh")}
            </button>
          </div>
          {loading ? <small>{t("Privébestanden laden…", "Loading private files…")}</small> : items.length === 0 ? (
            <small>{t("Nog geen bestanden gevonden. Je bestanden zijn alleen zichtbaar na veilig inloggen.", "No files yet. Your files are only visible after you sign in securely.")}</small>
          ) : (
            <div className="media-list">
              {items.map(item => (
                <div className="media-item" key={item.path}>
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
