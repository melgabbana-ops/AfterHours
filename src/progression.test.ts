import { describe, expect, it } from "vitest";
import {
  levelFromXp,
  rankFromXp,
  rankIndexFromXp,
  rankNames,
  rankThresholds,
} from "./progression";

describe("AFTER HOURS rank progression", () => {
  it("keeps the seven approved brand ranks in order", () => {
    expect(rankNames).toEqual([
      "CURIOUS",
      "OBEDIENT",
      "PLAYFUL",
      "DEVOTED",
      "ADDICTED",
      "OWNED",
      "LEGEND",
    ]);
  });

  it.each([
    [0, "CURIOUS"],
    [249, "CURIOUS"],
    [250, "OBEDIENT"],
    [599, "OBEDIENT"],
    [600, "PLAYFUL"],
    [1199, "PLAYFUL"],
    [1200, "DEVOTED"],
    [1999, "DEVOTED"],
    [2000, "ADDICTED"],
    [3499, "ADDICTED"],
    [3500, "OWNED"],
    [4999, "OWNED"],
    [5000, "LEGEND"],
  ] as const)("maps %i XP to rank %s", (xp, expectedRank) => {
    expect(rankFromXp(xp)).toBe(expectedRank);
  });

  it("uses the approved XP thresholds", () => {
    expect(rankThresholds).toEqual([0, 250, 600, 1200, 2000, 3500, 5000]);
    expect(rankIndexFromXp(3500)).toBe(5);
  });

  it("keeps level progression separate from rank progression", () => {
    expect(levelFromXp(0)).toBe(1);
    expect(levelFromXp(199)).toBe(1);
    expect(levelFromXp(200)).toBe(2);
    expect(levelFromXp(5000)).toBe(26);
  });

  it("does not assign negative XP to a higher rank or level", () => {
    expect(rankFromXp(-100)).toBe("CURIOUS");
    expect(levelFromXp(-100)).toBe(1);
  });
});
