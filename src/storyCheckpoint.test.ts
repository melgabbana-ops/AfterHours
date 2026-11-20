import { describe, expect, it } from "vitest";
import { clearStoryCheckpoint, loadStoryCheckpoint, saveStoryCheckpoint } from "./storyCheckpoint";

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
    removeItem: (key: string) => { values.delete(key); },
  };
}

describe("Story Mode resume checkpoint", () => {
  it("stores the current chapter and round per player", () => {
    const storage = memoryStorage();
    expect(saveStoryCheckpoint("player-a", { chapterId: "control", roundIndex: 1 }, storage)).toBe(true);
    expect(loadStoryCheckpoint("player-a", storage)).toEqual({ chapterId: "control", roundIndex: 1 });
    expect(loadStoryCheckpoint("player-b", storage)).toBeNull();
  });

  it("accepts only known chapters and valid zero-based round indexes", () => {
    const storage = memoryStorage();
    expect(saveStoryCheckpoint("player-a", { chapterId: "unknown", roundIndex: 0 }, storage)).toBe(false);
    expect(saveStoryCheckpoint("player-a", { chapterId: "arrival", roundIndex: -1 }, storage)).toBe(false);
    expect(saveStoryCheckpoint("player-a", { chapterId: "arrival", roundIndex: 3 }, storage)).toBe(false);
    expect(saveStoryCheckpoint("player-a", { chapterId: "arrival", roundIndex: 1.5 }, storage)).toBe(false);
    expect(saveStoryCheckpoint("player-a", { chapterId: "arrival", roundIndex: "1" as unknown as number }, storage)).toBe(false);
    expect(loadStoryCheckpoint("player-a", storage)).toBeNull();
  });

  it("returns null for malformed or unsupported stored data", () => {
    const storage = memoryStorage();
    storage.setItem("afterhours.story-checkpoint.v1:player-a", "{");
    expect(loadStoryCheckpoint("player-a", storage)).toBeNull();
    storage.setItem("afterhours.story-checkpoint.v1:player-a", JSON.stringify({ chapterId: "arrival", roundIndex: 9 }));
    expect(loadStoryCheckpoint("player-a", storage)).toBeNull();
  });

  it("clears only the selected player's checkpoint", () => {
    const storage = memoryStorage();
    saveStoryCheckpoint("player-a", { chapterId: "arrival", roundIndex: 0 }, storage);
    saveStoryCheckpoint("player-b", { chapterId: "night", roundIndex: 2 }, storage);
    expect(clearStoryCheckpoint("player-a", storage)).toBe(true);
    expect(loadStoryCheckpoint("player-a", storage)).toBeNull();
    expect(loadStoryCheckpoint("player-b", storage)).toEqual({ chapterId: "night", roundIndex: 2 });
  });

  it("rejects an empty player id", () => {
    const storage = memoryStorage();
    expect(saveStoryCheckpoint("", { chapterId: "arrival", roundIndex: 0 }, storage)).toBe(false);
    expect(loadStoryCheckpoint("", storage)).toBeNull();
    expect(clearStoryCheckpoint("", storage)).toBe(false);
  });

  it("fails closed when local storage is unavailable", () => {
    const broken = {
      getItem: () => { throw new Error("blocked"); },
      setItem: () => { throw new Error("blocked"); },
      removeItem: () => { throw new Error("blocked"); },
    };
    expect(loadStoryCheckpoint("player-a", broken)).toBeNull();
    expect(saveStoryCheckpoint("player-a", { chapterId: "arrival", roundIndex: 0 }, broken)).toBe(false);
    expect(clearStoryCheckpoint("player-a", broken)).toBe(false);
  });
});
