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
});
