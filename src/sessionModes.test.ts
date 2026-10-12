import { describe, expect, it } from "vitest";
import { pickRandomId, sessionModes, storyChapters } from "./sessionModes";

describe("approved session modes", () => {
  it("defines exactly the five approved modes", () => {
    expect(sessionModes.map((mode) => mode.id)).toEqual(["story", "random", "surprise", "custom", "boss"]);
    expect(new Set(sessionModes.map((mode) => mode.id)).size).toBe(sessionModes.length);
  });

  it("defines the seven approved English story chapters in order", () => {
    expect(storyChapters.map((chapter) => chapter.title)).toEqual([
      "THE ARRIVAL", "THE TEST", "THE CONTROL", "THE CHALLENGE", "THE BOUNDARY", "THE NIGHT", "AFTER HOURS"
    ]);
    expect(storyChapters.map((chapter) => chapter.index)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(new Set(storyChapters.map((chapter) => chapter.id)).size).toBe(storyChapters.length);
  });

  it("keeps each chapter mapped to an existing, approved experience", () => {
    const supported = new Set(["protocol", "command", "service", "trust", "camera-director", "ai-dom"]);
    expect(storyChapters.every((chapter) => supported.has(chapter.gameId))).toBe(true);
    expect(storyChapters.every((chapter) => chapter.descriptionNL && chapter.descriptionEN && chapter.openingNL && chapter.openingEN)).toBe(true);
  });

  it("selects safe random indices and handles empty collections", () => {
    expect(pickRandomId([{ id: "a" }, { id: "b" }], () => 0)).toBe("a");
    expect(pickRandomId([{ id: "a" }, { id: "b" }], () => 0.9999999)).toBe("b");
    expect(pickRandomId([{ id: "a" }], () => -100)).toBe("a");
    expect(pickRandomId([], () => 0.5)).toBeNull();
  });
});
