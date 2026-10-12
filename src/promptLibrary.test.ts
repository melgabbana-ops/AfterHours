import { describe, expect, it } from "vitest";
import { promptLibrary } from "./PromptLibrary";
import { englishPromptCopy } from "./promptTranslations";

describe("approved prompt library", () => {
  it("contains at least 100 Kinky opdrachten", () => {
    expect(promptLibrary.filter((item) => item.kind === "Kinky opdrachten").length).toBeGreaterThanOrEqual(100);
  });

  it("keeps all prompt IDs unique", () => {
    const ids = promptLibrary.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has English copy for every prompt", () => {
    const missing = promptLibrary.filter((item) => !englishPromptCopy[item.id]?.title || !englishPromptCopy[item.id]?.text).map((item) => item.id);
    expect(missing).toEqual([]);
  });

  it("keeps each prompt usable and non-empty", () => {
    expect(promptLibrary.every((item) => item.title.trim().length > 0 && item.text.trim().length > 0)).toBe(true);
  });
});
