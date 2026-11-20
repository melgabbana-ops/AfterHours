import { describe, expect, it } from "vitest";
import { buildMoodHistoryCsv, filterMoodHistoryEvents, removeLocalMoodHistoryEvent } from "./moodHistory";
import type { MoodCode, MoodEvent } from "./services/moods";

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

describe("mood history CSV export", () => {
  it("exports localized phase labels and mood labels without internal identifiers", () => {
    const csv = buildMoodHistoryCsv(events.slice(0, 1), "nl", (mood) => mood === "RELAXED" ? "Ontspannen" : mood);
    expect(csv).toContain('"Datum (UTC)","Fase","Stemming"');
    expect(csv).toContain('"2026-11-19T21:00:00.000Z","Achteraf","Ontspannen"');
    expect(csv).not.toContain("after-1");
    expect(csv).not.toContain("session-1");
  });

  it("uses English headings and phase labels when requested", () => {
    const csv = buildMoodHistoryCsv(events.slice(1, 2), "en");
    expect(csv).toContain('"Date (UTC)","Phase","Mood"');
    expect(csv).toContain('"2026-11-19T20:30:00.000Z","During","STOP"');
  });

  it("neutralizes spreadsheet formula starters in untrusted text fields", () => {
    const unsafeEvent = { ...events[0], created_at: ' =HYPERLINK("https://example.invalid")' };
    const csv = buildMoodHistoryCsv([unsafeEvent], "en");
    expect(csv).toContain('"\' =HYPERLINK(""https://example.invalid"")"');
  });

  it("escapes CSV quotes and commas in formatted mood labels", () => {
    const csv = buildMoodHistoryCsv(events.slice(0, 1), "en", (_mood: MoodCode) => 'calm, "safe"');
    expect(csv).toContain('"calm, ""safe"""');
  });

  it("exports a valid header-only CSV for an empty history", () => {
    expect(buildMoodHistoryCsv([], "nl")).toBe('\uFEFF"Datum (UTC)","Fase","Stemming"\r\n');
  });
});
