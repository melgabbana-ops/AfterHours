import { describe, expect, it } from "vitest";
import { levelFromXp, rankFromXp, rankIndexFromXp, rankNames, rankProgressFromXp, rankThresholds } from "./progression";

describe("AFTER HOURS player rank progression", () => {
  it("uses the seven rank names approved on October 10", () => {
    expect(rankNames).toEqual([
      "THE CURIOUS", "THE INITIATE", "THE DEVOTED", "THE DISCIPLINED",
      "THE ENTHRALLED", "THE BOUND", "AFTER HOURS",
    ]);
  });
  it.each([
    [0, "THE CURIOUS"], [249, "THE CURIOUS"],
    [250, "THE INITIATE"], [599, "THE INITIATE"],
    [600, "THE DEVOTED"], [1199, "THE DEVOTED"],
    [1200, "THE DISCIPLINED"], [1999, "THE DISCIPLINED"],
    [2000, "THE ENTHRALLED"], [3499, "THE ENTHRALLED"],
    [3500, "THE BOUND"], [4999, "THE BOUND"],
    [5000, "AFTER HOURS"],
  ] as const)("maps %i XP to rank %s", (xp, expected) => {
    expect(rankFromXp(xp)).toBe(expected);
  });
  it("matches the master spec's seven XP thresholds", () => {
    expect(rankThresholds).toEqual([0, 250, 600, 1200, 2000, 3500, 5000]);
    expect(rankIndexFromXp(5000)).toBe(6);
  });
  it("keeps level progression separate from rank progression", () => {
    expect(levelFromXp(0)).toBe(1);
    expect(levelFromXp(199)).toBe(1);
    expect(levelFromXp(200)).toBe(2);
    expect(levelFromXp(5000)).toBe(26);
  });
  it("clamps negative XP", () => {
    expect(rankFromXp(-100)).toBe("THE CURIOUS");
    expect(levelFromXp(-100)).toBe(1);
  });
  it.each([Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])(
    "treats malformed non-finite XP (%s) as zero",
    (xp) => {
      expect(rankFromXp(xp)).toBe("THE CURIOUS");
      expect(rankIndexFromXp(xp)).toBe(0);
      expect(levelFromXp(xp)).toBe(1);
    },
  );

  it("calculates progress within each rank without showing a full bar before the next rank unlocks", () => {
    expect(rankProgressFromXp(125)).toMatchObject({
      xp: 125, rankIndex: 0, rankName: "THE CURIOUS", currentThreshold: 0,
      nextThreshold: 250, nextRankName: "THE INITIATE", xpToNext: 125,
      progressPercent: 50, isMaxRank: false,
    });
    expect(rankProgressFromXp(599).progressPercent).toBe(99);
    expect(rankProgressFromXp(250)).toMatchObject({
      rankIndex: 1, currentThreshold: 250, nextThreshold: 600,
      nextRankName: "THE DEVOTED", xpToNext: 350, progressPercent: 0,
    });
  });

  it("marks the highest rank as complete and safely normalizes malformed XP", () => {
    expect(rankProgressFromXp(5000)).toMatchObject({
      rankIndex: 6, rankName: "AFTER HOURS", nextThreshold: null,
      nextRankName: null, xpToNext: 0, progressPercent: 100, isMaxRank: true,
    });
    expect(rankProgressFromXp(Number.NaN)).toMatchObject({
      xp: 0, rankIndex: 0, xpToNext: 250, progressPercent: 0, isMaxRank: false,
    });
    expect(rankProgressFromXp(-50).xp).toBe(0);
  });
});
