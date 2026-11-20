export const AFTERCARE_JOURNAL_LEGACY_STORAGE_KEY = "afterhours.aftercare-journal.v1";
const PROFILE_STORAGE_PREFIX = "afterhours.aftercare-journal.v1:profile:";

export function getAftercareJournalStorageKey(profileId: string): string | null {
  const normalized = profileId.trim();
  if (!normalized || normalized.length > 128 || /[\u0000-\u001f\u007f]/.test(normalized)) return null;
  try {
    return PROFILE_STORAGE_PREFIX + encodeURIComponent(normalized);
  } catch {
    return null;
  }
}
