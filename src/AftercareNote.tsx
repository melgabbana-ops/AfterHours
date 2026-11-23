import React, { useEffect, useState } from "react";
import { LockKeyhole, Save, Trash2, SkipForward, BookOpen } from "lucide-react";
import AftercareJournal from "./AftercareJournal";
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
  const [message, setMessage] = useState("");
  const [journalOpen, setJournalOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const t = (nl: string, en: string) => language === "nl" ? nl : en;
  const hasText = Object.values(draft).some((value) => value.trim().length > 0);
  const dirty = !sameDraft(draft, noteDraft(saved));

  useEffect(() => {
    const existing = loadPrivateSessionNote(ownerId, sessionId);
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
    setDraft(next);
    setConfirmDelete(false);
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
    setConfirmDelete(false);
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

  const requestRemove = () => {
    setConfirmDelete(true);
    setMessage(t("De notitie is nog niet verwijderd. Bevestig hieronder als je deze definitief wilt verwijderen.", "The note has not been deleted. Confirm below to permanently delete it."));
  };

  const remove = () => {
    if (!confirmDelete || !saved) return;
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
    <button type="button" className="ah-open-journal" aria-expanded={journalOpen} onClick={() => setJournalOpen(value => !value)}>
      <BookOpen size={16}/>{journalOpen ? t("Privéjournal sluiten", "Close private journal") : t("Open versleuteld privéjournal", "Open encrypted private journal")}
    </button>
    {journalOpen && <AftercareJournal key={ownerId} ownerId={ownerId} language={language} onClose={() => setJournalOpen(false)}/>}
    <p className="aftercare-private-note-privacy">
      {t("Deze sessienotitie wordt alleen lokaal in deze browser opgeslagen en is niet versleuteld. Voor persoonlijke reflecties kun je het aparte versleutelde privéjournal openen.", "This session note is stored only in this browser and is not encrypted. For personal reflections, open the separate encrypted private journal.")}
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
      {saved && (confirmDelete ? <>
        <button type="button" className="aftercare-private-note-delete" onClick={remove}><Trash2 size={16} />{t("Definitief verwijderen", "Delete permanently")}</button>
        <button type="button" onClick={() => { setConfirmDelete(false); setMessage(t("Verwijderen geannuleerd. Je notitie is behouden.", "Deletion cancelled. Your note was kept.")); }}>{t("Annuleren", "Cancel")}</button>
      </> : <button type="button" className="aftercare-private-note-delete" onClick={requestRemove}><Trash2 size={16} />{t("Verwijder notitie", "Delete note")}</button>)}
    </div>
    {message && <p className="aftercare-private-note-message" role="status" aria-live="polite" aria-atomic="true">{message}</p>}
    <span className="sr-only" aria-live="polite">{status === "pending" ? t("Niet-opgeslagen wijzigingen", "Unsaved changes") : status === "saved" ? t("Notitie opgeslagen", "Note saved") : t("Notitie overgeslagen", "Note skipped")}</span>
  </section>;
}
