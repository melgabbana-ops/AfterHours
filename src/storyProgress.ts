const STORY_PROGRESS_KEY = "afterhours.story-progress.v1";
const STORY_CHAPTER_IDS = new Set(["arrival", "test", "control", "challenge", "boundary", "night", "after-hours"]);

function normalizeChapterIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((id): id is string => typeof id === "string" && STORY_CHAPTER_IDS.has(id)))];
}

function getStorage(storage?: Pick<Storage, "getItem" | "setItem">) {
  if (storage) return storage;
  try { return globalThis.localStorage; } catch { return undefined; }
}

/** Story progress is private to the active local profile until server sync is implemented. */
export function loadCompletedStoryChapters(playerId: string, storage?: Pick<Storage, "getItem" | "setItem">): string[] {
  try {
    const target = getStorage(storage);
    if (!target || !playerId.trim()) return [];
    const raw = target.getItem(`${STORY_PROGRESS_KEY}:${playerId}`);
    return raw ? normalizeChapterIds(JSON.parse(raw)) : [];
  } catch { return []; }
}

export function saveCompletedStoryChapters(playerId: string, chapterIds: readonly string[], storage?: Pick<Storage, "getItem" | "setItem">): boolean {
  try {
    const target = getStorage(storage);
    if (!target || !playerId.trim()) return false;
    target.setItem(`${STORY_PROGRESS_KEY}:${playerId}`, JSON.stringify(normalizeChapterIds(chapterIds)));
    return true;
  } catch { return false; }
}
