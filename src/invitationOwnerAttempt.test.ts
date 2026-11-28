import { describe, expect, it } from "vitest";
import { isInvitationOwnerAttemptCurrent } from "./invitationOwnerAttempt";

const attempt = { ownerId: "owner-a", generation: 7, safetyGeneration: 12 };

describe("run invitation owner guard", () => {
  it("allows a link only for the same account, safety generation and view while STOP is clear", () => {
    expect(isInvitationOwnerAttemptCurrent(attempt, "owner-a", 7, 12, false)).toBe(true);
  });

  it.each([
    ["another account", "owner-b", 7, 12, false],
    ["a signed-out view", null, 7, 12, false],
    ["a newer account generation", "owner-a", 8, 12, false],
    ["an older account generation", "owner-a", 6, 12, false],
    ["a pending STOP", "owner-a", 7, 12, true],
    ["a newer safety generation", "owner-a", 7, 13, false],
    ["an older safety generation", "owner-a", 7, 11, false],
  ] as const)("rejects link exposure after %s", (_reason, ownerId, generation, safetyGeneration, stopPending) => {
    expect(isInvitationOwnerAttemptCurrent(attempt, ownerId, generation, safetyGeneration, stopPending)).toBe(false);
  });

  it("rejects an empty owner", () => {
    expect(isInvitationOwnerAttemptCurrent({ ownerId: "", generation: 7, safetyGeneration: 12 }, "", 7, 12, false)).toBe(false);
  });
});
