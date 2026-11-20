import { describe, expect, it } from "vitest";
import { getNextStoryChapterId, loadCompletedStoryChapters, matchesStoryAccount, saveCompletedStoryChapters } from "./storyProgress";

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
  };
}

describe("story chapter progress", () => {
  it("accepts only the expected non-empty authenticated account", () => {
    expect(matchesStoryAccount("user-a", "user-a")).toBe(true);
    expect(matchesStoryAccount(" user-a ", "user-a")).toBe(true);
    expect(matchesStoryAccount("user-a", "user-b")).toBe(false);
    expect(matchesStoryAccount("", "user-a")).toBe(false);
    expect(matchesStoryAccount("user-a", null)).toBe(false);
  });

  it("persists completed chapters per player", () => {
    const storage = memoryStorage();
    expect(saveCompletedStoryChapters("player-a", ["arrival", "test"], storage)).toBe(true);
    expect(loadCompletedStoryChapters("player-a", storage)).toEqual(["arrival", "test"]);
    expect(loadCompletedStoryChapters("player-b", storage)).toEqual([]);
  });

  it("removes duplicate and unknown chapter ids from persisted data", () => {
    const storage = memoryStorage();
    storage.setItem("afterhours.story-progress.v1:player-a", JSON.stringify(["arrival", "arrival", "unknown", 7, "night"]));
    expect(loadCompletedStoryChapters("player-a", storage)).toEqual(["arrival", "night"]);
  });

  it("returns an empty list for malformed or unavailable storage", () => {
    const broken = { getItem: () => "{", setItem: () => { throw new Error("blocked"); } };
    expect(loadCompletedStoryChapters("player-a", broken)).toEqual([]);
    expect(saveCompletedStoryChapters("player-a", ["arrival"], broken)).toBe(false);
  });

  it("rejects an empty player id", () => {
    const storage = memoryStorage();
    expect(saveCompletedStoryChapters("", ["arrival"], storage)).toBe(false);
    expect(loadCompletedStoryChapters("", storage)).toEqual([]);
  });
  it("returns the first unfinished chapter in the approved order", () => {
    expect(getNextStoryChapterId([])).toBe("arrival");
    expect(getNextStoryChapterId(["arrival", "test"])).toBe("control");
    expect(getNextStoryChapterId(["arrival", "unknown", "arrival"])).toBe("test");
  });

  it("returns no next chapter when all approved chapters are complete", () => {
    expect(getNextStoryChapterId(["arrival", "test", "control", "challenge", "boundary", "night", "after-hours"])).toBeNull();
  });

});
