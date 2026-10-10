import { describe, expect, it } from "vitest";
import {
  levelFromXp,
  rankFromXp,
  rankIndexFromXp,
  rankNames,
  rankThresholds,
} from "./progression";

describe("AFTER HOURS player rank progression", () => {
  it("uses the seven approved brand ranks in order", () => {
    expect(rankNames).toEqual([
      "THE CURIOUS",
      "THE INITIATE",
      "THE DEVOTED",
      "THE DISCIPLINED",
      "THE ENTHRALLED",
      "THE BOUND",
      "AFTER HOURS",
    ]);
  });

  it.each([
    [0, "THE CURIOUS"],
    [99, "THE CURIOUS"],
    [100, "THE INITIATE"],
    [449, "THE INITIATE"],
    [450, "THE DEVOTED"],
    [999, "THE DEVOTED"],
    [1000, "THE DISCIPLINED"],
    [1799, "THE DISCIPLINED"],
    [1800, "THE ENTHRALLED"],
    [2799, "THE ENTHRALLED"],
    [2800, "THE BOUND"],
    [4999, "THE BOUND"],
    [5000, "AFTER HOURS"],
  ] as const)("maps %i XP to rank %s", (xp, expectedRank) => {
    expect(rankFromXp(xp)).toBe(expectedRank);
  });

  it("uses seven ascending XP thresholds with the final rank at 5,000 XP", () => {
    expect(rankThresholds).toEqual([0, 100, 450, 1000, 1800, 2800, 5000]);
    expect(rankIndexFromXp(5000)).toBe(6);
  });

  it("keeps level progression separate from rank progression", () => {
    expect(levelFromXp(0)).toBe(1);
    expect(levelFromXp(199)).toBe(1);
    expect(levelFromXp(200)).toBe(2);
    expect(levelFromXp(5000)).toBe(26);
  });

  it("does not assign negative XP to a higher rank or level", () => {
    expect(rankFromXp(-100)).toBe("THE CURIOUS");
    expect(levelFromXp(-100)).toBe(1);
  });
});
