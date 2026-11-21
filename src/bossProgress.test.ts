import { describe, expect, it } from "vitest";
import {
  BOSS_MODE_STEP_COUNT,
  isBossModeFullyCompleted,
  markBossStepCompleted,
  normalizeBossCompletedSteps,
  parseBossModeAwardReceipt,
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

  it("accepts a server-confirmed single-step XP receipt", () => {
    expect(parseBossModeAwardReceipt({
      xp_earned: 25, step_xp: 25, completion_bonus_xp: 0,
      already_awarded: false, full_completion: false, profile_xp: 275, profile_level: 2,
    })).toEqual({
      xpEarned: 25, stepXp: 25, completionBonusXp: 0,
      alreadyAwarded: false, fullCompletion: false, profileXp: 275, profileLevel: 2,
    });
  });

  it("accepts the fifth-step receipt with the approved +75 completion bonus", () => {
    expect(parseBossModeAwardReceipt({
      xp_earned: 100, step_xp: 25, completion_bonus_xp: 75,
      already_awarded: false, full_completion: true, profile_xp: 500, profile_level: 3,
    })?.xpEarned).toBe(100);
  });

  it("accepts an idempotent duplicate receipt only when it awards zero XP", () => {
    expect(parseBossModeAwardReceipt({
      xp_earned: 0, step_xp: 0, completion_bonus_xp: 0,
      already_awarded: true, full_completion: true, profile_xp: null, profile_level: null,
    })?.alreadyAwarded).toBe(true);
    expect(parseBossModeAwardReceipt({
      xp_earned: 25, step_xp: 25, completion_bonus_xp: 0,
      already_awarded: true, full_completion: false, profile_xp: null, profile_level: null,
    })).toBeNull();
  });

  it("rejects malformed, negative and internally inconsistent server receipts", () => {
    expect(parseBossModeAwardReceipt(null)).toBeNull();
    expect(parseBossModeAwardReceipt({
      xp_earned: 100, step_xp: 25, completion_bonus_xp: 0,
      already_awarded: false, full_completion: true, profile_xp: 100, profile_level: 1,
    })).toBeNull();
    expect(parseBossModeAwardReceipt({
      xp_earned: -25, step_xp: -25, completion_bonus_xp: 0,
      already_awarded: false, full_completion: false, profile_xp: 0, profile_level: 1,
    })).toBeNull();
  });

});
