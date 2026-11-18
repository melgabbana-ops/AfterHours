import { describe, expect, it } from "vitest";
import { isMoodCode, isMoodEvent, moodCatalog } from "./moods";
import type { MoodPhase } from "./moods";

describe("session mood safety contract", () => {
  it("keeps pause, overwhelm, and STOP choices available during a session", () => {
    expect(moodCatalog.during).toContain("NEED A PAUSE");
    expect(moodCatalog.during).toContain("OVERWHELMED");
    expect(moodCatalog.during).toContain("STOP");
  });

  it("accepts STOP only in the during-session phase", () => {
    expect(isMoodCode("during", "STOP")).toBe(true);
    expect(isMoodCode("before", "STOP")).toBe(false);
    expect(isMoodCode("after", "STOP")).toBe(false);
  });

  it("rejects unknown moods, cross-phase values, and invalid runtime phases", () => {
    expect(isMoodCode("during", "NOT_A_MOOD")).toBe(false);
    expect(isMoodCode("after", "NEED A PAUSE")).toBe(false);
    expect(isMoodCode("before", "OVERWHELMED")).toBe(false);
    expect(isMoodCode("unknown" as MoodPhase, "STOP")).toBe(false);
  });

  it("accepts a mood history event with a parseable timestamp", () => {
    expect(isMoodEvent({
      id: "mood-1",
      session_id: "session-1",
      phase: "during",
      mood: "NEED A PAUSE",
      created_at: "2026-10-24T11:30:00.000Z",
    })).toBe(true);
  });

  it("rejects mood history events with invalid timestamps", () => {
    const event = {
      id: "mood-1",
      session_id: "session-1",
      phase: "during",
      mood: "NEED A PAUSE",
      created_at: "not-a-date",
    };
    expect(isMoodEvent(event)).toBe(false);
    expect(isMoodEvent({ ...event, created_at: "" })).toBe(false);
  });
});
