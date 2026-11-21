import { useEffect, useState } from "react";
import { acceptSecureDuoInvitation, previewSecureDuoInvitation } from "./services/duoRooms";

type Language = "nl" | "en";
type Preview = Awaited<ReturnType<typeof previewSecureDuoInvitation>>;

type Props = {
  token: string;
  authenticated: boolean;
  language: Language;
  onLogin: () => void;
  onAccepted: (roomId: string) => void;
  onBack: () => void;
};

/**
 * Account-bound invitation review. Keep this screen dormant until the secure
 * Duo SQL proposal is deployed and verified with two real accounts.
 * Accepting is an explicit action and records the invitee's consent server-side.
 */
export default function SecureDuoInvitation({
  token,
  authenticated,
  language,
  onLogin,
  onAccepted,
  onBack,
}: Props) {
  const nl = language === "nl";
  const [preview, setPreview] = useState<Preview | null>(null);
  const [loading, setLoading] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    setPreview(null);
    setError("");

    if (!authenticated || !token) return () => { alive = false; };

    setLoading(true);
    void previewSecureDuoInvitation(token)
      .then((result) => {
        if (alive) setPreview(result);
      })
      .catch((reason: unknown) => {
        if (!alive) return;
        setError(reason instanceof Error
          ? reason.message
          : (nl ? "De uitnodiging kon niet worden gecontroleerd." : "The invitation could not be verified."));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => { alive = false; };
  }, [authenticated, token, nl]);

  const accept = async () => {
    if (!preview || !token || accepting) return;
    setAccepting(true);
    setError("");
    try {
      const roomId = await acceptSecureDuoInvitation(token);
      onAccepted(roomId);
    } catch (reason) {
      setError(reason instanceof Error
        ? reason.message
        : (nl ? "De uitnodiging kon niet worden geaccepteerd." : "The invitation could not be accepted."));
    } finally {
      setAccepting(false);
    }
  };

  const expiresAt = preview
    ? new Intl.DateTimeFormat(nl ? "nl-NL" : "en-GB", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(preview.expiresAt))
    : "";

  return (
    <main className="couples-play-screen ah-editorial-screen">
      <section className="couples-lobby" aria-labelledby="secure-duo-invite-title">
        <span className="eyebrow">AFTER HOURS · PRIVATE DUO</span>
        <h2 id="secure-duo-invite-title">{nl ? "Privé-uitnodiging" : "Private invitation"}</h2>
        {!authenticated ? (
          <>
            <p>{nl
              ? "Log in met je eigen AFTER HOURS-account om de uitnodiging veilig te bekijken."
              : "Sign in with your own AFTER HOURS account to securely review this invitation."}</p>
            <button type="button" className="couples-primary" onClick={onLogin}>
              {nl ? "Inloggen" : "Sign in"}
            </button>
          </>
        ) : !token ? (
          <p role="alert">{nl ? "Deze uitnodigingslink is ongeldig of onvolledig." : "This invitation link is invalid or incomplete."}</p>
        ) : loading ? (
          <p role="status">{nl ? "Uitnodiging veilig controleren…" : "Securely checking invitation…"}</p>
        ) : preview ? (
          <>
            <p>{nl
              ? "Je bent uitgenodigd voor een Duo-ervaring. Bekijk de gegevens en kies zelf of je deelneemt."
              : "You have been invited to a Duo experience. Review the details and decide whether to join."}</p>
            <div className="couples-connection" role="status">
              {nl ? "Status: " : "Status: "}
              {preview.status === "paused"
                ? (nl ? "gepauzeerd" : "paused")
                : (nl ? "wachtkamer" : "lobby")}
            </div>
            <p className="couples-consent-note">
              {nl ? "Uitnodiging geldig tot: " : "Invitation expires: "}{expiresAt}
            </p>
            <p className="couples-consent-note">
              {nl
                ? "Door te accepteren bevestig je vrijwillig dat je aan deze kamer wilt deelnemen. Je kunt je toestemming later altijd intrekken."
                : "By accepting, you freely confirm that you want to join this room. You can withdraw your consent at any time."}
            </p>
            <button type="button" className="couples-primary" onClick={() => void accept()} disabled={accepting}>
              {accepting
                ? (nl ? "Uitnodiging accepteren…" : "Accepting invitation…")
                : (nl ? "Accepteren en deelnemen" : "Accept and join")}
            </button>
          </>
        ) : (
          <p role="alert">{error || (nl ? "De uitnodiging is niet beschikbaar." : "The invitation is unavailable.")}</p>
        )}
        {error && preview && <p className="couples-message" role="alert">{error}</p>}
        <button type="button" className="couples-back-bottom" onClick={onBack}>
          {nl ? "Terug" : "Back"}
        </button>
        <p className="couples-safety">
          {nl
            ? "Deelname is vrijwillig. Pauzeren of stoppen blijft altijd mogelijk."
            : "Participation is voluntary. Pausing or stopping is always available."}
        </p>
      </section>
    </main>
  );
}
