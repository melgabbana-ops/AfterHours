export const BOSS_MODE_STEP_COUNT = 5;

/** Keep only valid, unique Boss Mode steps in stable order. */
export function normalizeBossCompletedSteps(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((step): step is number =>
    typeof step === "number"
    && Number.isInteger(step)
    && step >= 0
    && step < BOSS_MODE_STEP_COUNT
  ))].sort((left, right) => left - right);
}

/** Mark one deliberately completed step; invalid indexes never change progress. */
export function markBossStepCompleted(completedSteps: unknown, stepIndex: number): number[] {
  const normalized = normalizeBossCompletedSteps(completedSteps);
  if (!Number.isInteger(stepIndex) || stepIndex < 0 || stepIndex >= BOSS_MODE_STEP_COUNT) {
    return normalized;
  }
  return [...new Set([...normalized, stepIndex])].sort((left, right) => left - right);
}

/** PASS is not completion: every one of the five steps must be explicitly marked. */
export function isBossModeFullyCompleted(completedSteps: unknown): boolean {
  return normalizeBossCompletedSteps(completedSteps).length === BOSS_MODE_STEP_COUNT;
}
