const STORAGE_KEY = "afterhours.saved-prompts.v1";

const storageKeyFor = (playerId: string) => `${STORAGE_KEY}:${playerId}`;

function normalizePromptIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(
    value
      .filter((id): id is string => typeof id === "string" && id.trim().length > 0)
      .map((id) => id.trim()),
  )];
}

/** Load saved prompt IDs from this player's local-only bookmark list. */
export function loadSavedPromptIds(playerId: string): string[] {
  try {
    const raw = localStorage.getItem(storageKeyFor(playerId));
    return raw ? normalizePromptIds(JSON.parse(raw)) : [];
  } catch {
    return [];
  }
}

/** Save prompt bookmarks locally; storage failures must not block the experience. */
export function saveSavedPromptIds(playerId: string, ids: readonly string[]): void {
  try {
    localStorage.setItem(storageKeyFor(playerId), JSON.stringify(normalizePromptIds(ids)));
  } catch {
    // Bookmarks are optional when browser storage is unavailable.
  }
}
