import React, { useEffect, useState } from "react";
import { LockKeyhole, Save, Trash2, SkipForward } from "lucide-react";
import {
  deletePrivateSessionNote,
  loadPrivateSessionNote,
  savePrivateSessionNote,
  type PrivateSessionNote,
  type PrivateSessionNoteDraft,
} from "./services/privateNotes";

type Language = "nl" | "en";
export type PrivateNoteStatus = "pending" | "saved" | "skipped";
const EMPTY_DRAFT: PrivateSessionNoteDraft = { howFelt: "", whatLiked: "", changeNextTime: "" };

function noteDraft(note: PrivateSessionNote | null): PrivateSessionNoteDraft {
  return note ? { howFelt: note.howFelt, whatLiked: note.whatLiked, changeNextTime: note.changeNextTime } : { ...EMPTY_DRAFT };
}
function sameDraft(a: PrivateSessionNoteDraft, b: PrivateSessionNoteDraft): boolean {
  return a.howFelt === b.howFelt && a.whatLiked === b.whatLiked && a.changeNextTime === b.changeNextTime;
}

export default function AftercareNote({ ownerId, sessionId, language, onStatusChange }: {
  ownerId: string;
  sessionId: string;
  language: Language;
  onStatusChange: (status: PrivateNoteStatus) => void;
}) {
  const [saved, setSaved] = useState<PrivateSessionNote | null>(null);
  const [draft, setDraft] = useState<PrivateSessionNoteDraft>({ ...EMPTY_DRAFT });
  const [status, setStatus] = useState<PrivateNoteStatus>("pending");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [message, setMessage] = useState("");
  const t = (nl: string, en: string) => language === "nl" ? nl : en;
  const hasText = Object.values(draft).some((value) => value.trim().length > 0);
  const dirty = !sameDraft(draft, noteDraft(saved));

  useEffect(() => {
    const existing = loadPrivateSessionNote(ownerId, sessionId);
    setConfirmDelete(false);
    setSaved(existing);
    setDraft(noteDraft(existing));
    const nextStatus: PrivateNoteStatus = existing ? "saved" : "skipped";
    setStatus(nextStatus);
    onStatusChange(nextStatus);
    setMessage(existing
      ? t("Je eerder opgeslagen notitie is geladen.", "Your previously saved note has been loaded.")
      : "");
  }, [ownerId, sessionId, onStatusChange]);

  const updateField = (field: keyof PrivateSessionNoteDraft, value: string) => {
    const next = { ...draft, [field]: value };
    setConfirmDelete(false);
    setDraft(next);
    const nextStatus: PrivateNoteStatus = sameDraft(next, noteDraft(saved))
      ? saved ? "saved" : "skipped"
      : "pending";
    setStatus(nextStatus);
    onStatusChange(nextStatus);
    setMessage("");
  };

  const save = () => {
    const note = savePrivateSessionNote(ownerId, sessionId, draft);
    if (!note) {
      setMessage(t("Opslaan is niet gelukt. Controleer of browseropslag beschikbaar is.", "The note could not be saved. Check whether browser storage is available."));
      return;
    }
    setSaved(note);
    setDraft(noteDraft(note));
    setStatus("saved");
    onStatusChange("saved");
    setMessage(t("Notitie lokaal opgeslagen op dit apparaat.", "Note saved locally on this device."));
  };

  const skip = () => {
    setConfirmDelete(false);
    setDraft(noteDraft(saved));
    const nextStatus: PrivateNoteStatus = saved ? "saved" : "skipped";
    setStatus(nextStatus);
    onStatusChange(nextStatus);
    setMessage(saved
      ? t("Niet-opgeslagen wijzigingen zijn verworpen. De eerder opgeslagen notitie blijft staan.", "Unsaved changes were discarded. The previously saved note remains.")
      : t("Notitie overgeslagen. Je hoeft niets te delen.", "Note skipped. You do not have to share anything."));
  };

  const remove = () => {
    if (!deletePrivateSessionNote(ownerId, sessionId)) {
      setMessage(t("Verwijderen is niet gelukt. De lokale notitie is niet bevestigd verwijderd.", "Deletion failed. The local note could not be confirmed as removed."));
      return;
    }
    setConfirmDelete(false);
    setSaved(null);
    setDraft({ ...EMPTY_DRAFT });
    setStatus("skipped");
    onStatusChange("skipped");
    setMessage(t("De lokale notitie is verwijderd.", "The local note has been deleted."));
  };

  return <section className="aftercare-private-note" aria-labelledby="aftercare-private-note-title">
    <div className="aftercare-private-note-heading">
      <LockKeyhole aria-hidden="true" />
      <div>
        <span className="eyebrow">AFTER HOURS · PRIVATE NOTE</span>
        <h3 id="aftercare-private-note-title">{t("Wil je iets onthouden van deze ervaring?", "Would you like to remember something from this experience?")}</h3>
      </div>
    </div>
    <p className="aftercare-private-note-privacy">
      {t("Alleen lokaal opgeslagen in deze browser op dit apparaat. De notitie wordt niet naar je account of de server geüpload en is niet versleuteld. Gebruik een apparaat dat je zelf vertrouwt.", "Stored only in this browser on this device. The note is not uploaded to your account or the server and is not encrypted. Use a device you trust.")}
    </p>
    <div className="aftercare-private-note-fields">
      <label htmlFor="aftercare-note-how-felt">{t("Hoe voelde de sessie?", "How did the session feel?")}</label>
      <textarea id="aftercare-note-how-felt" value={draft.howFelt} maxLength={1200} rows={3} onChange={(event) => updateField("howFelt", event.target.value)} />
      <label htmlFor="aftercare-note-liked">{t("Wat vond je prettig?", "What did you enjoy?")}</label>
      <textarea id="aftercare-note-liked" value={draft.whatLiked} maxLength={1200} rows={3} onChange={(event) => updateField("whatLiked", event.target.value)} />
      <label htmlFor="aftercare-note-change">{t("Wat wil je volgende keer anders?", "What would you like to change next time?")}</label>
      <textarea id="aftercare-note-change" value={draft.changeNextTime} maxLength={1200} rows={3} onChange={(event) => updateField("changeNextTime", event.target.value)} />
    </div>
    <div className="aftercare-private-note-actions">
      <button type="button" className="gold" onClick={save} disabled={!hasText || !dirty}><Save size={16} />{t("Notitie opslaan", "Save note")}</button>
      <button type="button" onClick={skip}><SkipForward size={16} />{t("Overslaan", "Skip")}</button>
      {saved && <button type="button" className="aftercare-private-note-delete" onClick={() => setConfirmDelete(true)} aria-expanded={confirmDelete} aria-controls="aftercare-note-delete-confirm"><Trash2 size={16} />{t("Verwijder notitie", "Delete note")}</button>}
    </div>
    {saved && confirmDelete && <div id="aftercare-note-delete-confirm" className="aftercare-private-note-confirm" role="group" aria-labelledby="aftercare-note-delete-confirm-label">
      <p id="aftercare-note-delete-confirm-label" role="status" aria-live="polite">{t("Weet je zeker dat je deze lokale notitie van deze sessie wilt verwijderen? Dit kan niet ongedaan worden gemaakt.", "Are you sure you want to delete this local note for this session? This cannot be undone.")}</p>
      <div className="aftercare-private-note-actions">
        <button type="button" className="aftercare-private-note-delete" onClick={remove}><Trash2 size={16} />{t("Definitief verwijderen", "Delete permanently")}</button>
        <button type="button" onClick={() => setConfirmDelete(false)}>{t("Annuleren", "Cancel")}</button>
      </div>
    </div>}
    {message && <p className="aftercare-private-note-message" role="status">{message}</p>}
    <span className="sr-only" aria-live="polite">{status === "pending" ? t("Niet-opgeslagen wijzigingen", "Unsaved changes") : status === "saved" ? t("Notitie opgeslagen", "Note saved") : t("Notitie overgeslagen", "Note skipped")}</span>
  </section>;
}
