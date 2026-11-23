export function canContinuePrivateJournalUnlock(
  generation: number,
  currentGeneration: number,
  visibilityState: string,
): boolean {
  return generation === currentGeneration && visibilityState === "visible";
}
