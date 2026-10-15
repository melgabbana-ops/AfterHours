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
