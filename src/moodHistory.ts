import type { MoodEvent, MoodPhase } from "./services/moods";

export type MoodHistoryFilter = "all" | MoodPhase;

/** Return a new list so filtering never mutates the stored history. */
export function filterMoodHistoryEvents(
  events: readonly MoodEvent[],
  filter: MoodHistoryFilter,
): MoodEvent[] {
  return filter === "all" ? [...events] : events.filter((event) => event.phase === filter);
}

 
type LocalMoodHistoryStorage = Pick<Storage, "getItem" | "setItem">;
const LOCAL_MOOD_HISTORY_PREFIX = "afterhours.moodhistory.";

function resolveMoodHistoryStorage(storage?: LocalMoodHistoryStorage): LocalMoodHistoryStorage | undefined {
  if (storage) return storage;
  try { return globalThis.localStorage; } catch { return undefined; }
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
    const key = `${LOCAL_MOOD_HISTORY_PREFIX}${profile}`;
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
