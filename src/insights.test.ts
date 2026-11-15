import { describe, expect, it } from "vitest";
import { drawDifferentCardIndex, drawDistinctCardIndices } from "./Insights";

describe("AFTER HOURS card draws", () => {
  it("draws three unique positions from the deck", () => {
    const result = drawDistinctCardIndices(12, 3, () => 0.42);
    expect(result).toHaveLength(3);
    expect(new Set(result).size).toBe(3);
    expect(result.every(index => index >= 0 && index < 12)).toBe(true);
  });

  it("returns no cards for invalid deck sizes", () => {
    expect(drawDistinctCardIndices(0, 3)).toEqual([]);
    expect(drawDistinctCardIndices(12, 0)).toEqual([]);
    expect(drawDistinctCardIndices(2.5, 1)).toEqual([]);
  });

  it("never repeats the current card when another card exists", () => {
    for (let current = 0; current < 12; current += 1) {
      const next = drawDifferentCardIndex(12, current, () => 0.5);
      expect(next).toBeGreaterThanOrEqual(0);
      expect(next).toBeLessThan(12);
      expect(next).not.toBe(current);
    }
  });

  it("handles a one-card deck safely", () => {
    expect(drawDifferentCardIndex(1, 0, () => 0.5)).toBe(0);
  });
});
