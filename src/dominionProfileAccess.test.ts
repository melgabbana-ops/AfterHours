import { describe, expect, it } from "vitest";
import { isDominionProfileVisible } from "./dominionProfileAccess";

describe("Dominion private profile visibility", () => {
  it("shows profile fields only after the current account has loaded them", () => {
    expect(isDominionProfileVisible("user-a", "user-a")).toBe(true);
  });

  it.each([
    ["a different account", "user-a", "user-b"],
    ["a signed-out view", null, "user-a"],
    ["an account whose profile is still loading", "user-a", null],
    ["an empty account identifier", "", ""],
    ["a signed-out view with no loaded owner", null, null],
  ] as const)("hides private fields for %s", (_reason, currentOwnerId, loadedOwnerId) => {
    expect(isDominionProfileVisible(currentOwnerId, loadedOwnerId)).toBe(false);
  });
});
