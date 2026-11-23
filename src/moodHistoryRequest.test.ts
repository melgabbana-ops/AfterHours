import { describe, expect, it } from "vitest";
import { createMoodHistoryRequestGuard } from "./moodHistoryRequest";

describe("mood history request guard", () => {
  it("allows only the newest account-history request to update the view", () => {
    const guard = createMoodHistoryRequestGuard();
    const firstRequest = guard.begin();
    const secondRequest = guard.begin();

    expect(guard.isCurrent(firstRequest)).toBe(false);
    expect(guard.isCurrent(secondRequest)).toBe(true);
  });

  it("invalidates an in-flight request when the view is cleaned up", () => {
    const guard = createMoodHistoryRequestGuard();
    const request = guard.begin();

    guard.invalidate();

    expect(guard.isCurrent(request)).toBe(false);
  });

  it("keeps a later refresh current after invalidation", () => {
    const guard = createMoodHistoryRequestGuard();
    const oldRequest = guard.begin();
    guard.invalidate();
    const currentRequest = guard.begin();

    expect(guard.isCurrent(oldRequest)).toBe(false);
    expect(guard.isCurrent(currentRequest)).toBe(true);
  });
});
