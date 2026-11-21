import { isMoodEvent, type MoodCode, type MoodEvent, type MoodPhase } from "./services/moods";

export type MoodHistoryFilter = "all" | MoodPhase;
export type MoodHistoryLanguage = "nl" | "en";

/** Return a new list so filtering never mutates the stored history. */
export function filterMoodHistoryEvents(
  events: readonly MoodEvent[],
  filter: MoodHistoryFilter,
): MoodEvent[] {
  return filter === "all" ? [...events] : events.filter((event) => event.phase === filter);
}

const LOCAL_MOOD_HISTORY_PREFIX = "afterhours.moodhistory.";
type LocalMoodHistoryStorage = Pick<Storage, "getItem" | "setItem">;

function resolveMoodHistoryStorage(storage?: LocalMoodHistoryStorage): LocalMoodHistoryStorage | undefined {
  if (storage) return storage;
  try { return globalThis.localStorage; } catch { return undefined; }
}

/** Read only valid, profile-scoped local entries before they reach the UI or CSV export. */
export function readLocalMoodHistoryEvents(
  profileId: string,
  storage?: LocalMoodHistoryStorage,
): MoodEvent[] {
  const profile = profileId.trim();
  const target = resolveMoodHistoryStorage(storage);
  if (!profile || !target) return [];

  try {
    const raw = target.getItem(LOCAL_MOOD_HISTORY_PREFIX + profile);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isMoodEvent);
  } catch {
    return [];
  }
}

/** Remove one browser-local entry without touching another profile or server history. */
export function removeLocalMoodHistoryEvent(
  profileId: string,
  eventId: string,
  storage?: LocalMoodHistoryStorage,
): boolean {
  const profile = profileId.trim();
  const targetId = eventId.trim();
  const target = resolveMoodHistoryStorage(storage);
  if (!profile || !targetId || !target) return false;

  try {
    const key = LOCAL_MOOD_HISTORY_PREFIX + profile;
    const raw = target.getItem(key);
    if (!raw) return false;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return false;
    const remaining = parsed.filter((entry) => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) return true;
      return (entry as Record<string, unknown>).id !== targetId;
    });
    if (remaining.length === parsed.length) return false;
    target.setItem(key, JSON.stringify(remaining));
    return true;
  } catch {
    return false;
  }
}

const phaseLabels: Record<MoodPhase, Record<MoodHistoryLanguage, string>> = {
  before: { nl: "Vooraf", en: "Before" },
  during: { nl: "Tijdens", en: "During" },
  after: { nl: "Achteraf", en: "Aftercare" },
};

function csvCell(value: string): string {
  // Prefix spreadsheet formula starters so an exported text field cannot run as a formula.
  const safeValue = /^[\u0000-\u0020]*[=+\-@]/.test(value) ? "'" + value : value;
  return '"' + safeValue.replace(/"/g, '""') + '"';
}

/**
 * Export only the events supplied by the caller. Internal event and session IDs are
 * intentionally omitted; the CSV contains no account identifiers or hidden metadata.
 */
export function buildMoodHistoryCsv(
  events: readonly MoodEvent[],
  language: MoodHistoryLanguage,
  formatMoodLabel: (mood: MoodCode) => string = (mood) => mood,
): string {
  const headers = language === "nl"
    ? ["Datum (UTC)", "Fase", "Stemming"]
    : ["Date (UTC)", "Phase", "Mood"];
  const rows = events.map((event) => [
    event.created_at,
    phaseLabels[event.phase][language],
    formatMoodLabel(event.mood),
  ]);
  const csv = [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
  return "\uFEFF" + csv + "\r\n";
}
