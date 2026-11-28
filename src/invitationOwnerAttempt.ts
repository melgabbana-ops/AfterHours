import { isWorldOwnerAttemptCurrent, type WorldOwnerAttempt } from "./worldOwnerAttempt";

/** A run invitation may only be exposed while its owner and STOP state remain current. */
export function isInvitationOwnerAttemptCurrent(
  attempt: WorldOwnerAttempt,
  currentOwnerId: string | null,
  currentGeneration: number,
  stopPending: boolean,
): boolean {
  return !stopPending && isWorldOwnerAttemptCurrent(attempt, currentOwnerId, currentGeneration);
}
