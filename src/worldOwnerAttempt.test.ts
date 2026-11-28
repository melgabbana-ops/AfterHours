import { describe, expect, it } from "vitest";
import { isWorldOwnerAttemptCurrent } from "./worldOwnerAttempt";

const attempt = { ownerId: "user-a", generation: 4 };

describe("private world owner attempt guard", () => {
  it("allows a response for the same account and view generation", () => {
    expect(isWorldOwnerAttemptCurrent(attempt, "user-a", 4)).toBe(true);
  });

  it.each([
    ["a different account", "user-b", 4],
    ["a signed-out view", null, 4],
    ["a later account generation", "user-a", 5],
    ["an earlier account generation", "user-a", 3],
  ] as const)("rejects a stale response after %s", (_reason, ownerId, generation) => {
    expect(isWorldOwnerAttemptCurrent(attempt, ownerId, generation)).toBe(false);
  });

  it("rejects an empty owner even if both sides are empty", () => {
    expect(isWorldOwnerAttemptCurrent({ ownerId: "", generation: 4 }, "", 4)).toBe(false);
  });
});
