export function isRitualDeckVisible(
  currentOwnerId: string | null,
  loadedOwnerId: string | null,
): boolean {
  return Boolean(currentOwnerId && currentOwnerId.trim() && loadedOwnerId === currentOwnerId);
}
