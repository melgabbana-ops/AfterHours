export type WorldOwnerAttempt = {
  ownerId: string;
  generation: number;
};

/** A delayed private-world response may only update the account and view that started it. */
export function isWorldOwnerAttemptCurrent(
  attempt: WorldOwnerAttempt,
  currentOwnerId: string | null,
  currentGeneration: number,
): boolean {
  return attempt.ownerId.length > 0
    && attempt.ownerId === currentOwnerId
    && attempt.generation === currentGeneration;
}
