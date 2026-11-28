import { describe, expect, it } from "vitest";
import {
  enqueuePendingExperienceStop,
  getPendingExperienceStops,
  removePendingExperienceStop,
  type PendingExperienceStopStorage,
} from "./pendingExperienceStop";

function createStorage(seed?: string): PendingExperienceStopStorage {
  let value = seed ?? null;
  return {
    getItem: () => value,
    setItem: (_key, next) => { value = next; },
    removeItem: () => { value = null; },
  };
}

describe("pending Experience Engine STOP queue", () => {
  it("stores only the run and owner identifiers and reads them for that owner", () => {
    const storage = createStorage();
    expect(enqueuePendingExperienceStop(storage, "run-a", "owner-a", "2026-11-28T00:00:00.000Z")).toBe(true);
    expect(getPendingExperienceStops(storage, "owner-a")).toEqual([{
      runId: "run-a",
      ownerId: "owner-a",
      queuedAt: "2026-11-28T00:00:00.000Z",
    }]);
    expect(getPendingExperienceStops(storage, "owner-b")).toEqual([]);
    removePendingExperienceStop(storage, "run-a", "owner-a");
  });

  it("deduplicates the same owner and run without merging different owners", () => {
    const storage = createStorage();
    expect(enqueuePendingExperienceStop(storage, "run-a", "owner-a", "first")).toBe(true);
    expect(enqueuePendingExperienceStop(storage, "run-a", "owner-a", "second")).toBe(true);
    expect(enqueuePendingExperienceStop(storage, "run-a", "owner-b", "third")).toBe(true);
    expect(getPendingExperienceStops(storage, "owner-a")).toHaveLength(1);
    expect(getPendingExperienceStops(storage, "owner-b")).toHaveLength(1);
    removePendingExperienceStop(storage, "run-a", "owner-a");
    removePendingExperienceStop(storage, "run-a", "owner-b");
  });

  it("removes only the exact owner/run pair", () => {
    const storage = createStorage();
    enqueuePendingExperienceStop(storage, "run-a", "owner-a", "first");
    enqueuePendingExperienceStop(storage, "run-a", "owner-b", "second");
    expect(removePendingExperienceStop(storage, "run-a", "owner-a")).toBe(true);
    expect(getPendingExperienceStops(storage, "owner-a")).toEqual([]);
    expect(getPendingExperienceStops(storage, "owner-b")).toHaveLength(1);
    removePendingExperienceStop(storage, "run-a", "owner-b");
  });

  it("handles malformed stored data without throwing", () => {
    const storage = createStorage("{not-json");
    expect(getPendingExperienceStops(storage, "owner-a")).toEqual([]);
    expect(enqueuePendingExperienceStop(storage, "run-a", "owner-a", "now")).toBe(true);
    removePendingExperienceStop(storage, "run-a", "owner-a");
  });

  it("keeps older durable markers and exposes overflow as a volatile safety marker", () => {
    const storage = createStorage();
    expect(enqueuePendingExperienceStop(storage, "", "owner-a")).toBe(false);
    expect(enqueuePendingExperienceStop(storage, "run-a", "")).toBe(false);
    for (let index = 0; index < 20; index += 1) {
      expect(enqueuePendingExperienceStop(storage, "run-" + index, "owner-a", "now")).toBe(true);
    }
    expect(enqueuePendingExperienceStop(storage, "run-overflow", "owner-a", "later")).toBe(false);
    expect(getPendingExperienceStops(storage, "owner-a")).toHaveLength(21);
    expect(removePendingExperienceStop(storage, "run-overflow", "owner-a")).toBe(true);
    expect(getPendingExperienceStops(storage, "owner-a")).toHaveLength(20);
    for (let index = 0; index < 20; index += 1) {
      removePendingExperienceStop(storage, "run-" + index, "owner-a");
    }
  });

  it("keeps a volatile marker visible to the same app after persistent storage fails", () => {
    const blockedStorage: PendingExperienceStopStorage = {
      getItem: () => null,
      setItem: () => { throw new Error("storage unavailable"); },
      removeItem: () => undefined,
    };
    const anotherStorage = createStorage();
    expect(enqueuePendingExperienceStop(blockedStorage, "run-volatile", "owner-volatile", "now")).toBe(false);
    expect(getPendingExperienceStops(blockedStorage, "owner-volatile")).toEqual([{
      runId: "run-volatile",
      ownerId: "owner-volatile",
      queuedAt: "now",
    }]);
    expect(getPendingExperienceStops(anotherStorage, "owner-volatile")).toHaveLength(1);
    expect(removePendingExperienceStop(anotherStorage, "run-volatile", "owner-volatile")).toBe(true);
    expect(getPendingExperienceStops(blockedStorage, "owner-volatile")).toEqual([]);
  });
});
