import { describe, expect, it } from "vitest";
import { isRitualDeckVisible, shouldRevealRitualDraw } from "./ritualDeckAccess";

describe("Ritual Deck private content visibility", () => {
  it("shows private cards only after the current account has loaded them", () => {
    expect(isRitualDeckVisible("user-a", "user-a")).toBe(true);
  });

  it.each([
    ["a different account", "user-a", "user-b"],
    ["a signed-out view", null, "user-a"],
    ["an account whose deck is still loading", "user-a", null],
    ["stale data from the previous account", "user-b", "user-a"],
    ["an empty account identifier", "", ""],
    ["a whitespace-only account identifier", "   ", "   "],
    ["a signed-out view with no loaded owner", null, null],
  ] as const)("hides private content for %s", (_reason, currentOwnerId, loadedOwnerId) => {
    expect(isRitualDeckVisible(currentOwnerId, loadedOwnerId)).toBe(false);
  });
});

describe("Ritual Deck draw confirmation", () => {
  it("reveals a card only after its history is saved for the current account", () => {
    expect(shouldRevealRitualDraw(true, true)).toBe(true);
  });

  it.each([
    ["the account changed before the save completed", false, true],
    ["saving the draw to history failed", true, false],
    ["both the account changed and saving failed", false, false],
  ] as const)("keeps an uncommitted draw hidden when %s", (_reason, ownerIsCurrent, historySaved) => {
    expect(shouldRevealRitualDraw(ownerIsCurrent, historySaved)).toBe(false);
  });
});
