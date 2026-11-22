import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Copy, Link2, MonitorSmartphone, Pause, Play, ShieldCheck, Users, Wifi, WifiOff } from "lucide-react";
import { supabase, supabaseConfigured } from "./services/supabase";
import { canResumeRemotePlay, canStartRemotePlay, canStartLocalPlay, shouldPauseRemotePlay, normalizeRoomCode, ROOM_CODE_LENGTH, saveLocalRoundAnswer, nextLocalPlayer, type LocalPlayer, type LocalRoundAnswers } from "./couplesPlayState";
import { acceptDuoInvitation, previewDuoInvitation, type DuoInvitationPreview } from "./services/duoRoomApi";

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
  const initialCode = useMemo(() => normalizeRoomCode(new URLSearchParams(window.location.search).get("couple")), []);
  const [mode, setMode] = useState<Mode>(initialCode ? "remote" : "local");
  const [roomCode, setRoomCode] = useState(initialCode);
  const [joinCode, setJoinCode] = useState(initialCode);
  const [localParticipantId] = useState(() => crypto.randomUUID());
  const [authenticatedUserId, setAuthenticatedUserId] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [incomingInviteToken, setIncomingInviteToken] = useState(() => new URLSearchParams(window.location.search).get("duoInvite") ?? "");
  const [incomingInvite, setIncomingInvite] = useState<DuoInvitationPreview | null>(null);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteAccepted, setInviteAccepted] = useState(false);
  const [inviteError, setInviteError] = useState("");
  // Identity hint only. Private-channel RLS is still required for trusted membership.
  const participantId = authenticatedUserId ?? localParticipantId;
  const [name, setName] = useState("");
  const [partnerName, setPartnerName] = useState("");
  const [myConsent, setMyConsent] = useState(false);
  const [localPartnerConsent, setLocalPartnerConsent] = useState(false);
  const [localTurn, setLocalTurn] = useState<LocalPlayer>("player1");
  const [localAnswer, setLocalAnswer] = useState("");
  const [localAnswers, setLocalAnswers] = useState<Record<number, LocalRoundAnswers>>({});
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
  const roundAnswers = localAnswers[round] ?? {};
  const saveCurrentLocalAnswer = () => {
    const nextAnswers = saveLocalRoundAnswer(roundAnswers, localTurn, localAnswer);
    if (nextAnswers === roundAnswers) return;
    setLocalAnswers(previous => ({ ...previous, [round]: nextAnswers }));
    setLocalAnswer("");
    setLocalTurn(nextLocalPlayer(localTurn));
  };
  const ready = mode === "local" ? canStartLocalPlay({ ownConsent: myConsent, partnerConsent: localPartnerConsent, ownName: name, partnerName }) : canStartRemotePlay({ connected, serverAuthorized: false, participantCount: participants.length, partnerPresent, ownConsent: myConsent, partnerConsent: partnerConsented });
  const inviteUrl = useMemo(() => {
    const url = new URL(window.location.href);
    url.search = "";
    url.hash = "";
    url.searchParams.set("couple", roomCode);
    return url.toString();
  }, [roomCode]);

  useEffect(() => {
    if (!incomingInviteToken) return;
    // Remove the bearer token from the address bar immediately; keep it only in
    // component memory until the invite is previewed or accepted.
    const url = new URL(window.location.href);
    url.searchParams.delete("duoInvite");
    window.history.replaceState({}, "", url.toString());
    if (!authChecked) return;
    if (!authenticatedUserId) {
      setInviteError(t("Log eerst in om deze persoonlijke uitnodiging veilig te bekijken.", "Sign in first to securely preview this personal invitation."));
      return;
    }
    let alive = true;
    setInviteLoading(true);
    void previewDuoInvitation(incomingInviteToken).then(preview => {
      if (alive) { setIncomingInvite(preview); setInviteError(""); }
    }).catch(error => {
      if (alive) setInviteError(error instanceof Error ? error.message : t("Uitnodiging kon niet worden geopend.", "The invitation could not be opened."));
    }).finally(() => { if (alive) setInviteLoading(false); });
    return () => { alive = false; };
  }, [incomingInviteToken, authChecked, authenticatedUserId]);

  const acceptIncomingInvite = async () => {
    if (!incomingInviteToken || !incomingInvite || inviteLoading) return;
    setInviteLoading(true);
    setInviteError("");
    try {
      await acceptDuoInvitation(incomingInviteToken);
      setInviteAccepted(true);
      setIncomingInviteToken("");
      setMessage(t("Je deelname en toestemming zijn vastgelegd. De ervaring blijft gepauzeerd totdat de host de volgende stap veilig activeert.", "Your participation and consent have been recorded. The experience remains paused until the host safely activates the next step."));
    } catch (error) {
      setInviteError(error instanceof Error ? error.message : t("Uitnodiging kon niet worden geaccepteerd.", "The invitation could not be accepted."));
    } finally {
      setInviteLoading(false);
    }
  };

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

    // SECURITY HOLD: the legacy room-code topic is public and is not bound to
    // verified room membership. Do not subscribe, track presence or expose
    // participant metadata until the private-room SQL migration is active and
    // this component is wired to joinSecureDuoRealtime().
    setConnected(false);
    setParticipants([]);
    setMessage(t(
      "Online Duo-lobby is tijdelijk uitgeschakeld tijdens de overstap naar beveiligde kamers. Lokaal samen spelen werkt wel.",
      "The online Duo lobby is temporarily disabled while secure rooms are being enabled. Local play is available."
    ));
    return;

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
      <p>{t("Speel samen op één apparaat, of bereid jullie privéverbinding voor.", "Play together on one device, or get your private connection ready.")}</p>
    </header>
    {incomingInviteToken && <section className="couples-lobby couples-invitation-review" aria-live="polite">
      <span className="eyebrow">PRIVATE DUO INVITATION</span>
      <h3>{t("Uitnodiging bekijken", "Review invitation")}</h3>
      {inviteLoading && <p>{t("Uitnodiging veilig ophalen…", "Securely loading invitation…")}</p>}
      {inviteError && <p role="alert">{inviteError}</p>}
      {incomingInvite && !inviteAccepted && <>
        <h4>{incomingInvite.title}</h4>
        <p>{incomingInvite.description}</p>
        <p className="couples-consent-note">{t("Bekijk eerst de inhoud. Alleen met de knop hieronder accepteer je de uitnodiging en geef je toestemming voor deelname. Je kunt altijd stoppen.", "Review the details first. Only the button below accepts the invitation and records your consent to participate. You can always stop.")}</p>
        <button type="button" className="couples-primary" disabled={inviteLoading} onClick={()=>void acceptIncomingInvite()}><ShieldCheck size={16}/>{t("Ik heb gelezen en stem in", "I have reviewed and consent")}</button>
      </>}
      {inviteAccepted && <p role="status">{t("Uitnodiging geaccepteerd.", "Invitation accepted.")}</p>}
    </section>}
    <div className="couples-mode-grid">
      <button type="button" className={mode === "local" ? "couples-mode-card selected" : "couples-mode-card"} onClick={() => { setMode("local"); setMyConsent(false); setLocalPartnerConsent(false); setStatus("lobby"); setRound(0); }} disabled={status === "active" || status === "paused"}>
        <MonitorSmartphone/><strong>{t("Lokaal samen", "Together locally")}</strong><span>{t("Eén telefoon, tablet of iPad. Om de beurt antwoorden.", "One phone, tablet or iPad. Take turns answering.")}</span>
      </button>
      <button type="button" className={mode === "remote" ? "couples-mode-card selected" : "couples-mode-card"} onClick={() => { setMode("remote"); setMyConsent(false); setStatus("lobby"); }} disabled={status === "active" || status === "paused"}>
        <Wifi/><strong>{t("Op afstand", "Long distance")}</strong><span>{t("Privé-uitnodigingen en beveiligde verbinding komen eraan.", "Private invitations and a secure connection are coming soon.")}</span>
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
      <button type="button" className="couples-primary" disabled={!ready} onClick={()=>{setLocalAnswers({});setLocalTurn("player1");setLocalAnswer("");void publish(0, "active");}}><Play size={16}/>{t("Start samen", "Start together")}</button>
    </section> : <section className="couples-lobby couples-remote-preview" aria-live="polite">
      <span className="eyebrow">REMOTE · PRIVATE DUO</span>
      <h3>{t("Beveiligde online Duo", "Secure online Duo")}</h3>
      <p className="couples-consent-note" role="status">{t(
        "Online samen spelen wordt voorbereid. De openbare kamercodes zijn bewust uitgeschakeld. Zodra de privé-kamers, persoonlijke uitnodigingen en toestemmingscontroles op de server actief en getest zijn, kun je hier veilig een partner uitnodigen.",
        "Online play is being prepared. Public room codes have been intentionally disabled. Once private rooms, personal invitations and server-side consent checks are active and tested, you will be able to invite a partner here securely."
      )}</p>
      <div className="couples-connection" role="status"><ShieldCheck size={17}/>{t("Privéverbinding nog niet geactiveerd", "Private connection not active yet")}</div>
      <p>{t("Je kunt ondertussen direct op één telefoon, tablet of iPad spelen via Lokaal samen.", "In the meantime, play together on one phone, tablet or iPad using Together locally.")}</p>
        </section>}
    {status !== "lobby" && <section className="couples-round">
      <div className="couples-round-top"><span className="eyebrow">{t("RONDE", "ROUND")} {round+1} / {prompts.length}</span><span className={"couples-status "+status}>{status==="active"?t("ACTIEF","ACTIVE"):status==="paused"?t("GEPAUZEERD","PAUSED"):t("GESTOPT","STOPPED")}</span></div>
      <div className="couples-progress"><span style={{width:((round+1)/prompts.length*100)+"%"}}/></div>
      <h3>{t("Samen afstemmen", "Check in together")}</h3>
      <div className="couples-question"><small>{t("PRAAT SAMEN", "TALK TOGETHER")}</small><strong>{language==="nl"?prompts[round].nl:prompts[round].en}</strong></div>
      {mode === "local" && <section className="couples-local-answer" aria-label={t("Antwoorden van beide spelers", "Both players' answers")}>
        <div className="couples-local-turn">
          <span className="eyebrow">{t("BEURT AAN", "TURN FOR")}</span>
          <strong>{localTurn === "player1" ? (name.trim() || t("Speler 1", "Player 1")) : (partnerName.trim() || t("Speler 2", "Player 2"))}</strong>
        </div>
        <label className="couples-local-answer-field">
          {t("Jullie antwoord", "Your answer")}
          <textarea value={localAnswer} onChange={event => setLocalAnswer(event.target.value)} maxLength={1000} rows={3} disabled={status !== "active"} placeholder={t("Typ hier jullie antwoord…", "Write your answer here…")} />
        </label>
        <button type="button" className="couples-secondary" onClick={saveCurrentLocalAnswer} disabled={status !== "active" || !localAnswer.trim()}>
          {t("Bewaar antwoord en wissel beurt", "Save answer and switch turn")}
        </button>
        <div className="couples-local-answer-status" aria-live="polite">
          <span>{roundAnswers.player1 ? "✓ " : "○ "}{name.trim() || t("Speler 1", "Player 1")}</span>
          <span>{roundAnswers.player2 ? "✓ " : "○ "}{partnerName.trim() || t("Speler 2", "Player 2")}</span>
        </div>
        {roundAnswers.player1 && roundAnswers.player2 && <div className="couples-local-reveal">
          <article><strong>{name.trim() || t("Speler 1", "Player 1")}</strong><p>{roundAnswers.player1}</p></article>
          <article><strong>{partnerName.trim() || t("Speler 2", "Player 2")}</strong><p>{roundAnswers.player2}</p></article>
        </div>}
        <p className="couples-consent-note">{t("Antwoorden blijven alleen tijdelijk op dit apparaat en worden niet naar de online kamer of een server verstuurd.", "Answers stay temporarily on this device and are not sent to the online room or a server.")}</p>
      </section>}
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
