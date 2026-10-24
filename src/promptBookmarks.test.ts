import { afterEach, describe, expect, it, vi } from "vitest";
import { loadSavedPromptIds, saveSavedPromptIds } from "./promptBookmarks";

function installStorage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial));
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, String(value)),
  });
  return values;
}

afterEach(() => vi.unstubAllGlobals());

describe("profile-scoped prompt bookmarks", () => {
  it("persists saved prompts independently for each player", () => {
    const values = installStorage();

    expect(saveSavedPromptIds("alice", ["prompt-one", "prompt-two"])).toBe(true);
    expect(saveSavedPromptIds("bob", ["prompt-three"])).toBe(true);

    expect(loadSavedPromptIds("alice")).toEqual(["prompt-one", "prompt-two"]);
    expect(loadSavedPromptIds("bob")).toEqual(["prompt-three"]);
    expect(values.has("afterhours.saved-prompts.v1")).toBe(false);
  });

  it("does not read or write bookmarks for blank profile IDs", () => {
    const values = installStorage();

    expect(saveSavedPromptIds("", ["prompt-one"])).toBe(false);
    expect(saveSavedPromptIds("   ", ["prompt-two"])).toBe(false);

    expect(loadSavedPromptIds("")).toEqual([]);
    expect(loadSavedPromptIds("   ")).toEqual([]);
    expect(values.size).toBe(0);
  });

  it("ignores malformed entries and duplicate IDs", () => {
    installStorage({
      "afterhours.saved-prompts.v1:alice": JSON.stringify([" prompt-one ", null, "", "prompt-one", 4, "prompt-two"]),
    });

    expect(loadSavedPromptIds("alice")).toEqual(["prompt-one", "prompt-two"]);
  });

  it("returns an empty list for malformed JSON", () => {
    installStorage({ "afterhours.saved-prompts.v1:alice": "{" });

    expect(loadSavedPromptIds("alice")).toEqual([]);
  });

  it("reports when browser storage is unavailable without throwing", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => { throw new Error("storage unavailable"); },
      setItem: () => { throw new Error("storage unavailable"); },
    });

    expect(loadSavedPromptIds("alice")).toEqual([]);
    expect(saveSavedPromptIds("alice", ["prompt-one"])).toBe(false);
  });
});
