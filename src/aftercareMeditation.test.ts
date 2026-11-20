import { describe, expect, it } from "vitest";
import {
  AFTERCARE_MEDITATION_DURATION_SECONDS,
  AFTERCARE_MEDITATION_PHASES,
  formatAftercareMeditationTime,
  getAftercareMeditationPhase,
  getAftercareMeditationProgressPercent,
  getAftercareMeditationRemainingSeconds,
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
});
