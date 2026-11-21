import { describe, expect, it } from "vitest";
import {
  BOSS_MODE_STEP_COUNT,
  isBossModeFullyCompleted,
  markBossStepCompleted,
  normalizeBossCompletedSteps,
} from "./bossProgress";

describe("Boss Mode explicit step completion", () => {
  it("keeps the approved five-step structure", () => {
    expect(BOSS_MODE_STEP_COUNT).toBe(5);
  });

  it("marks a deliberately completed step once and keeps stable order", () => {
    expect(markBossStepCompleted([3, 1], 2)).toEqual([1, 2, 3]);
    expect(markBossStepCompleted([1, 2, 3], 2)).toEqual([1, 2, 3]);
  });

  it("ignores invalid or out-of-range step indexes", () => {
    expect(markBossStepCompleted([1], -1)).toEqual([1]);
    expect(markBossStepCompleted([1], 5)).toEqual([1]);
    expect(markBossStepCompleted([1], 1.5)).toEqual([1]);
    expect(markBossStepCompleted([1], Number.NaN)).toEqual([1]);
  });

  it("normalizes malformed, duplicate and out-of-range stored values", () => {
    expect(normalizeBossCompletedSteps([4, 1, 1, -1, 5, 2.5, "3", null]))
      .toEqual([1, 4]);
    expect(normalizeBossCompletedSteps(null)).toEqual([]);
  });

  it("requires all five distinct steps before reporting full completion", () => {
    expect(isBossModeFullyCompleted([0, 1, 2, 3])).toBe(false);
    expect(isBossModeFullyCompleted([0, 1, 2, 3, 4])).toBe(true);
    expect(isBossModeFullyCompleted([0, 1, 2, 3, 4, 4])).toBe(true);
    expect(isBossModeFullyCompleted([])).toBe(false);
  });
});
