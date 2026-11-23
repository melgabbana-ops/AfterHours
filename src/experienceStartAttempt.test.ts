import { describe, expect, it } from "vitest";
import { isExperienceStartAttemptCurrent } from "./experienceStartAttempt";

const attempt = { id: 7, ownerId: "user-a" };
const current = {
  currentAttemptId: 7,
  currentOwnerId: "user-a",
  consentActive: true,
  canStartExperience: true,
  stopPending: false,
};

describe("experience start attempt guard", () => {
  it("allows a start only while its original account and safety context remain current", () => {
    expect(isExperienceStartAttemptCurrent(attempt, current)).toBe(true);
  });

  it.each([
    ["a newer STOP or start attempt", { currentAttemptId: 8 }],
    ["an account switch", { currentOwnerId: "user-b" }],
    ["withdrawn app consent", { consentActive: false }],
    ["an unverified account", { canStartExperience: false }],
    ["an unconfirmed STOP", { stopPending: true }],
  ] as const)("rejects a stale start after %s", (_reason, change) => {
    expect(isExperienceStartAttemptCurrent(attempt, { ...current, ...change })).toBe(false);
  });
});
