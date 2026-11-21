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

export const BOSS_MODE_STEP_XP = 25;
export const BOSS_MODE_COMPLETION_BONUS_XP = 75;

export interface BossModeAwardReceipt {
  xpEarned: number;
  stepXp: number;
  completionBonusXp: number;
  alreadyAwarded: boolean;
  fullCompletion: boolean;
  profileXp: number | null;
  profileLevel: number | null;
}

/** Validate the server's JSON receipt before using it to update client progress. */
export function parseBossModeAwardReceipt(value: unknown): BossModeAwardReceipt | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const raw = value as Record<string, unknown>;
  const xpEarned = raw.xp_earned;
  const stepXp = raw.step_xp;
  const completionBonusXp = raw.completion_bonus_xp;
  const alreadyAwarded = raw.already_awarded;
  const fullCompletion = raw.full_completion;
  const profileXp = raw.profile_xp;
  const profileLevel = raw.profile_level;

  if (!Number.isInteger(xpEarned) || !Number.isInteger(stepXp) || !Number.isInteger(completionBonusXp)) return null;
  if (typeof alreadyAwarded !== "boolean" || typeof fullCompletion !== "boolean") return null;
  if (![0, BOSS_MODE_STEP_XP].includes(stepXp as number)) return null;
  if (![0, BOSS_MODE_COMPLETION_BONUS_XP].includes(completionBonusXp as number)) return null;
  if ((xpEarned as number) !== (stepXp as number) + (completionBonusXp as number)) return null;
  if ((profileXp === null) !== (profileLevel === null)) return null;

  if (alreadyAwarded) {
    if (xpEarned !== 0 || stepXp !== 0 || completionBonusXp !== 0 || profileXp !== null) return null;
  } else {
    if (stepXp !== BOSS_MODE_STEP_XP || profileXp === null || profileLevel === null) return null;
    if (fullCompletion !== (completionBonusXp === BOSS_MODE_COMPLETION_BONUS_XP)) return null;
  }

  if (profileXp !== null && (!Number.isInteger(profileXp) || (profileXp as number) < 0)) return null;
  if (profileLevel !== null && (!Number.isInteger(profileLevel) || (profileLevel as number) < 1)) return null;

  return {
    xpEarned: xpEarned as number,
    stepXp: stepXp as number,
    completionBonusXp: completionBonusXp as number,
    alreadyAwarded,
    fullCompletion,
    profileXp: profileXp as number | null,
    profileLevel: profileLevel as number | null,
  };
}
