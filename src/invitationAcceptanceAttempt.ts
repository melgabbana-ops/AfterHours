import { isWorldOwnerAttemptCurrent, type WorldOwnerAttempt } from "./worldOwnerAttempt";

export type InvitationAcceptanceAttempt = WorldOwnerAttempt & {
  token: string;
};

/** An invitation acceptance may only complete for its original owner, view, and token. */
export function isInvitationAcceptanceAttemptCurrent(
  attempt: InvitationAcceptanceAttempt,
  currentOwnerId: string | null,
  currentGeneration: number,
  currentToken: string | null,
): boolean {
  return attempt.token.length > 0
    && attempt.token === currentToken
    && isWorldOwnerAttemptCurrent(attempt, currentOwnerId, currentGeneration);
}
