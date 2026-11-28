import { isWorldOwnerAttemptCurrent, type WorldOwnerAttempt } from "./worldOwnerAttempt";

export type InvitationOwnerAttempt = WorldOwnerAttempt & {
  safetyGeneration: number;
};

/** A run invitation may only be exposed while its owner, safety generation and STOP state remain current. */
export function isInvitationOwnerAttemptCurrent(
  attempt: InvitationOwnerAttempt,
  currentOwnerId: string | null,
  currentGeneration: number,
  currentSafetyGeneration: number,
  stopPending: boolean,
): boolean {
  return attempt.safetyGeneration === currentSafetyGeneration
    && !stopPending
    && isWorldOwnerAttemptCurrent(attempt, currentOwnerId, currentGeneration);
}
