const STORY_PROGRESS_KEY = "afterhours.story-progress.v1";
const STORY_CHAPTER_IDS = new Set(["arrival", "test", "control", "challenge", "boundary", "night", "after-hours"]);

/** Reject late Story Mode responses when the signed-in account no longer matches the screen owner. */
export function matchesStoryAccount(expectedUserId: string | null | undefined, authenticatedUserId: string | null | undefined): boolean {
  if (typeof expectedUserId !== "string" || typeof authenticatedUserId !== "string") return false;
  const expected = expectedUserId.trim();
  const authenticated = authenticatedUserId.trim();
  return expected.length > 0 && authenticated.length > 0 && expected === authenticated;
}

function normalizeChapterIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((id): id is string => typeof id === "string" && STORY_CHAPTER_IDS.has(id)))];
}

function getStorage(storage?: Pick<Storage, "getItem" | "setItem">) {
  if (storage) return storage;
  try { return globalThis.localStorage; } catch { return undefined; }
}

/** Local Story Mode progress is profile-scoped; authenticated account progress is verified before remote merges. */
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
