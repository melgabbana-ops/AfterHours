import { storyChapters } from "./sessionModes";

const STORY_CHECKPOINT_KEY = "afterhours.story-checkpoint.v1";
const STORY_ROUND_COUNT = 3;

export interface StoryCheckpoint {
  chapterId: string;
  roundIndex: number;
}

type CheckpointStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function getStorage(storage?: CheckpointStorage): CheckpointStorage | undefined {
  if (storage) return storage;
  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
}

function getStorageKey(playerId: string): string {
  return `${STORY_CHECKPOINT_KEY}:${playerId.trim()}`;
}

function normalizeCheckpoint(value: unknown): StoryCheckpoint | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const candidate = value as Record<string, unknown>;
  if (typeof candidate.chapterId !== "string") return null;
  if (!storyChapters.some((chapter) => chapter.id === candidate.chapterId)) return null;
  if (typeof candidate.roundIndex !== "number" || !Number.isInteger(candidate.roundIndex)) return null;
  const roundIndex = candidate.roundIndex as number;
  if (roundIndex < 0 || roundIndex >= STORY_ROUND_COUNT) return null;
  return { chapterId: candidate.chapterId, roundIndex };
}

/** A local, profile-scoped resume point. It stores no prompt answers, voice transcripts or consent data. */
export function loadStoryCheckpoint(playerId: string, storage?: CheckpointStorage): StoryCheckpoint | null {
  try {
    const target = getStorage(storage);
    if (!target || !playerId.trim()) return null;
    const raw = target.getItem(getStorageKey(playerId));
    return raw ? normalizeCheckpoint(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

/** Persist only a known Story chapter and one of its three current round indexes. */
export function saveStoryCheckpoint(
  playerId: string,
  checkpoint: StoryCheckpoint,
  storage?: CheckpointStorage,
): boolean {
  try {
    const target = getStorage(storage);
    const normalized = normalizeCheckpoint(checkpoint);
    if (!target || !playerId.trim() || !normalized) return false;
    target.setItem(getStorageKey(playerId), JSON.stringify(normalized));
    return true;
  } catch {
    return false;
  }
}

/** Clear only the selected profile's resume point. */
export function clearStoryCheckpoint(playerId: string, storage?: CheckpointStorage): boolean {
  try {
    const target = getStorage(storage);
    if (!target || !playerId.trim()) return false;
    target.removeItem(getStorageKey(playerId));
    return true;
  } catch {
    return false;
  }
}
