import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Copy, Link2, MonitorSmartphone, Pause, Play, ShieldCheck, Users, Wifi, WifiOff } from "lucide-react";
import { supabase, supabaseConfigured } from "./services/supabase";
import { canResumeRemotePlay, canStartRemotePlay, shouldPauseRemotePlay, normalizeRoomCode, ROOM_CODE_LENGTH } from "./couplesPlayState";

type Language = "nl" | "en";
type Mode = "local" | "remote";
type PlayStatus = "lobby" | "active" | "paused" | "stopped";
type PresenceMeta = { [key: string]: unknown; participantId?: string; displayName?: string; consent?: boolean };
const prompts = [
  { nl: "Wat heb je vandaag nodig om je op je gemak te voelen?", en: "What do you need today to feel comfortable?" },
  { nl: "Welk signaal gebruiken jullie voor een korte pauze?", en: "What signal will you use for a short pause?" },
  { nl: "Wat zouden jullie vandaag graag samen willen ontdekken?", en: "What would you like to explore together today?" },
  { nl: "Wil je doorgaan, aanpassen, pauzeren of stoppen?", en: "Would you like to continue, adjust, pause, or stop?" },
  { nl: "Welke vorm van aftercare past nu bij jullie?", en: "What kind of aftercare would feel right now?" }
];
function newCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint8Array(ROOM_CODE_LENGTH);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, value => alphabet[value % alphabet.length]).join("");
}

export default function CouplesPlay({ language, onBack }: { language: Language; onBack: () => void }) {
  const t = (nl: string, en: string) => language === "nl" ? nl : en;
  // Legacy public room-code links are deliberately ignored. Remote rooms return
  // only after the account-bound invitation backend has been deployed and verified.
  const [mode, setMode] = useState<Mode>("local");
  const [roomCode, setRoomCode] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [localParticipantId] = useState(() => crypto.randomUUID());
  const [authenticatedUserId, setAuthenticatedUserId] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  // Identity hint only. Private-channel RLS is still required for trusted membership.
  const participantId = authenticatedUserId ?? localParticipantId;
  const [name, setName] = useState("");
  const [partnerName, setPartnerName] = useState("");
  const [myConsent, setMyConsent] = useState(false);
  const [localPartnerConsent, setLocalPartnerConsent] = useState(false);
  const [connected, setConnected] = useState(false);
  const [participants, setParticipants] = useState<PresenceMeta[]>([]);
  const [round, setRound] = useState(0);
  const [status, setStatus] = useState<PlayStatus>("lobby");
  const [message, setMessage] = useState("");
  const channelRef = useRef<any>(null);
  const consentRef = useRef(myConsent);
  const connectedRef = useRef(connected);
  consentRef.current = myConsent;
  connectedRef.current = connected;
  const partnerPresent = participants.some(person => person.participantId !== participantId);
  const partnerConsented = participants.some(person => person.participantId !== participantId && person.consent === true);
  const ready = mode === "local" ? myConsent && localPartnerConsent : canStartRemotePlay({ connected, serverAuthorized: false, participantCount: participants.length, partnerPresent, ownConsent: myConsent, partnerConsent: partnerConsented });
  const inviteUrl = useMemo(() => {
    const url = new URL(window.location.href);
    url.search = "";
    url.hash = "";
    url.searchParams.set("couple", roomCode);
    return url.toString();
  }, [roomCode]);

  useEffect(() => {
    if (!supabaseConfigured || !supabase) {
      setAuthChecked(true);
      setAuthenticatedUserId(null);
      return;
    }
    const client = supabase;
    let alive = true;
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
      if (!alive) return;
      setAuthenticatedUserId(session?.user?.id ?? null);
      setAuthChecked(true);
    });
    void client.auth.getUser().then(({ data, error }) => {
      if (!alive) return;
      setAuthenticatedUserId(error ? null : data.user?.id ?? null);
      setAuthChecked(true);
    });
    return () => { alive = false; subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (mode !== "remote" || !roomCode || !supabaseConfigured || !supabase) {
      setConnected(false);
      setParticipants([]);
      return;
    }
    if (!authChecked) return;
    // Never connect to the legacy public room-code topic. The new private-room
    // adapter is prepared separately and remains unavailable until its reviewed
    // database proposal is actually deployed and integration-tested.
    setConnected(false);
    setParticipants([]);
    setMessage(t(
      "Online Duo is tijdelijk uitgeschakeld terwijl de privé-uitnodigingen en serverbeveiliging worden afgerond. Gebruik voorlopig Lokaal samen.",
      "Online Duo is temporarily unavailable while private invitations and server-side access controls are completed. Use Together locally for now."
    ));
    return;
    if (!authenticatedUserId) {
      setConnected(false);
      setParticipants([]);
      setMessage(t(
        "Log eerst in met je AFTER HOURS-account om online Duo te gebruiken. Lokaal samen spelen blijft beschikbaar.",
        "Sign in to your AFTER HOURS account before using online Duo. Local play remains available."
      ));
      return;
    }
    let alive = true;
    const client = supabase;
    const channel = client.channel("couples-" + roomCode, { config: { presence: { key: participantId }, broadcast: { self: false } } });
    channelRef.current = channel;
    channel.on("presence", { event: "sync" }, () => {
      if (!alive) return;
      const liveParticipants = Object.values(channel.presenceState<PresenceMeta>()).flat();
      setParticipants(liveParticipants);
      // Keep the lobby honest: the Duo flow supports exactly two devices.
      // This is a UX guard only; server-side private-channel authorization is
      // still required before this room can be treated as access-controlled.
      const alreadyTracked = liveParticipants.some(person => person.participantId === participantId);
      if (!alreadyTracked && liveParticipants.length >= 2) {
        void channel.untrack();
        setConnected(false);
        setMessage(t(
          "Deze Duo-kamer zit vol. Er kunnen maximaal twee apparaten deelnemen.",
          "This Duo room is full. A maximum of two devices can participate."
        ));
      } else if (liveParticipants.length > 2) {
        setMessage(t(
          "Er zijn te veel apparaten in deze kamer. Starten blijft geblokkeerd totdat er precies twee deelnemers zijn.",
          "Too many devices are in this room. Starting stays blocked until exactly two participants remain."
        ));
      }
    });
    channel.on("broadcast", { event: "play-state" }, ({ payload }) => {
      if (!alive || !payload || typeof payload !== "object") return;
      const next = payload as { round?: number; status?: PlayStatus };
      const liveParticipants = Object.values(channel.presenceState<PresenceMeta>()).flat();
      if (next.status === "active" && !canStartRemotePlay({
        connected: connectedRef.current,
        serverAuthorized: false,
        participantCount: liveParticipants.length,
        partnerPresent: liveParticipants.some(person => person.participantId !== participantId),
        ownConsent: consentRef.current,
        partnerConsent: liveParticipants.some(person => person.participantId !== participantId && person.consent === true)
      })) {
        setStatus("paused");
        setMessage(t("Een start- of hervatverzoek is geweigerd: beide deelnemers moeten aanwezig zijn en instemmen.", "A start or resume request was rejected: both participants must be present and consenting."));
        return;
      }
      if (Number.isInteger(next.round) && next.round! >= 0 && next.round! < prompts.length) setRound(next.round!);
      if (["lobby", "active", "paused", "stopped"].includes(next.status || "")) setStatus(next.status!);
    });
    channel.on("broadcast", { event: "reset-consent" }, ({ payload }) => {
      if (alive) { setMyConsent(false); const stopped = (payload as { stopped?: boolean } | undefined)?.stopped === true; setStatus(stopped ? "stopped" : "lobby"); if (!stopped) setRound(0); }
    });
    channel.subscribe(async state => {
      if (!alive) return;
      if (state === "SUBSCRIBED") {
        const liveParticipants = Object.values(channel.presenceState<PresenceMeta>()).flat();
        if (liveParticipants.length >= 2 && !liveParticipants.some(person => person.participantId === participantId)) {
          setConnected(false);
          setMessage(t(
            "Deze Duo-kamer zit vol. Er kunnen maximaal twee apparaten deelnemen.",
            "This Duo room is full. A maximum of two devices can participate."
          ));
          return;
        }
        setConnected(true);
        await channel.track({ participantId, displayName: name.trim() || t("Deelnemer", "Participant"), consent: myConsent });
      } else if (state === "CHANNEL_ERROR" || state === "TIMED_OUT" || state === "CLOSED") {
        setConnected(false);
        setMessage(t("Verbinding verbroken. Probeer opnieuw verbinding te maken.", "Connection lost. Try reconnecting."));
      }
    });
    return () => {
      alive = false;
      channelRef.current = null;
      void client.removeChannel(channel);
    };
  }, [mode, roomCode, participantId, authChecked, authenticatedUserId]);

  useEffect(() => {
    if (mode === "remote" && connected && channelRef.current) {
      void channelRef.current.track({ participantId, displayName: name.trim() || t("Deelnemer", "Participant"), consent: myConsent });
    }
  }, [myConsent, name, connected, mode, participantId]);
  useEffect(() => {
    if (mode === "remote" && shouldPauseRemotePlay({ connected, active: status === "active", partnerPresent })) {
      setStatus("paused");
      setMessage(t("Je partner heeft de kamer verlaten. De ervaring is automatisch gepauzeerd.", "Your partner left the room. The experience paused automatically."));
    }
  }, [mode, connected, status, partnerPresent]);

  const publish = async (nextRound: number, nextStatus: PlayStatus) => {
    // Remote room-code broadcasts are not protected by account-bound private-channel
    // authorization yet. Fail closed: never allow an active remote session until the
    // server-side invitation and membership policies are implemented and verified.
    if (mode === "remote" && nextStatus === "active") {
      setStatus(status === "active" ? "paused" : "lobby");
      setMessage(t(
        "Online Duo is tijdelijk geblokkeerd totdat accountgebonden uitnodigingen en serverbeveiliging klaar zijn. Gebruik voorlopig Lokaal samen.",
        "Online Duo is temporarily disabled until account-bound invitations and server-side access controls are ready. Use Together locally for now."
      ));
      return false;
    }
    if (mode === "remote") {
      if (nextStatus === "active" && status !== "active") {
        const consentReady = status === "paused"
          ? canResumeRemotePlay({ connected, serverAuthorized: false, participantCount: participants.length, partnerPresent, ownConsent: myConsent, partnerConsent: partnerConsented })
          : canStartRemotePlay({ connected, serverAuthorized: false, participantCount: participants.length, partnerPresent, ownConsent: myConsent, partnerConsent: partnerConsented });
        if (!consentReady) {
          setMessage(t("Hervatten kan pas als precies twee deelnemers verbonden zijn en beiden opnieuw instemmen.", "Resume requires exactly two connected participants and fresh consent from both."));
          return false;
        }
      }
      const channel = channelRef.current;
      if (!connected || !channel) {
        if (nextStatus === "paused" || nextStatus === "stopped") {
          setRound(nextRound);
          setStatus(nextStatus);
        } else {
          setStatus(status === "active" ? "paused" : "lobby");
        }
        setMessage(t("Geen stabiele verbinding. De wijziging is lokaal veiliggesteld, maar niet met je partner gedeeld.", "Connection is not stable. The change was kept locally safe, but was not shared with your partner."));
        return false;
      }
      const result = await channel.send({ type: "broadcast", event: "play-state", payload: { round: nextRound, status: nextStatus } });
      if (result !== "ok") {
        if (nextStatus === "paused" || nextStatus === "stopped") {
          setRound(nextRound);
          setStatus(nextStatus);
        } else {
          setStatus(status === "active" ? "paused" : "lobby");
        }
        setMessage(t("Update niet gedeeld. De ervaring is lokaal gepauzeerd. Controleer de verbinding.", "Update not shared. The experience was paused locally. Check the connection."));
        return false;
      }
    }
    setRound(nextRound);
    setStatus(nextStatus);
    return true;
  };
  const createRoom = () => {
    setRoomCode(newCode());
    setMyConsent(false);
    setStatus("lobby");
    setRound(0);
  };
  const shareInvite = async () => {
    try {
      if (navigator.share) await navigator.share({ title: "AFTER HOURS Duo", text: t("Kom naar onze Duo-kamer met code.", "Join our Duo room with a code."), url: inviteUrl });
      else { await navigator.clipboard.writeText(inviteUrl); setMessage(t("Uitnodigingslink gekopieerd.", "Invite link copied.")); }
    } catch { setMessage(t("Delen is niet gelukt. Deel de kamercode handmatig.", "Could not share. Send the room code manually.")); }
  };
  const stop = async () => {
    setMyConsent(false);
    setLocalPartnerConsent(false);
    if (mode === "remote" && channelRef.current) {
      await channelRef.current.send({ type: "broadcast", event: "reset-consent", payload: { stopped: true } });
    }
    await publish(round, "stopped");
  };
  const leave = async () => {
    if (status === "active" || status === "paused") await stop();
    onBack();
  };

  return <main className="couples-play-screen ah-editorial-screen">
    <header className="couples-play-header">
      <button type="button" className="couples-back" onClick={leave}><ArrowLeft size={17}/>{t("Terug", "Back")}</button>
      <span className="eyebrow">AFTER HOURS · DUO EXPERIENCE</span>
      <h2>{t("Samen spelen", "Play together")}</h2>
      <p>{t("Kies samen op één apparaat of speel ieder vanaf je eigen locatie.", "Play together on one device or each from your own location.")}</p>
    </header>
    <div className="couples-mode-grid">
      <button type="button" className={mode === "local" ? "couples-mode-card selected" : "couples-mode-card"} onClick={() => { setMode("local"); setMyConsent(false); setLocalPartnerConsent(false); setStatus("lobby"); setRound(0); }} disabled={status === "active" || status === "paused"}>
        <MonitorSmartphone/><strong>{t("Lokaal samen", "Together locally")}</strong><span>{t("Eén telefoon, tablet of iPad. Om de beurt antwoorden.", "One phone, tablet or iPad. Take turns answering.")}</span>
      </button>
      <button type="button" className="couples-mode-card" disabled aria-describedby="couples-remote-unavailable">
        <Wifi/><strong>{t("Op afstand · binnenkort", "Long distance · coming soon")}</strong><span id="couples-remote-unavailable">{t("Wordt opnieuw opgebouwd met privé-uitnodigingen en accountbeveiliging.", "Being rebuilt with private invitations and account-level access controls.")}</span>
      </button>
    </div>
    {mode === "local" ? <section className="couples-lobby">
      <span className="eyebrow">LOCAL · SHARED DEVICE</span><h3>{t("Jullie namen", "Your names")}</h3>
      <div className="couples-name-fields">
        <label>{t("Speler 1", "Player 1")}<input value={name} onChange={e=>setName(e.target.value)} maxLength={24} placeholder={t("Naam speler 1", "Player 1 name")}/></label>
        <label>{t("Speler 2", "Player 2")}<input value={partnerName} onChange={e=>setPartnerName(e.target.value)} maxLength={24} placeholder={t("Naam speler 2", "Player 2 name")}/></label>
      </div>
      <label className="couples-consent"><input type="checkbox" checked={myConsent} onChange={e=>setMyConsent(e.target.checked)}/><span>{t("Speler 1 stemt vrijwillig in.", "Player 1 freely consents.")}</span></label>
      <label className="couples-consent"><input type="checkbox" checked={localPartnerConsent} onChange={e=>setLocalPartnerConsent(e.target.checked)}/><span>{t("Speler 2 stemt vrijwillig in.", "Player 2 freely consents.")}</span></label>
      <button type="button" className="couples-primary" disabled={!ready} onClick={()=>void publish(0, "active")}><Play size={16}/>{t("Start samen", "Start together")}</button>
    </section> : <section className="couples-lobby">
      <span className="eyebrow">REMOTE · ROOM CODE</span><h3>{t("Verbind jullie apparaten", "Connect your devices")}</h3>
      {!supabaseConfigured ? <p role="alert">{t("Online koppelspel vereist een geconfigureerde realtime-verbinding. Lokaal spelen blijft beschikbaar.", "Online couple play requires a configured realtime connection. Local play remains available.")}</p> : <>
        {!roomCode ? <div className="couples-room-entry">
          <label className="couples-join-code">{t("Kamercode invoeren", "Enter room code")}<input value={joinCode} onChange={e=>setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,ROOM_CODE_LENGTH))} maxLength={ROOM_CODE_LENGTH} autoComplete="off" placeholder={t("16 tekens", "16 characters")}/></label>
          <button type="button" className="couples-primary" disabled={normalizeRoomCode(joinCode) === ""} onClick={()=>{setRoomCode(joinCode);setMyConsent(false);setStatus("lobby");setRound(0);}}><Link2 size={16}/>{t("Deelnemen aan kamer met code", "Join room with a code")}</button>
          <span className="couples-entry-divider">{t("of maak zelf een kamer aan", "or create your own room")}</span>
          <button type="button" className="couples-secondary" onClick={createRoom}><Users size={16}/>{t("Maak een kamer met code", "Create a room with a code")}</button>
        </div> : <>
          <div className="couples-room-code"><small>{t("JULLIE KAMERCODE", "YOUR ROOM CODE")}</small><strong>{roomCode}</strong><button type="button" onClick={()=>void shareInvite()}><Copy size={15}/>{t("Deel uitnodiging", "Share invite")}</button></div>
          <div className="couples-connection" role="status">{connected ? <><Wifi size={17}/>{t("Verbonden met de kamer met code", "Connected to room with a code")}</> : <><WifiOff size={17}/>{t("Verbinding maken…", "Connecting…")}</>}</div>
          <p className="couples-consent-note" role="alert">{t("Online Duo is momenteel alleen als technische preview beschikbaar. Starten is geblokkeerd totdat uitnodigingen aan accounts zijn gekoppeld en de server de kamertoegang afdwingt. Gebruik Lokaal samen voor een sessie.", "Online Duo is currently a technical preview only. Starting is blocked until invitations are account-bound and the server enforces room access. Use Together locally for a session.")}</p>
          <label className="couples-join-code">{t("Jouw naam", "Your name")}<input value={name} onChange={e=>setName(e.target.value)} maxLength={24} placeholder={t("Naam", "Name")}/></label>
          <div className="couples-presence"><Users size={17}/><strong>{participants.length} / 2</strong><span>{partnerPresent ? t("Partner is aanwezig", "Partner is here") : t("Wachten op je partner…", "Waiting for your partner…")}</span></div>
          <label className="couples-consent"><input type="checkbox" checked={myConsent} onChange={e=>{setMyConsent(e.target.checked);if(!e.target.checked){setStatus("lobby");void channelRef.current?.send({type:"broadcast",event:"reset-consent",payload:{stopped:false}});}}}/><span>{t("Ik stem vrijwillig in met deze ervaring.", "I freely consent to this experience.")}</span></label>
          <p className="couples-consent-note">{t("Starten kan pas als beide deelnemers verbonden zijn en ieder afzonderlijk instemt.", "Play starts only when both participants are connected and each consents separately.")}</p>
          <button type="button" className="couples-primary" disabled={!ready} onClick={()=>void publish(0,"active")}><Play size={16}/>{t("Start samen", "Start together")}</button>
        </>}
      </>}
    </section>}
    {status !== "lobby" && <section className="couples-round">
      <div className="couples-round-top"><span className="eyebrow">{t("RONDE", "ROUND")} {round+1} / {prompts.length}</span><span className={"couples-status "+status}>{status==="active"?t("ACTIEF","ACTIVE"):status==="paused"?t("GEPAUZEERD","PAUSED"):t("GESTOPT","STOPPED")}</span></div>
      <div className="couples-progress"><span style={{width:((round+1)/prompts.length*100)+"%"}}/></div>
      <h3>{t("Samen afstemmen", "Check in together")}</h3>
      <div className="couples-question"><small>{t("PRAAT SAMEN", "TALK TOGETHER")}</small><strong>{language==="nl"?prompts[round].nl:prompts[round].en}</strong></div>
      <div className="couples-round-actions">
        <button type="button" onClick={()=>void publish(Math.max(0,round-1),"active")} disabled={round===0||status!=="active"}>{t("Vorige", "Previous")}</button>
        <button type="button" onClick={()=>void publish(round,status==="paused"?"active":"paused")} disabled={status==="stopped"||(status==="paused"&&mode==="remote"&&!canResumeRemotePlay({connected,serverAuthorized:false,participantCount:participants.length,partnerPresent,ownConsent:myConsent,partnerConsent:partnerConsented}))}><Pause size={15}/>{status==="paused"?t("Hervat","Resume"):t("Pauze","Pause")}</button>
        <button type="button" className="couples-primary" onClick={()=>void publish(Math.min(prompts.length-1,round+1),"active")} disabled={round===prompts.length-1||status!=="active"}>{t("Volgende", "Next")}</button>
      </div>
      <button type="button" className="couples-stop" onClick={()=>void stop()}><ShieldCheck size={16}/>{t("Stop de ervaring", "Stop experience")}</button>{status === "stopped" && <button type="button" className="couples-primary" onClick={() => void publish(0, "lobby")}>{t("Terug naar de lobby", "Return to lobby")}</button>}
    </section>}
    <aside className="couples-safety"><ShieldCheck size={18}/><p>{t("Consent kan altijd worden ingetrokken. Pauze en stop hebben direct voorrang. De kamercode is geen vervanging voor privacy of persoonlijke afspraken.", "Consent can always be withdrawn. Pause and stop always take priority. A room code is not a substitute for privacy or personal boundaries.")}</p></aside>
    {message && <p className="couples-message" role="status">{message}</p>}
    <button type="button" className="couples-back-bottom" onClick={leave}>{t("Terug naar ervaringen", "Back to experiences")}</button>
  </main>;
}
