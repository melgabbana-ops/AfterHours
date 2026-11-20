export const rankNames = [
  "THE CURIOUS",
  "THE INITIATE",
  "THE DEVOTED",
  "THE DISCIPLINED",
  "THE ENTHRALLED",
  "THE BOUND",
  "AFTER HOURS",
] as const;

export const rankThresholds = [0, 250, 600, 1200, 2000, 3500, 5000] as const;

/**
 * Treat malformed XP values as zero so a corrupted or incomplete profile
 * cannot produce NaN levels or unlock the top rank through Infinity.
 */
function normalizeXp(value: number): number {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

export function rankIndexFromXp(value: number): number {
  const xp = normalizeXp(value);
  return rankThresholds.reduce<number>(
    (rank, threshold, index) => (xp >= threshold ? index : rank),
    0,
  );
}

export function rankFromXp(value: number): (typeof rankNames)[number] {
  return rankNames[rankIndexFromXp(value)];
}

export function levelFromXp(value: number): number {
  return Math.max(1, Math.floor(normalizeXp(value) / 200) + 1);
}


export interface RankProgress {
  xp: number;
  rankIndex: number;
  rankName: (typeof rankNames)[number];
  currentThreshold: number;
  nextThreshold: number | null;
  nextRankName: (typeof rankNames)[number] | null;
  xpToNext: number;
  progressPercent: number;
  isMaxRank: boolean;
}

/** Return safe, display-ready progress for the seven approved cosmetic ranks. */
export function rankProgressFromXp(value: number): RankProgress {
  const xp = normalizeXp(value);
  const rankIndex = rankIndexFromXp(xp);
  const currentThreshold = rankThresholds[rankIndex];
  const nextThreshold = rankThresholds[rankIndex + 1] ?? null;
  const isMaxRank = nextThreshold === null;
  const progressPercent = isMaxRank
    ? 100
    : Math.max(0, Math.min(99, Math.floor(((xp - currentThreshold) / (nextThreshold - currentThreshold)) * 100)));

  return {
    xp,
    rankIndex,
    rankName: rankNames[rankIndex],
    currentThreshold,
    nextThreshold,
    nextRankName: isMaxRank ? null : rankNames[rankIndex + 1],
    xpToNext: isMaxRank ? 0 : Math.max(0, Math.ceil(nextThreshold - xp)),
    progressPercent,
    isMaxRank,
  };
}
