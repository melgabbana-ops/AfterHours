export type ExperienceStartAttempt = {
  id: number;
  ownerId: string;
};

export type ExperienceStartContext = {
  currentAttemptId: number;
  currentOwnerId: string | null;
  consentActive: boolean;
  canStartExperience: boolean;
  stopPending: boolean;
};

/**
 * A server-created run may only become visible as an active client scene if
 * the same account, consent and safety state still hold when the request ends.
 */
export function isExperienceStartAttemptCurrent(
  attempt: ExperienceStartAttempt,
  context: ExperienceStartContext,
): boolean {
  return attempt.id === context.currentAttemptId
    && attempt.ownerId === context.currentOwnerId
    && context.consentActive
    && context.canStartExperience
    && !context.stopPending;
}
