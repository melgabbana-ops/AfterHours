import React, { useEffect, useMemo, useState } from "react";
import { flushSync } from "react-dom";
import { BookOpen, LockKeyhole } from "lucide-react";
import { bindAftercareNoteAutoCollapse } from "./aftercareHistoryPrivacy";
import { loadPrivateSessionNote, type PrivateSessionNote } from "./services/privateNotes";

type Language = "nl" | "en";

/** A profile-scoped, opt-in view of the existing local session note. */
export default function AftercareHistoryNote({ ownerId, sessionId, language }: {
  ownerId: string;
  sessionId: string;
  language: Language;
}) {
  // Resolve the note synchronously for the current owner/session pair. This avoids
  // briefly rendering the previous profile's note while an effect catches up.
  const note: PrivateSessionNote | null = useMemo(
    () => loadPrivateSessionNote(ownerId, sessionId),
    [ownerId, sessionId],
  );
  const [expandedFor, setExpandedFor] = useState<string | null>(null);
  const disclosureKey = `${ownerId}:${sessionId}`;
  const expanded = expandedFor === disclosureKey;
  const t = (nl: string, en: string) => language === "nl" ? nl : en;

  // Never carry an expanded disclosure into another profile or session. The
  // current key already renders collapsed on the first changed-props render.
  useEffect(() => {
    setExpandedFor(null);
  }, [ownerId, sessionId]);

  // Hide unencrypted local aftercare text before the browser backgrounds or
  // snapshots the page. Keep flushSync out of effect setup itself.
  useEffect(() => bindAftercareNoteAutoCollapse(
    window,
    document,
    () => setExpandedFor(null),
    () => flushSync(() => setExpandedFor(null)),
  ), []);

  if (!note) return null;
  const fields: Array<[string, string]> = [
    [t("Hoe voelde de sessie?", "How did the session feel?"), note.howFelt],
    [t("Wat was prettig?", "What felt good?"), note.whatLiked],
    [t("Wat mag anders?", "What could change?"), note.changeNextTime],
  ];

  return <div className="aftercare-history-note">
    <button type="button" className="aftercare-history-note-toggle" aria-expanded={expanded} onClick={() => setExpandedFor(expanded ? null : disclosureKey)}>
      <BookOpen size={14} aria-hidden="true" />
      {expanded ? t("Notitie verbergen", "Hide note") : t("Bekijk sessienotitie", "View session note")}
    </button>
    {expanded && <div className="aftercare-history-note-content">
      <p className="aftercare-history-note-privacy"><LockKeyhole size={12} aria-hidden="true" />{t("Alleen lokaal opgeslagen. Deze sessienotitie is niet versleuteld.", "Stored locally only. This session note is not encrypted.")}</p>
      {fields.filter(([, value]) => value.trim()).map(([label, value]) => <div key={label}>
        <strong>{label}</strong>
        <p>{value}</p>
      </div>)}
      <small>{t("Bijgewerkt op ", "Updated ") + new Date(note.updatedAt).toLocaleString(language === "nl" ? "nl-NL" : "en-GB")}</small>
    </div>}
  </div>;
}
