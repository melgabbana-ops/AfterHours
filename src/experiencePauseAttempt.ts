import { isExperienceStartAttemptCurrent, type ExperienceStartAttempt, type ExperienceStartContext } from "./experienceStartAttempt";

export type ExperiencePauseAttempt = ExperienceStartAttempt & {
  runId: string;
};

export type ExperiencePauseContext = ExperienceStartContext & {
  currentRunId: string | null;
};

/** A late pause response must not overwrite a newer STOP, run, account, or consent state. */
export function isExperiencePauseAttemptCurrent(
  attempt: ExperiencePauseAttempt,
  context: ExperiencePauseContext,
): boolean {
  return attempt.runId === context.currentRunId
    && isExperienceStartAttemptCurrent(attempt, context);
}
