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

/**
 * Persist completed chapters only when the browser can read back the exact
 * normalized chapter list. A silent no-op or partial write must not be
 * presented as durable progress.
 */
export function saveCompletedStoryChapters(playerId: string, chapterIds: readonly string[], storage?: Pick<Storage, "getItem" | "setItem">): boolean {
  try {
    const target = getStorage(storage);
    if (!target || !playerId.trim()) return false;
    const key = `${STORY_PROGRESS_KEY}:${playerId}`;
    const normalized = normalizeChapterIds(chapterIds);
    target.setItem(key, JSON.stringify(normalized));
    const persisted = target.getItem(key);
    if (persisted === null) return false;
    const verified = normalizeChapterIds(JSON.parse(persisted));
    return verified.length === normalized.length && verified.every((id, index) => id === normalized[index]);
  } catch { return false; }
}

/** Return the first unfinished chapter in the approved story order. */
export function getNextStoryChapterId(completedChapterIds: readonly string[]): string | null {
  const completed = new Set(normalizeChapterIds(completedChapterIds));
  return [...STORY_CHAPTER_IDS].find((chapterId) => !completed.has(chapterId)) ?? null;
}
