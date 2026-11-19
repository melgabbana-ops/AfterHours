import type { MoodEvent, MoodPhase } from "./services/moods";

export type MoodHistoryFilter = "all" | MoodPhase;

/** Return a new list so filtering never mutates the stored history. */
export function filterMoodHistoryEvents(
  events: readonly MoodEvent[],
  filter: MoodHistoryFilter,
): MoodEvent[] {
  return filter === "all" ? [...events] : events.filter((event) => event.phase === filter);
}
