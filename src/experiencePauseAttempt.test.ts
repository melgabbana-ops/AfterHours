import { describe, expect, it } from "vitest";
import { isExperiencePauseAttemptCurrent } from "./experiencePauseAttempt";

const attempt = { id: 7, ownerId: "user-a", runId: "run-a" };
const current = {
  currentAttemptId: 7,
  currentOwnerId: "user-a",
  consentActive: true,
  canStartExperience: true,
  stopPending: false,
  currentRunId: "run-a",
};

describe("experience pause attempt guard", () => {
  it("allows the same run while its account and consent context remain current", () => {
    expect(isExperiencePauseAttemptCurrent(attempt, current)).toBe(true);
  });

  it.each([
    ["a newer STOP or scene attempt", { currentAttemptId: 8 }],
    ["an account switch", { currentOwnerId: "user-b" }],
    ["withdrawn app consent", { consentActive: false }],
    ["an unverified account", { canStartExperience: false }],
    ["a STOP still being confirmed", { stopPending: true }],
    ["a different run", { currentRunId: "run-b" }],
    ["a cleared run", { currentRunId: null }],
  ] as const)("rejects a late pause response after %s", (_reason, change) => {
    expect(isExperiencePauseAttemptCurrent(attempt, { ...current, ...change })).toBe(false);
  });
});
