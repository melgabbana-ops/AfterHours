import { describe, expect, it } from "vitest";
import { isMoodCode, moodCatalog } from "./moods";

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

  it("rejects unknown and cross-phase values when validating mood history", () => {
    expect(isMoodCode("during", "NOT_A_MOOD")).toBe(false);
    expect(isMoodCode("after", "NEED A PAUSE")).toBe(false);
    expect(isMoodCode("before", "OVERWHELMED")).toBe(false);
  });
});
