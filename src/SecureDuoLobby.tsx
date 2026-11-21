import { useCallback, useEffect, useState } from "react";
import {
  advanceSecureDuoSession,
  getSecureDuoRoomState,
  setSecureDuoConsent,
  setSecureDuoRoomState,
  type SecureDuoRoomSnapshot,
} from "./services/duoRooms";

type Language = "nl" | "en";
type Props = { roomId: string; language: Language; onBack: () => void };

const sharedPrompts = [
  { nl: "Wat heb je vandaag nodig om je op je gemak te voelen?", en: "What do you need today to feel comfortable?" },
  { nl: "Welk signaal gebruiken jullie voor een korte pauze?", en: "What signal will you use for a short pause?" },
  { nl: "Wat zouden jullie vandaag graag samen willen ontdekken?", en: "What would you like to explore together today?" },
  { nl: "Wil je doorgaan, aanpassen, pauzeren of stoppen?", en: "Would you like to continue, adjust, pause, or stop?" },
  { nl: "Welke vorm van aftercare past nu bij jullie?", en: "What kind of aftercare would feel right now?" },
];

/**
 * Secure Duo lobby. Database RPC snapshots are authoritative; Realtime events
 * may later be added as refresh hints, never as proof of consent or membership.
 * Keep dormant until the reviewed SQL proposal is deployed and two-account
 * integration tests have passed.
 */
export default function SecureDuoLobby({ roomId, language, onBack }: Props) {
  const nl = language === "nl";
  const [snapshot, setSnapshot] = useState<SecureDuoRoomSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  // Each browser keeps its own aftercare choices locally; nothing is written to Supabase.
  const [aftercareChoices, setAftercareChoices] = useState<string[]>([]);

  const refresh = useCallback(async () => {
    try {
      const next = await getSecureDuoRoomState(roomId);
      setSnapshot(next);
      setError("");
    } catch (reason) {
      setError(reason instanceof Error
        ? reason.message
        : (nl ? "De kamerstatus kon niet worden opgehaald." : "The room status could not be loaded."));
    } finally {
      setLoading(false);
    }
  }, [roomId, nl]);

  useEffect(() => {
    let alive = true;
    let inFlight = false;
    const load = async () => {
      if (inFlight) return;
      inFlight = true;
      try {
        const next = await getSecureDuoRoomState(roomId);
        if (alive) {
          setSnapshot(next);
          setError("");
        }
      } catch (reason) {
        if (alive) setError(reason instanceof Error
          ? reason.message
          : (nl ? "De kamerstatus kon niet worden opgehaald." : "The room status could not be loaded."));
      } finally {
        inFlight = false;
        if (alive) setLoading(false);
      }
    };
    void load();
    const interval = window.setInterval(() => void load(), 5000);
    return () => { alive = false; window.clearInterval(interval); };
  }, [roomId, nl]);

  const act = async (action: () => Promise<void>, success: string, failure: string) => {
    if (busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await action();
      setNotice(success);
      await refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : failure);
    } finally {
      setBusy(false);
    }
  };

  const own = snapshot?.members.find(member => member.isSelf);
  const partner = snapshot?.members.find(member => !member.isSelf);
  const bothConsented = snapshot?.members.length === 2
    && snapshot.members.every(member => member.consented);
  const isHost = own?.role === "host";
  const isStopped = snapshot?.status === "stopped";
  const activePrompt = snapshot ? sharedPrompts[snapshot.session.step] : null;
  const canStart = isHost && bothConsented
    && (snapshot?.status === "lobby" || snapshot?.status === "paused");

  const statusText = (status: SecureDuoRoomSnapshot["status"]) => ({
    lobby: nl ? "Wachtkamer" : "Lobby",
    active: nl ? "Actief" : "Active",
    paused: nl ? "Gepauzeerd" : "Paused",
    stopped: nl ? "Gestopt" : "Stopped",
  })[status];

  return (
    <main className="couples-play-screen ah-editorial-screen">
      <section className="couples-lobby" aria-labelledby="secure-duo-lobby-title">
        <span className="eyebrow">AFTER HOURS · PRIVATE DUO</span>
        <h2 id="secure-duo-lobby-title">{nl ? "Jullie privé-wachtkamer" : "Your private lobby"}</h2>
        {loading && !snapshot ? (
          <p role="status">{nl ? "Beveiligde kamerstatus ophalen…" : "Loading secure room status…"}</p>
        ) : snapshot ? (
          <>
            <div className="couples-connection" role="status">
              {nl ? "Kamersituatie: " : "Room status: "}{statusText(snapshot.status)}
            </div>
            <div className="couples-consent-note">
              <strong>{nl ? "Jouw toestemming" : "Your consent"}</strong>
              <p>{own?.consented
                ? (nl ? "Je hebt ingestemd." : "You have consented.")
                : (nl ? "Je hebt nog niet ingestemd." : "You have not consented yet.")}</p>
            </div>
            <div className="couples-consent-note">
              <strong>{nl ? "Tweede deelnemer" : "Second participant"}</strong>
              <p>{partner
                ? (partner.consented
                    ? (nl ? "Aanwezig in de kamer en heeft ingestemd." : "In the room and has consented.")
                    : (nl ? "Deelnemer heeft nog niet ingestemd." : "Participant has not consented yet."))
                : (nl ? "Wacht op acceptatie van de persoonlijke uitnodiging." : "Waiting for the personal invitation to be accepted.")}</p>
            </div>
            {snapshot.status === "active" && activePrompt && (
              <section className="couples-consent-note" aria-live="polite" aria-label={nl ? "Gedeelde spelstap" : "Shared game step"}>
                <strong>{nl ? "Gedeelde stap" : "Shared step"} {snapshot.session.step + 1} / {sharedPrompts.length}</strong>
                <p>{nl ? activePrompt.nl : activePrompt.en}</p>
                <div className="couples-actions">
                  <button
                    type="button"
                    className="couples-back-bottom"
                    disabled={busy || snapshot.session.step === 0}
                    onClick={() => void act(
                      () => advanceSecureDuoSession(roomId, "previous", snapshot.session.revision).then(() => undefined),
                      nl ? "Vorige stap gedeeld." : "Previous step synchronized.",
                      nl ? "De stap is gewijzigd op het andere apparaat. Status wordt vernieuwd." : "The step changed on the other device. Refreshing the shared state.",
                    )}
                  >
                    {nl ? "Vorige" : "Previous"}
                  </button>
                  <button
                    type="button"
                    className="couples-primary"
                    disabled={busy || snapshot.session.step === sharedPrompts.length - 1}
                    onClick={() => void act(
                      () => advanceSecureDuoSession(roomId, "next", snapshot.session.revision).then(() => undefined),
                      nl ? "Volgende stap gedeeld." : "Next step synchronized.",
                      nl ? "De stap is gewijzigd op het andere apparaat. Status wordt vernieuwd." : "The step changed on the other device. Refreshing the shared state.",
                    )}
                  >
                    {nl ? "Volgende stap" : "Next step"}
                  </button>
                </div>
                <p className="couples-safety">
                  {nl
                    ? "De server synchroniseert deze stap voor beide deelnemers. Bij gelijktijdige wijzigingen wordt een verouderde actie geweigerd."
                    : "The server synchronizes this step for both participants. Simultaneous stale updates are rejected."}
                </p>
              </section>
            )}
            {!isStopped && (
              <>
                <button
                  type="button"
                  className="couples-primary"
                  disabled={busy || Boolean(own?.consented) || snapshot.status === "active"}
                  onClick={() => void act(
                    () => setSecureDuoConsent(roomId, true),
                    nl ? "Jouw toestemming is vastgelegd." : "Your consent has been recorded.",
                    nl ? "Toestemming kon niet worden vastgelegd." : "Consent could not be recorded.",
                  )}
                >
                  {busy ? (nl ? "Bezig…" : "Working…") : (nl ? "Ik stem vrijwillig in" : "I freely consent")}
                </button>
                {own?.consented && (
                  <button
                    type="button"
                    className="couples-back-bottom"
                    disabled={busy}
                    onClick={() => void act(
                      () => setSecureDuoConsent(roomId, false),
                      nl ? "Toestemming ingetrokken. De kamer is gepauzeerd." : "Consent withdrawn. The room is paused.",
                      nl ? "Toestemming kon niet worden ingetrokken." : "Consent could not be withdrawn.",
                    )}
                  >
                    {nl ? "Mijn toestemming intrekken" : "Withdraw my consent"}
                  </button>
                )}
                {canStart && (
                  <button
                    type="button"
                    className="couples-primary"
                    disabled={busy}
                    onClick={() => void act(
                      () => setSecureDuoRoomState(roomId, "active"),
                      nl ? "De kamer is actief." : "The room is active.",
                      nl ? "De kamer kon niet worden gestart." : "The room could not be started.",
                    )}
                  >
                    {nl ? "Start Duo" : "Start Duo"}
                  </button>
                )}
                {snapshot.status === "active" && (
                  <button
                    type="button"
                    className="couples-primary"
                    disabled={busy}
                    onClick={() => void act(
                      () => setSecureDuoRoomState(roomId, "paused"),
                      nl ? "De kamer is gepauzeerd." : "The room is paused.",
                      nl ? "Pauzeren is niet gelukt." : "Could not pause the room.",
                    )}
                  >
                    {nl ? "Pauzeren" : "Pause"}
                  </button>
                )}
                <button
                  type="button"
                  className="couples-back-bottom"
                  disabled={busy}
                  onClick={() => void act(
                    () => setSecureDuoRoomState(roomId, "stopped"),
                    nl ? "De kamer is definitief gestopt." : "The room has been permanently stopped.",
                    nl ? "Stoppen is niet gelukt." : "Could not stop the room.",
                  )}
                >
                  {nl ? "Duo definitief stoppen" : "Stop Duo permanently"}
                </button>
              </>
            )}
            {isStopped && (
              <>
                <p className="couples-safety">{nl ? "Deze kamer is definitief gestopt en kan niet opnieuw worden gestart." : "This room is permanently stopped and cannot be restarted."}</p>
                <section className="couples-aftercare" aria-labelledby="secure-duo-aftercare-title">
                  <span className="eyebrow">AFTER THE EXPERIENCE</span>
                  <h3 id="secure-duo-aftercare-title">{nl ? "Even rustig landen" : "Take a moment to settle"}</h3>
                  <p>{nl
                    ? "Kies voor jezelf wat nu prettig voelt. Dit lijstje blijft alleen in jouw browser en wordt niet gedeeld of opgeslagen."
                    : "Choose what feels helpful for you right now. These choices stay in your browser and are not shared or saved."}</p>
                  <div className="couples-aftercare-options">
                    {[
                      ["water", "Water of iets te drinken", "Water or a drink"],
                      ["quiet", "Rust en stilte", "Quiet time"],
                      ["hug", "Een knuffel, als ik dat wil", "A hug, if I want one"],
                      ["talk", "Even napraten", "Talk things through"],
                      ["space", "Een beetje eigen ruimte", "Some personal space"],
                      ["comfort", "Een dekentje of iets comfortabels", "A blanket or something comfortable"],
                    ].map(([id, labelNl, labelEn]) => (
                      <label className="couples-consent" key={id}>
                        <input
                          type="checkbox"
                          checked={aftercareChoices.includes(id)}
                          onChange={event => setAftercareChoices(current =>
                            event.target.checked ? [...current, id] : current.filter(choice => choice !== id)
                          )}
                        />
                        <span>{nl ? labelNl : labelEn}</span>
                      </label>
                    ))}
                  </div>
                  <p className="couples-safety">{nl
                    ? "Je hoeft niets te kiezen of uit te leggen. Neem de tijd en vraag zo nodig steun."
                    : "You do not have to choose anything or explain. Take your time and ask for support if needed."}</p>
                  <button type="button" className="couples-back-bottom" onClick={() => setAftercareChoices([])}>
                    {nl ? "Keuzes wissen" : "Clear choices"}
                  </button>
                </section>
              </>
            )}
            {!bothConsented && !isStopped && (
              <p className="couples-safety">
                {nl
                  ? "Starten is geblokkeerd totdat beide accounts aanwezig zijn en afzonderlijk toestemming hebben gegeven."
                  : "Starting is blocked until both accounts are members and have independently consented."}
              </p>
            )}
          </>
        ) : (
          <p role="status">{nl ? "Geen kamerstatus beschikbaar." : "No room status available."}</p>
        )}
        {notice && <p className="couples-message" role="status">{notice}</p>}
        {error && <p className="couples-message" role="alert">{error}</p>}
        <button type="button" className="couples-back-bottom" onClick={onBack}>
          {nl ? "Terug" : "Back"}
        </button>
        <p className="couples-safety">
          {nl
            ? "De server is leidend voor toestemming en kamerstatus. Pauzeren of stoppen trekt actieve toestemmingen in."
            : "The server is authoritative for consent and room state. Pausing or stopping revokes active consent."}
        </p>
      </section>
    </main>
  );
}
