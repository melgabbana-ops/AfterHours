import { describe, expect, it } from "vitest";
import { isInvitationAcceptanceAttemptCurrent, type InvitationAcceptanceAttempt } from "./invitationAcceptanceAttempt";

const attempt: InvitationAcceptanceAttempt = {
  ownerId: "user-a",
  generation: 7,
  token: "a".repeat(64),
};

describe("invitation acceptance attempt guard", () => {
  it("allows the original owner, view, and invitation token", () => {
    expect(isInvitationAcceptanceAttemptCurrent(attempt, "user-a", 7, "a".repeat(64))).toBe(true);
  });

  it.each([
    ["a different account", "user-b", 7, "a".repeat(64)],
    ["a signed-out view", null, 7, "a".repeat(64)],
    ["a later view generation", "user-a", 8, "a".repeat(64)],
    ["a dismissed invitation", "user-a", 7, null],
    ["a replaced invitation", "user-a", 7, "b".repeat(64)],
  ] as const)("rejects a stale acceptance after %s", (_reason, ownerId, generation, token) => {
    expect(isInvitationAcceptanceAttemptCurrent(attempt, ownerId, generation, token)).toBe(false);
  });

  it("rejects an empty token", () => {
    expect(isInvitationAcceptanceAttemptCurrent({ ...attempt, token: "" }, "user-a", 7, "")).toBe(false);
  });
});
