import React, { useCallback, useEffect, useId, useState } from "react";
import { flushSync } from "react-dom";
import { BookOpen, LockKeyhole } from "lucide-react";
import { bindAftercareNoteAutoCollapse } from "./aftercareHistoryPrivacy";
import {
  hasPrivateSessionNote,
  loadPrivateSessionNote,
  type PrivateSessionNote,
} from "./services/privateNotes";

type Language = "nl" | "en";

/** A profile-scoped, opt-in view of the existing local session note. */
export default function AftercareHistoryNote({ ownerId, sessionId, language }: {
  ownerId: string;
  sessionId: string;
  language: Language;
}) {
  const [hasNote, setHasNote] = useState(() => hasPrivateSessionNote(ownerId, sessionId));
  const [openNote, setOpenNote] = useState<{ key: string; note: PrivateSessionNote } | null>(null);
  const disclosureId = useId();
  const toggleId = `${disclosureId}-toggle`;
  const contentId = `${disclosureId}-content`;
  const disclosureKey = `${ownerId}:${sessionId}`;
  // A note from the previous owner/session is never rendered during the first
  // render after props change, even before the cleanup effect runs.
  const note = openNote?.key === disclosureKey ? openNote.note : null;
  const expanded = note !== null;
  const t = (nl: string, en: string) => language === "nl" ? nl : en;

  const closeDisclosure = useCallback(() => setOpenNote(null), []);

  // Refresh only the existence flag on profile/session changes. The note text
  // itself is loaded only after an explicit user action.
  useEffect(() => {
    closeDisclosure();
    setHasNote(hasPrivateSessionNote(ownerId, sessionId));
  }, [ownerId, sessionId, closeDisclosure]);

  // Do not retain unencrypted note text in component state while backgrounded.
  useEffect(() => bindAftercareNoteAutoCollapse(
    window,
    document,
    closeDisclosure,
    () => flushSync(closeDisclosure),
  ), [closeDisclosure]);

  const toggleDisclosure = () => {
    if (expanded) {
      closeDisclosure();
      return;
    }
    if (document.visibilityState !== "visible") return;

    const loaded = loadPrivateSessionNote(ownerId, sessionId);
    if (document.visibilityState !== "visible") {
      closeDisclosure();
      return;
    }
    if (!loaded) {
      setHasNote(false);
      return;
    }
    setOpenNote({ key: disclosureKey, note: loaded });
  };

  if (!hasNote && !note) return null;
  const fields: Array<[string, string]> = note ? [
    [t("Hoe voelde de sessie?", "How did the session feel?"), note.howFelt],
    [t("Wat was prettig?", "What felt good?"), note.whatLiked],
    [t("Wat mag anders?", "What could change?"), note.changeNextTime],
  ] : [];

  return <div className="aftercare-history-note">
    <button
      id={toggleId}
      type="button"
      className="aftercare-history-note-toggle"
      aria-expanded={expanded}
      aria-controls={contentId}
      onClick={toggleDisclosure}
    >
      <BookOpen size={14} aria-hidden="true" />
      {expanded ? t("Notitie verbergen", "Hide note") : t("Bekijk sessienotitie", "View session note")}
    </button>
    <div
      id={contentId}
      role="group"
      aria-labelledby={toggleId}
      hidden={!expanded}
    >
      {expanded && note && <div className="aftercare-history-note-content">
        <p className="aftercare-history-note-privacy"><LockKeyhole size={12} aria-hidden="true" />{t("Alleen lokaal opgeslagen. Deze sessienotitie is niet versleuteld.", "Stored locally only. This session note is not encrypted.")}</p>
        {fields.filter(([, value]) => value.trim()).map(([label, value]) => <div key={label}>
          <strong>{label}</strong>
          <p>{value}</p>
        </div>)}
        <small>{t("Bijgewerkt op ", "Updated ") + new Date(note.updatedAt).toLocaleString(language === "nl" ? "nl-NL" : "en-GB")}</small>
      </div>}
    </div>
  </div>;
}
