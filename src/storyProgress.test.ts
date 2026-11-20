import { describe, expect, it } from "vitest";
import { getNextStoryChapterId, loadCompletedStoryChapters, matchesStoryAccount, persistStoryChapterCompletion, saveCompletedStoryChapters } from "./storyProgress";

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

  it("does not report success when browser storage silently ignores a write", () => {
    const silentStorage = {
      getItem: () => null,
      setItem: () => undefined,
    };
    expect(saveCompletedStoryChapters("player-a", ["arrival"], silentStorage)).toBe(false);
    expect(loadCompletedStoryChapters("player-a", silentStorage)).toEqual([]);
  });

  it("does not report success when storage returns a different chapter list", () => {
    const mismatchedStorage = {
      getItem: () => JSON.stringify(["arrival"]),
      setItem: () => undefined,
    };
    expect(saveCompletedStoryChapters("player-a", ["arrival", "test"], mismatchedStorage)).toBe(false);
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

  it("does not mark a chapter complete locally when the account RPC rejects it", async () => {
    const storage = memoryStorage();
    const result = await persistStoryChapterCompletion("player-a", "arrival", [], {
      remoteProfileId: "user-a",
      completeRemote: async () => "Account gewijzigd.",
      storage,
    });
    expect(result).toEqual({ ok: false, reason: "remote-save-failed", error: "Account gewijzigd." });
    expect(loadCompletedStoryChapters("player-a", storage)).toEqual([]);
  });

  it("waits for remote confirmation before writing the local mirror", async () => {
    const values = new Map<string, string>();
    const events: string[] = [];
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => { events.push("local"); values.set(key, value); },
    };
    const result = await persistStoryChapterCompletion("player-a", "arrival", [], {
      remoteProfileId: "user-a",
      completeRemote: async () => { events.push("remote"); return null; },
      storage,
    });
    expect(events).toEqual(["remote", "local"]);
    expect(result).toEqual({ ok: true, chapterIds: ["arrival"], localSaved: true });
  });

  it("requires verified local storage when no account sync is available", async () => {
    const silentStorage = { getItem: () => null, setItem: () => undefined };
    const result = await persistStoryChapterCompletion("player-a", "arrival", [], { storage: silentStorage });
    expect(result).toEqual({ ok: false, reason: "local-save-failed" });
  });

  it("keeps account-confirmed completion when the optional local mirror is unavailable", async () => {
    const silentStorage = { getItem: () => null, setItem: () => undefined };
    const result = await persistStoryChapterCompletion("player-a", "arrival", [], {
      remoteProfileId: "user-a",
      completeRemote: async () => null,
      storage: silentStorage,
    });
    expect(result).toEqual({ ok: true, chapterIds: ["arrival"], localSaved: false });
  });

  it("rejects unknown chapter IDs before making a remote request", async () => {
    let remoteCalled = false;
    const result = await persistStoryChapterCompletion("player-a", "unknown", [], {
      remoteProfileId: "user-a",
      completeRemote: async () => { remoteCalled = true; return null; },
      storage: memoryStorage(),
    });
    expect(result).toEqual({ ok: false, reason: "invalid-input" });
    expect(remoteCalled).toBe(false);
  });

});
