import { describe, expect, it } from "vitest";
import { isExperienceResumeAttemptCurrent } from "./experienceResumeAttempt";

const attempt = { id: 12, ownerId: "user-a", runId: "run-a" };
const current = {
  currentAttemptId: 12,
  currentOwnerId: "user-a",
  consentActive: true,
  canStartExperience: true,
  stopPending: false,
  pendingRunId: "run-a",
};

describe("experience resume attempt guard", () => {
  it("allows only the exact pending run while its account and consent remain current", () => {
    expect(isExperienceResumeAttemptCurrent(attempt, current)).toBe(true);
  });

  it.each([
    ["navigation or STOP invalidated the attempt", { currentAttemptId: 13 }],
    ["the account changed", { currentOwnerId: "user-b" }],
    ["app consent was withdrawn", { consentActive: false }],
    ["the account is no longer verified", { canStartExperience: false }],
    ["STOP is awaiting server confirmation", { stopPending: true }],
    ["a different run became pending", { pendingRunId: "run-b" }],
    ["the pending run was cleared", { pendingRunId: null }],
  ] as const)("rejects a stale resume when %s", (_reason, change) => {
    expect(isExperienceResumeAttemptCurrent(attempt, { ...current, ...change })).toBe(false);
  });
});
