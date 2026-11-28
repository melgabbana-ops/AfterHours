import { describe, expect, it } from "vitest";
import { isInvitationOwnerAttemptCurrent } from "./invitationOwnerAttempt";

const attempt = { ownerId: "owner-a", generation: 7 };

describe("run invitation owner guard", () => {
  it("allows a link only for the same account and view while STOP is clear", () => {
    expect(isInvitationOwnerAttemptCurrent(attempt, "owner-a", 7, false)).toBe(true);
  });

  it.each([
    ["another account", "owner-b", 7, false],
    ["a signed-out view", null, 7, false],
    ["a newer account generation", "owner-a", 8, false],
    ["an older account generation", "owner-a", 6, false],
    ["a pending STOP", "owner-a", 7, true],
  ] as const)("rejects link exposure after %s", (_reason, ownerId, generation, stopPending) => {
    expect(isInvitationOwnerAttemptCurrent(attempt, ownerId, generation, stopPending)).toBe(false);
  });

  it("rejects an empty owner", () => {
    expect(isInvitationOwnerAttemptCurrent({ ownerId: "", generation: 7 }, "", 7, false)).toBe(false);
  });
});
