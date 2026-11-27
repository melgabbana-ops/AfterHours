import { isExperienceStartAttemptCurrent, type ExperienceStartAttempt, type ExperienceStartContext } from "./experienceStartAttempt";

export type ExperienceResumeAttempt = ExperienceStartAttempt & {
  runId: string;
};

export type ExperienceResumeContext = ExperienceStartContext & {
  pendingRunId: string | null;
};

/** A resumed run may only become visible while its exact run and safety context remain current. */
export function isExperienceResumeAttemptCurrent(
  attempt: ExperienceResumeAttempt,
  context: ExperienceResumeContext,
): boolean {
  return attempt.runId === context.pendingRunId
    && isExperienceStartAttemptCurrent(attempt, context);
}
