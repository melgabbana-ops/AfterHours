import { describe, expect, it } from "vitest";
import { filterMoodHistoryEvents, removeLocalMoodHistoryEvent } from "./moodHistory";
import type { MoodEvent } from "./services/moods";

const events: MoodEvent[] = [
  { id: "after-1", session_id: "session-1", phase: "after", mood: "RELAXED", created_at: "2026-11-19T21:00:00.000Z" },
  { id: "during-1", session_id: "session-1", phase: "during", mood: "STOP", created_at: "2026-11-19T20:30:00.000Z" },
  { id: "before-1", session_id: "session-1", phase: "before", mood: "CURIOUS", created_at: "2026-11-19T20:00:00.000Z" },
  { id: "during-2", session_id: "session-2", phase: "during", mood: "GOOD", created_at: "2026-11-18T20:30:00.000Z" },
];

describe("mood history phase filters", () => {
  it("returns every event for the all filter without mutating the source list", () => {
    const result = filterMoodHistoryEvents(events, "all");
    expect(result).toEqual(events);
    expect(result).not.toBe(events);
    expect(events).toHaveLength(4);
  });

  it("filters before, during, and aftercare events independently", () => {
    expect(filterMoodHistoryEvents(events, "before").map((event) => event.id)).toEqual(["before-1"]);
    expect(filterMoodHistoryEvents(events, "during").map((event) => event.id)).toEqual(["during-1", "during-2"]);
    expect(filterMoodHistoryEvents(events, "after").map((event) => event.id)).toEqual(["after-1"]);
  });

  it("keeps STOP visible in the during-session history", () => {
    expect(filterMoodHistoryEvents(events, "during").some((event) => event.mood === "STOP")).toBe(true);
  });

  it("returns an empty list when a phase has no events", () => {
    expect(filterMoodHistoryEvents([], "after")).toEqual([]);
  });
});

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
  };
}

describe("browser-local mood history deletion", () => {
  it("deletes only the selected entry for the selected profile", () => {
    const storage = memoryStorage();
    storage.setItem("afterhours.moodhistory.profile-a", JSON.stringify(events));
    storage.setItem("afterhours.moodhistory.profile-b", JSON.stringify([events[0]]));

    expect(removeLocalMoodHistoryEvent("profile-a", "during-1", storage)).toBe(true);
    expect(JSON.parse(storage.getItem("afterhours.moodhistory.profile-a") ?? "[]").map((event: MoodEvent) => event.id))
      .toEqual(["after-1", "before-1", "during-2"]);
    expect(JSON.parse(storage.getItem("afterhours.moodhistory.profile-b") ?? "[]")).toEqual([events[0]]);
  });

  it("does not change storage when the entry or profile is unknown", () => {
    const storage = memoryStorage();
    storage.setItem("afterhours.moodhistory.profile-a", JSON.stringify(events));
    expect(removeLocalMoodHistoryEvent("profile-a", "missing", storage)).toBe(false);
    expect(removeLocalMoodHistoryEvent(" ", "during-1", storage)).toBe(false);
    expect(JSON.parse(storage.getItem("afterhours.moodhistory.profile-a") ?? "[]")).toEqual(events);
  });

  it("fails safely for malformed data and unavailable storage", () => {
    const malformed = memoryStorage();
    malformed.setItem("afterhours.moodhistory.profile-a", "{");
    expect(removeLocalMoodHistoryEvent("profile-a", "during-1", malformed)).toBe(false);
    const broken = { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("blocked"); } };
    expect(removeLocalMoodHistoryEvent("profile-a", "during-1", broken)).toBe(false);
  });
});
