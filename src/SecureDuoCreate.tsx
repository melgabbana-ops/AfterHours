import { useState } from "react";
import { createDuoInvitationUrl } from "./services/duoRoomInvitations";
import {
  createSecureDuoRoom,
  revokeSecureDuoInvitation,
  setSecureDuoConsent,
} from "./services/duoRooms";

type Language = "nl" | "en";

type Props = {
  authenticated: boolean;
  language: Language;
  onLogin: () => void;
  onBack: () => void;
  onCreated?: (roomId: string) => void;
};

/**
 * Account-bound invitation creator.
 * Keep dormant until the secure Duo SQL proposal is deployed and verified
 * with two real accounts. The creator must explicitly opt in before sharing.
 */
export default function SecureDuoCreate({ authenticated, language, onLogin, onBack, onCreated }: Props) {
  const nl = language === "nl";
  const [consent, setConsent] = useState(false);
  const [creating, setCreating] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [roomId, setRoomId] = useState("");
  const [invitationUrl, setInvitationUrl] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const createInvitation = async () => {
    if (!authenticated || !consent || creating) return;
    setCreating(true);
    setError("");
    setMessage("");
    try {
      const room = await createSecureDuoRoom();
      try {
        await setSecureDuoConsent(room.roomId, true);
      } catch (reason) {
        // Do not leave a usable invitation behind if the creator's explicit
        // consent could not be recorded by the server.
        try { await revokeSecureDuoInvitation(room.roomId); } catch { /* expires server-side */ }
        throw reason;
      }
      const base = new URL(window.location.href);
      base.searchParams.delete("couple");
      base.hash = "";
      const url = createDuoInvitationUrl(base.toString(), room.invitationToken);
      setRoomId(room.roomId);
      setInvitationUrl(url);
      setExpiresAt(room.expiresAt);
      setMessage(nl
        ? "Je uitnodiging is aangemaakt. Deel de link alleen met de persoon die je wilt uitnodigen."
        : "Your invitation is ready. Share the link only with the person you intend to invite.");
    } catch (reason) {
      setError(reason instanceof Error
        ? reason.message
        : (nl ? "De uitnodiging kon niet worden aangemaakt." : "The invitation could not be created."));
    } finally {
      setCreating(false);
    }
  };

  const copyLink = async () => {
    if (!invitationUrl) return;
    try {
      await navigator.clipboard.writeText(invitationUrl);
      setMessage(nl ? "Privé-uitnodiging gekopieerd." : "Private invitation copied.");
    } catch {
      setMessage(nl
        ? "Kopiëren is niet beschikbaar. Selecteer de volledige link en kopieer deze handmatig."
        : "Copy is unavailable. Select the full link and copy it manually.");
    }
  };

  const shareLink = async () => {
    if (!invitationUrl) return;
    if (!navigator.share) {
      await copyLink();
      return;
    }
    try {
      await navigator.share({
        title: "AFTER HOURS · Private Duo",
        text: nl ? "Je bent uitgenodigd voor een privé Duo-kamer." : "You are invited to a private Duo room.",
        url: invitationUrl,
      });
    } catch (reason) {
      if (reason instanceof Error && reason.name === "AbortError") return;
      await copyLink();
    }
  };

  const revoke = async () => {
    if (!roomId || revoking) return;
    setRevoking(true);
    setError("");
    try {
      await revokeSecureDuoInvitation(roomId);
      setRoomId("");
      setInvitationUrl("");
      setExpiresAt("");
      setMessage(nl
        ? "De uitnodiging is ingetrokken. De link kan niet meer worden gebruikt."
        : "The invitation has been revoked. Its link can no longer be used.");
    } catch (reason) {
      setError(reason instanceof Error
        ? reason.message
        : (nl ? "De uitnodiging kon niet worden ingetrokken." : "The invitation could not be revoked."));
    } finally {
      setRevoking(false);
    }
  };

  const expiryDate = expiresAt ? new Date(expiresAt) : null;
  const validExpiry = expiryDate && Number.isFinite(expiryDate.getTime());
  const formattedExpiry = validExpiry
    ? new Intl.DateTimeFormat(nl ? "nl-NL" : "en-GB", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(expiryDate)
    : "";

  return (
    <main className="couples-play-screen ah-editorial-screen">
      <section className="couples-lobby" aria-labelledby="secure-duo-create-title">
        <span className="eyebrow">AFTER HOURS · PRIVATE DUO</span>
        <h2 id="secure-duo-create-title">{nl ? "Nodig iemand privé uit" : "Invite someone privately"}</h2>
        {!authenticated ? (
          <>
            <p>{nl
              ? "Log in met je eigen AFTER HOURS-account om een beveiligde uitnodiging te maken."
              : "Sign in with your own AFTER HOURS account to create a secure invitation."}</p>
            <button type="button" className="couples-primary" onClick={onLogin}>
              {nl ? "Inloggen" : "Sign in"}
            </button>
          </>
        ) : invitationUrl ? (
          <>
            <p>{nl
              ? "Je kamer is aangemaakt. De andere deelnemer moet met een eigen account inloggen en de uitnodiging zelf accepteren."
              : "Your room is ready. The other participant must sign in with their own account and accept the invitation themselves."}</p>
            <label className="couples-consent-note" htmlFor="secure-duo-invite-link">
              {nl ? "Persoonlijke uitnodigingslink" : "Personal invitation link"}
            </label>
            <input
              id="secure-duo-invite-link"
              type="url"
              readOnly
              value={invitationUrl}
              onFocus={(event) => event.currentTarget.select()}
              aria-label={nl ? "Privé-uitnodigingslink" : "Private invitation link"}
            />
            <p className="couples-consent-note">
              {nl ? "Geldig tot: " : "Expires: "}{formattedExpiry || (nl ? "onbekend" : "unknown")}
            </p>
            <button type="button" className="couples-primary" onClick={() => void shareLink()}>
              {nl ? "Delen" : "Share"}
            </button>
            {onCreated && <button type="button" className="couples-secondary" onClick={() => onCreated(roomId)}>
              {nl ? "Open de Duo-wachtkamer" : "Open Duo lobby"}
            </button>}
            <button type="button" className="couples-primary" onClick={() => void copyLink()}>
              {nl ? "Link kopiëren" : "Copy link"}
            </button>
            <button type="button" className="couples-back-bottom" onClick={() => void revoke()} disabled={revoking}>
              {revoking
                ? (nl ? "Intrekken…" : "Revoking…")
                : (nl ? "Uitnodiging intrekken" : "Revoke invitation")}
            </button>
            <p className="couples-safety">
              {nl
                ? "Behandel deze link als een sleutel. Deel hem niet openbaar. De uitnodiging is eenmalig en verloopt automatisch."
                : "Treat this link like a key. Do not post it publicly. The invitation is single-use and expires automatically."}
            </p>
          </>
        ) : (
          <>
            <p>{nl
              ? "Maak een privé-kamer voor precies twee accounts. Je partner beslist zelf of die deelneemt."
              : "Create a private room for exactly two accounts. Your partner decides independently whether to join."}</p>
            <label className="couples-consent-note" htmlFor="secure-duo-owner-consent">
              <input
                id="secure-duo-owner-consent"
                type="checkbox"
                checked={consent}
                onChange={(event) => setConsent(event.currentTarget.checked)}
              />
              {nl
                ? "Ik wil vrijwillig deelnemen aan deze Duo-kamer. Ik kan mijn toestemming altijd intrekken."
                : "I freely choose to participate in this Duo room. I can withdraw my consent at any time."}
            </label>
            <button
              type="button"
              className="couples-primary"
              onClick={() => void createInvitation()}
              disabled={!consent || creating}
            >
              {creating
                ? (nl ? "Privé-kamer maken…" : "Creating private room…")
                : (nl ? "Maak uitnodiging" : "Create invitation")}
            </button>
          </>
        )}
        {message && <p className="couples-message" role="status">{message}</p>}
        {error && <p className="couples-message" role="alert">{error}</p>}
        <button type="button" className="couples-back-bottom" onClick={onBack}>
          {nl ? "Terug" : "Back"}
        </button>
        <p className="couples-safety">
          {nl
            ? "Geen sessie start automatisch. Beide deelnemers moeten zelf instemmen voordat een kamer actief kan worden."
            : "No session starts automatically. Both participants must consent independently before a room can become active."}
        </p>
      </section>
    </main>
  );
}
