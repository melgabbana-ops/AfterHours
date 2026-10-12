import { describe, expect, it } from "vitest";
import { calculateDailyStreak } from "./DailyAfterHours";

describe("daily ritual streak", () => {
  it("counts today when today's ritual has been completed", () => {
    expect(calculateDailyStreak(["2026-10-10","2026-10-11","2026-10-12"], "2026-10-12")).toBe(3);
  });
  it("continues from yesterday when today has not been completed yet", () => {
    expect(calculateDailyStreak(["2026-10-10","2026-10-11"], "2026-10-12")).toBe(2);
  });
  it("returns zero when neither today nor yesterday is complete", () => {
    expect(calculateDailyStreak(["2026-10-09"], "2026-10-12")).toBe(0);
  });
  it("does not continue through a missed day", () => {
    expect(calculateDailyStreak(["2026-10-10","2026-10-12"], "2026-10-12")).toBe(1);
  });
  it("does not penalize an uncompleted current day", () => {
    expect(calculateDailyStreak(["2026-10-11"], "2026-10-12")).toBe(1);
  });

  it("handles month and year boundaries", () => {
    expect(calculateDailyStreak(["2025-12-31","2026-01-01","2026-01-02"], "2026-01-02")).toBe(3);
  });
  it("handles leap day without skipping a date", () => {
    expect(calculateDailyStreak(["2024-02-28","2024-02-29","2024-03-01"], "2024-03-01")).toBe(3);
  });
  it("does not count future dates", () => {
    expect(calculateDailyStreak(["2026-10-12","2026-10-14"], "2026-10-13")).toBe(1);
  });
  it("returns zero for an empty history", () => {
    expect(calculateDailyStreak([], "2026-10-13")).toBe(0);
  });
});
