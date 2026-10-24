import { describe, expect, it } from "vitest";
import { dailyReflectionFor, isSameLocalCalendarDay, zodiacSignForBirthDate } from "./astrology";

describe("AFTER HOURS astrology helpers", () => {
  it.each([
    ["1990-01-19", "Steenbok"],
    ["1990-01-20", "Waterman"],
    ["1990-02-19", "Vissen"],
    ["1990-03-21", "Ram"],
    ["1990-04-20", "Stier"],
    ["1990-05-21", "Tweelingen"],
    ["1990-06-21", "Kreeft"],
    ["1990-07-23", "Leeuw"],
    ["1990-08-23", "Maagd"],
    ["1990-09-23", "Weegschaal"],
    ["1990-10-23", "Schorpioen"],
    ["1990-11-22", "Boogschutter"],
    ["1990-12-22", "Steenbok"],
  ])("maps %s to %s", (birthDate, expected) => {
    expect(zodiacSignForBirthDate(birthDate)).toBe(expected);
  });

  it.each(["", "1990-02-30", "90-01-01", "1990-13-01", "not-a-date"])(
    "rejects invalid birth date %s",
    (birthDate) => expect(zodiacSignForBirthDate(birthDate)).toBeNull(),
  );

  it("returns a stable reflection for the same sign and local day", () => {
    const date = new Date(2026, 9, 9);
    expect(dailyReflectionFor("Weegschaal", date)).toEqual(dailyReflectionFor("Weegschaal", date));
  });

  it("can vary the reflection by sign on the same day", () => {
    const date = new Date(2026, 9, 9);
    expect(dailyReflectionFor("Ram", date)).not.toEqual(dailyReflectionFor("Stier", date));
  });
  it("treats different times on the same local date as the same day", () => {
    expect(isSameLocalCalendarDay(new Date(2026, 9, 24, 0, 5), new Date(2026, 9, 24, 23, 55))).toBe(true);
  });

  it.each([
    [new Date(2026, 9, 24, 23, 59), new Date(2026, 9, 25, 0, 1)],
    [new Date(2026, 11, 31, 23, 59), new Date(2027, 0, 1, 0, 1)],
  ])("detects a local calendar-day change", (previous, next) => {
    expect(isSameLocalCalendarDay(previous, next)).toBe(false);
  });

});
