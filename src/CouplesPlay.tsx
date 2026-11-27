import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Copy, Link2, MonitorSmartphone, Pause, Play, ShieldCheck, Users, Wifi, WifiOff } from "lucide-react";
import { supabase, supabaseConfigured } from "./services/supabase";
import { canResumeRemotePlay, canStartLocalPlay, canStartRemotePlay, shouldPauseRemotePlay, normalizeRoomCode, ROOM_CODE_LENGTH } from "./couplesPlayState";

type Language = "nl" | "en";
type Mode = "local" | "remote";
type PlayStatus = "lobby" | "active" | "paused" | "stopped" | "completed";
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

export default function CouplesPlay({ language, onBack, onOpenInvitations }: { language: Language; onBack: () => void; onOpenInvitations: () => void }) {
  const t = (nl: string, en: string) => language === "nl" ? nl : en;
  // Legacy room-code links are intentionally not joined: they lack account-bound private-channel authorization.
  const [mode, setMode] = useState<Mode>("local");
  const [roomCode] = useState("");
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
  const statusRef = useRef<PlayStatus>(status);
  statusRef.current = status;
  const [localTurn, setLocalTurn] = useState<1 | 2>(1);
  const [answerDraft, setAnswerDraft] = useState("");
  const [localAnswers, setLocalAnswers] = useState<Array<{ round: number; player: 1 | 2; answer: string }>>([]);
  const [message, setMessage] = useState("");
  const channelRef = useRef<any>(null);
  const consentRef = useRef(myConsent);
  const connectedRef = useRef(connected);
  consentRef.current = myConsent;
  connectedRef.current = connected;
  const partnerPresent = participants.some(person => person.participantId !== participantId);
  const partnerConsented = participants.some(person => person.participantId !== participantId && person.consent === true);
  const ready = mode === "local" ? canStartLocalPlay(myConsent, localPartnerConsent) : canStartRemotePlay({ connected, serverAuthorized: false, participantCount: participants.length, partnerPresent, ownConsent: myConsent, partnerConsent: partnerConsented });
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
      if (["lobby", "active", "paused", "stopped", "completed"].includes(next.status || "")) setStatus(next.status!);
    });
    channel.on("broadcast", { event: "reset-consent" }, ({ payload }) => {
      if (alive) { setMyConsent(false); const stopped = (payload as { stopped?: boolean } | undefined)?.stopped === true; setStatus(stopped ? "stopped" : statusRef.current === "active" || statusRef.current === "paused" ? "paused" : "lobby"); if (stopped) setAnswerDraft(""); }
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
        // A reconnect is a fresh safety boundary. Never carry consent or auto-resume.
        setMyConsent(false);
        await channel.track({ participantId, displayName: name.trim() || t("Deelnemer", "Participant"), consent: false });
        if (statusRef.current === "active" || statusRef.current === "paused") {
          setStatus("paused");
          await channel.send({ type: "broadcast", event: "reset-consent", payload: { stopped: false } });
        }
        setConnected(true);
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
      setMyConsent(false);
      setMessage(t("Je partner heeft de kamer verlaten. De ervaring is automatisch gepauzeerd. Beide deelnemers moeten opnieuw instemmen.", "Your partner left the room. The experience paused automatically. Both participants must consent again."));
      const channel = channelRef.current;
      if (channel) void channel.send({ type: "broadcast", event: "reset-consent", payload: { stopped: false } }).catch(() => {});
    }
  }, [mode, connected, status, partnerPresent]);

  useEffect(() => {
    if (mode !== "remote") return;
    const pauseForInterruption = () => {
      if (status !== "active") return;
      setStatus("paused");
      setMyConsent(false);
      setMessage(t("Verbinding of scherm onderbroken. De Duo-ervaring is gepauzeerd. Beide spelers moeten opnieuw instemmen.", "Connection or screen interrupted. Duo is paused. Both players must consent again."));
      const channel = channelRef.current;
      if (channel) {
        void channel.send({ type: "broadcast", event: "play-state", payload: { round, status: "paused" } }).catch(() => {});
        void channel.send({ type: "broadcast", event: "reset-consent", payload: { stopped: false } }).catch(() => {});
      }
    };
    const handleOffline = () => pauseForInterruption();
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") pauseForInterruption();
    };
    window.addEventListener("offline", handleOffline);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.removeEventListener("offline", handleOffline);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [mode, status, round, language]);

  const publish = async (nextRound: number, nextStatus: PlayStatus) => {
    if (mode === "local" && nextStatus === "active" && !canStartLocalPlay(myConsent, localPartnerConsent)) {
      setMessage(t("Beide spelers moeten opnieuw afzonderlijk instemmen voordat jullie starten of hervatten.", "Both players must separately consent again before starting or resuming."));
      return false;
    }
    // PAUSE and STOP are local-first: a slow or failed network must never delay safety.
    if (nextStatus === "paused" || nextStatus === "stopped") {
      setRound(nextRound);
      setStatus(nextStatus);
    }
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
      let result: string;
      try {
        result = await channel.send({ type: "broadcast", event: "play-state", payload: { round: nextRound, status: nextStatus } });
      } catch {
        result = "error";
      }
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
  const startLocal = () => {
    setLocalTurn(1);
    setAnswerDraft("");
    setLocalAnswers([]);
    setRound(0);
    void publish(0, "active");
  };
  const submitLocalAnswer = () => {
    const answer = answerDraft.trim();
    if (!answer || mode !== "local" || status !== "active") return;
    setLocalAnswers(current => [...current, { round, player: localTurn, answer }]);
    setAnswerDraft("");
    if (localTurn === 1) {
      setLocalTurn(2);
      setMessage(t("Antwoord opgeslagen op dit apparaat. Geef het toestel aan speler 2.", "Answer saved on this device. Pass the device to Player 2."));
      return;
    }
    if (round < prompts.length - 1) {
      setRound(current => current + 1);
      setLocalTurn(1);
      setMessage(t("Beide antwoorden zijn opgeslagen. Speler 1 is aan de beurt bij de volgende vraag.", "Both answers are saved. Player 1 goes first on the next prompt."));
      return;
    }
    setStatus("completed");
    setMyConsent(false);
    setLocalPartnerConsent(false);
    setMessage(t("Jullie Duo-ervaring is afgerond. Neem samen rustig de tijd voor aftercare.", "Your Duo experience is complete. Take time together for aftercare."));
  };
  const returnToLobby = () => {
    setStatus("lobby");
    setRound(0);
    setMyConsent(false);
    setLocalPartnerConsent(false);
    setAnswerDraft("");
    setLocalAnswers([]);
    setLocalTurn(1);
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
  const stop = () => {
    setMyConsent(false);
    setLocalPartnerConsent(false);
    setStatus("stopped");
    setAnswerDraft("");
    setLocalAnswers([]);
    const channel = channelRef.current;
    if (mode === "remote" && channel) {
      void channel.send({ type: "broadcast", event: "reset-consent", payload: { stopped: true } }).catch(() => {});
    }
    void publish(round, "stopped");
  };
  const leave = async () => {
    if (status === "active" || status === "paused") stop();
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
      <button type="button" className={mode === "remote" ? "couples-mode-card selected" : "couples-mode-card"} onClick={() => { setMode("remote"); setMyConsent(false); setStatus("lobby"); }} disabled={status === "active" || status === "paused"}>
        <Wifi/><strong>{t("Op afstand", "Long distance")}</strong><span>{t("Gebruik een privé-uitnodiging die aan accounts en toestemming is gekoppeld.", "Use a private invitation tied to accounts and consent.")}</span>
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
      <button type="button" className="couples-primary" disabled={!ready} onClick={startLocal}><Play size={16}/>{t("Start samen", "Start together")}</button>
    </section> : <section className="couples-lobby">
      <span className="eyebrow">REMOTE · PRIVATE INVITATION</span>
      <h3>{t("Online samen spelen", "Play together online")}</h3>
      <p role="status">{t("Kamercodes zijn uitgeschakeld omdat ze geen accountgebonden toegang garanderen. Gebruik de beveiligde uitnodigingsruimte: de ontvanger logt in met een eigen account, bekijkt de scène en geeft afzonderlijk toestemming. Hervatten kan pas nadat alle deelnemers opnieuw hebben ingestemd.", "Room codes are disabled because they do not guarantee account-bound access. Use the secure invitation area: the recipient signs in with their own account, reviews the scene and gives separate consent. Resuming is blocked until every participant consents again.")}</p>
      <button type="button" className="couples-primary" onClick={onOpenInvitations}><ShieldCheck size={16}/>{t("Open Secret Invitation", "Open Secret Invitation")}</button>
      <p className="couples-consent-note">{t("Online Duo blijft geblokkeerd totdat de privé-uitnodiging en serverbeveiliging zijn geverifieerd. Lokaal samen spelen blijft beschikbaar.", "Online Duo remains blocked until private invitations and server-side access controls are verified. Local play remains available.")}</p>
    </section>}
    {status !== "lobby" && <section className="couples-round">
      <div className="couples-round-top"><span className="eyebrow">{t("RONDE", "ROUND")} {round+1} / {prompts.length}</span><span className={"couples-status "+status}>{status==="active"?t("ACTIEF","ACTIVE"):status==="paused"?t("GEPAUZEERD","PAUSED"):status==="completed"?t("AFGEROND","COMPLETED"):t("GESTOPT","STOPPED")}</span></div>
      <div className="couples-progress"><span style={{width:((round+1)/prompts.length*100)+"%"}}/></div>
      <h3>{t("Samen afstemmen", "Check in together")}</h3>
      <div className="couples-question"><small>{t("PRAAT SAMEN", "TALK TOGETHER")}</small><strong>{language==="nl"?prompts[round].nl:prompts[round].en}</strong></div>
      {mode === "local" && status === "active" && <div className="couples-local-turn">
        <label>{t("ANTWOORD VAN SPELER " + localTurn, "PLAYER " + localTurn + " ANSWER")}<textarea value={answerDraft} onChange={event => setAnswerDraft(event.target.value)} maxLength={1000} rows={3} placeholder={t("Schrijf hier je antwoord. Dit blijft alleen in deze sessie op dit apparaat.", "Write your answer here. It stays only in this session on this device.")}/></label>
        <button type="button" className="couples-primary" onClick={submitLocalAnswer} disabled={!answerDraft.trim()}>{localTurn === 1 ? t("Opslaan en wisselen naar speler 2", "Save and pass to Player 2") : t("Opslaan en volgende vraag", "Save and continue")}</button>
        <small>{t(localAnswers.filter(item => item.round === round).length + " van 2 antwoorden voor deze vraag opgeslagen.", localAnswers.filter(item => item.round === round).length + " of 2 answers saved for this prompt.")}</small>
      </div>}
      {mode === "local" && status === "paused" && <div className="couples-local-consent">
        <p>{t("Hervatten vraagt om nieuwe toestemming van beide spelers.", "Resuming requires fresh consent from both players.")}</p>
        <label className="couples-consent"><input type="checkbox" checked={myConsent} onChange={event => setMyConsent(event.target.checked)}/><span>{t("Speler 1 stemt opnieuw in.", "Player 1 consents again.")}</span></label>
        <label className="couples-consent"><input type="checkbox" checked={localPartnerConsent} onChange={event => setLocalPartnerConsent(event.target.checked)}/><span>{t("Speler 2 stemt opnieuw in.", "Player 2 consents again.")}</span></label>
        <button type="button" className="couples-primary" disabled={!ready} onClick={() => void publish(round, "active")}>{t("Hervat met nieuwe toestemming", "Resume with fresh consent")}</button>
      </div>}
      <div className="couples-round-actions">
        {mode === "remote" && <>
          <button type="button" onClick={()=>void publish(Math.max(0,round-1),"active")} disabled={round===0||status!=="active"}>{t("Vorige", "Previous")}</button>
          <button type="button" onClick={()=>void publish(round,status==="paused"?"active":"paused")} disabled={status==="stopped"||(status==="paused"&&!canResumeRemotePlay({connected,serverAuthorized:false,participantCount:participants.length,partnerPresent,ownConsent:myConsent,partnerConsent:partnerConsented}))}><Pause size={15}/>{status==="paused"?t("Hervat","Resume"):t("Pauze", "Pause")}</button>
          <button type="button" className="couples-primary" onClick={()=>void publish(Math.min(prompts.length-1,round+1),"active")} disabled={round===prompts.length-1||status!=="active"}>{t("Volgende", "Next")}</button>
        </>}
        {mode === "local" && status === "active" && <button type="button" onClick={() => { setMyConsent(false); setLocalPartnerConsent(false); void publish(round, "paused"); }}><Pause size={15}/>{t("Pauze", "Pause")}</button>}
      </div>
      {(status === "active" || status === "paused") && <button type="button" className="couples-stop" onClick={stop}><ShieldCheck size={16}/>{t("Stop de ervaring", "Stop experience")}</button>}
      {(status === "stopped" || status === "completed") && <>
        {status === "completed" && <p>{t(localAnswers.length + " antwoorden zijn alleen tijdelijk op dit apparaat bewaard.", localAnswers.length + " answers were kept only temporarily on this device.")}</p>}
        <button type="button" className="couples-primary" onClick={returnToLobby}>{t("Terug naar de lobby", "Return to lobby")}</button>
      </>}
    </section>}
    <aside className="couples-safety"><ShieldCheck size={18}/><p>{t("Consent kan altijd worden ingetrokken. Pauze en stop hebben direct voorrang. De kamercode is geen vervanging voor privacy of persoonlijke afspraken.", "Consent can always be withdrawn. Pause and stop always take priority. A room code is not a substitute for privacy or personal boundaries.")}</p></aside>
    {message && <p className="couples-message" role="status">{message}</p>}
    <button type="button" className="couples-back-bottom" onClick={leave}>{t("Terug naar ervaringen", "Back to experiences")}</button>
  </main>;
}
