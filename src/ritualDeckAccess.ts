export function isRitualDeckVisible(
  currentOwnerId: string | null,
  loadedOwnerId: string | null,
): boolean {
  return Boolean(currentOwnerId && currentOwnerId.trim() && loadedOwnerId === currentOwnerId);
}

export function shouldRevealRitualDraw(ownerIsCurrent: boolean, historySaved: boolean): boolean {
  return ownerIsCurrent && historySaved;
}
