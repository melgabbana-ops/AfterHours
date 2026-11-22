import { describe, expect, it } from "vitest";
import {
  AFTERCARE_MEDITATION_DURATION_SECONDS,
  AFTERCARE_MEDITATION_PHASES,
  formatAftercareMeditationTime,
  getAftercareMeditationAccessibleTime,
  getAftercareMeditationPhase,
  getAftercareMeditationProgressPercent,
  getAftercareMeditationRemainingSeconds,
  loadAftercareMeditationProgress,
  saveAftercareMeditationProgress,
  clearAftercareMeditationProgress,
  skipAftercareMeditationPhase,
} from "./aftercareMeditation";

describe("30-minute aftercare meditation", () => {
  it("defines six gentle five-minute phases", () => {
    expect(AFTERCARE_MEDITATION_DURATION_SECONDS).toBe(1800);
    expect(AFTERCARE_MEDITATION_PHASES).toHaveLength(6);
    expect(AFTERCARE_MEDITATION_PHASES.map((phase) => phase.endSeconds)).toEqual([300, 600, 900, 1200, 1500, 1800]);
  });

  it("selects the correct phase at each boundary", () => {
    expect(getAftercareMeditationPhase(0).id).toBe("arrive");
    expect(getAftercareMeditationPhase(299).id).toBe("arrive");
    expect(getAftercareMeditationPhase(300).id).toBe("breath");
    expect(getAftercareMeditationPhase(600).id).toBe("body");
    expect(getAftercareMeditationPhase(900).id).toBe("ground");
    expect(getAftercareMeditationPhase(1200).id).toBe("kindness");
    expect(getAftercareMeditationPhase(1500).id).toBe("return");
    expect(getAftercareMeditationPhase(1800).id).toBe("return");
  });

  it("skips only the remainder of the current optional stage", () => {
    expect(skipAftercareMeditationPhase(0)).toBe(300);
    expect(skipAftercareMeditationPhase(125)).toBe(300);
    expect(skipAftercareMeditationPhase(299)).toBe(300);
    expect(skipAftercareMeditationPhase(300)).toBe(600);
    expect(skipAftercareMeditationPhase(1799)).toBe(1800);
    expect(skipAftercareMeditationPhase(1800)).toBe(1800);
  });

  it("normalizes invalid elapsed values before choosing the next stage", () => {
    expect(skipAftercareMeditationPhase(-10)).toBe(300);
    expect(skipAftercareMeditationPhase(Number.NaN)).toBe(300);
    expect(skipAftercareMeditationPhase(Number.POSITIVE_INFINITY)).toBe(300);
  });

  it("clamps remaining time to the supported duration", () => {
    expect(getAftercareMeditationRemainingSeconds(-10)).toBe(1800);
    expect(getAftercareMeditationRemainingSeconds(900)).toBe(900);
    expect(getAftercareMeditationRemainingSeconds(2000)).toBe(0);
    expect(getAftercareMeditationRemainingSeconds(Number.NaN)).toBe(1800);
  });

  it("calculates progress without exceeding zero or one hundred percent", () => {
    expect(getAftercareMeditationProgressPercent(-1)).toBe(0);
    expect(getAftercareMeditationProgressPercent(900)).toBe(50);
    expect(getAftercareMeditationProgressPercent(1800)).toBe(100);
    expect(getAftercareMeditationProgressPercent(Number.POSITIVE_INFINITY)).toBe(0);
  });

  it("formats the remaining time as minutes and seconds", () => {
    expect(formatAftercareMeditationTime(0)).toBe("00:00");
    expect(formatAftercareMeditationTime(65)).toBe("01:05");
    expect(formatAftercareMeditationTime(1800)).toBe("30:00");
    expect(formatAftercareMeditationTime(Number.NaN)).toBe("00:00");
  });

  it("creates natural Dutch and English labels for screen readers", () => {
    expect(getAftercareMeditationAccessibleTime(65, "nl")).toBe("1 minuut en 5 seconden resterend");
    expect(getAftercareMeditationAccessibleTime(65, "en")).toBe("1 minute and 5 seconds remaining");
    expect(getAftercareMeditationAccessibleTime(60, "nl")).toBe("1 minuut resterend");
    expect(getAftercareMeditationAccessibleTime(60, "en")).toBe("1 minute remaining");
    expect(getAftercareMeditationAccessibleTime(1800, "nl")).toBe("30 minuten resterend");
    expect(getAftercareMeditationAccessibleTime(1800, "en")).toBe("30 minutes remaining");
  });

  it("handles zero, singular seconds and invalid timer values accessibly", () => {
    expect(getAftercareMeditationAccessibleTime(1, "nl")).toBe("1 seconde resterend");
    expect(getAftercareMeditationAccessibleTime(1, "en")).toBe("1 second remaining");
    expect(getAftercareMeditationAccessibleTime(0, "nl")).toBe("0 seconden resterend");
    expect(getAftercareMeditationAccessibleTime(-10, "en")).toBe("0 seconds remaining");
    expect(getAftercareMeditationAccessibleTime(Number.NaN, "nl")).toBe("0 seconden resterend");
  });
  it("restores only a valid, clamped tab-scoped elapsed time", () => {
    const values = new Map<string, string>([["afterhours:aftercare-meditation-progress:v1", "725"]]);
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    };
    expect(loadAftercareMeditationProgress(storage)).toBe(725);
    values.set("afterhours:aftercare-meditation-progress:v1", "9999");
    expect(loadAftercareMeditationProgress(storage)).toBe(1800);
    values.set("afterhours:aftercare-meditation-progress:v1", "-10");
    expect(loadAftercareMeditationProgress(storage)).toBe(0);
    values.set("afterhours:aftercare-meditation-progress:v1", "not-a-time");
    expect(loadAftercareMeditationProgress(storage)).toBe(0);
  });

  it("saves a bounded elapsed value and clears it when the user ends meditation", () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    };
    expect(saveAftercareMeditationProgress(storage, 615.8)).toBe(true);
    expect(values.get("afterhours:aftercare-meditation-progress:v1")).toBe("615");
    expect(clearAftercareMeditationProgress(storage)).toBe(true);
    expect(values.has("afterhours:aftercare-meditation-progress:v1")).toBe(false);
  });

  it("fails safely when browser storage is blocked or unavailable", () => {
    const blocked = {
      getItem: () => { throw new Error("blocked"); },
      setItem: () => { throw new Error("blocked"); },
      removeItem: () => { throw new Error("blocked"); },
    };
    expect(loadAftercareMeditationProgress(blocked)).toBe(0);
    expect(saveAftercareMeditationProgress(blocked, 120)).toBe(false);
    expect(clearAftercareMeditationProgress(blocked)).toBe(false);
    expect(loadAftercareMeditationProgress(null)).toBe(0);
  });

});
