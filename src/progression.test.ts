import { describe, expect, it } from "vitest";
import {
  levelFromXp,
  rankFromXp,
  rankIndexFromXp,
  rankNames,
  rankThresholds,
} from "./progression";

describe("AFTER HOURS player rank progression", () => {
  it("preserves the previously approved 15 player ranks in order", () => {
    expect(rankNames).toEqual([
      "CURIOUS", "TEASE", "PLAYTHING", "SUBMISSIVE", "BRAT",
      "TOY", "PET", "THRALL", "DEVOTEE", "OBEDIENT",
      "ENTHRALLED", "COLLARED", "OWNED", "DEVOTED", "DARK DEVOTION",
    ]);
  });

  it.each([
    [0, "CURIOUS"], [99, "CURIOUS"],
    [100, "TEASE"], [249, "TEASE"],
    [250, "PLAYTHING"], [449, "PLAYTHING"],
    [450, "SUBMISSIVE"], [699, "SUBMISSIVE"],
    [700, "BRAT"], [999, "BRAT"],
    [1000, "TOY"], [1399, "TOY"],
    [1400, "PET"], [1799, "PET"],
    [1800, "THRALL"], [2299, "THRALL"],
    [2300, "DEVOTEE"], [2799, "DEVOTEE"],
    [2800, "OBEDIENT"], [3399, "OBEDIENT"],
    [3400, "ENTHRALLED"], [3899, "ENTHRALLED"],
    [3900, "COLLARED"], [4349, "COLLARED"],
    [4350, "OWNED"], [4699, "OWNED"],
    [4700, "DEVOTED"], [4999, "DEVOTED"],
    [5000, "DARK DEVOTION"],
  ] as const)("maps %i XP to rank %s", (xp, expectedRank) => {
    expect(rankFromXp(xp)).toBe(expectedRank);
  });

  it("uses the 15-rank XP thresholds in ascending order", () => {
    expect(rankThresholds).toEqual([
      0, 100, 250, 450, 700, 1000, 1400, 1800, 2300, 2800, 3400, 3900, 4350, 4700, 5000,
    ]);
    expect(rankIndexFromXp(5000)).toBe(14);
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
