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

export function rankIndexFromXp(value: number): number {
  return rankThresholds.reduce<number>(
    (rank, threshold, index) => (value >= threshold ? index : rank),
    0,
  );
}

export function rankFromXp(value: number): (typeof rankNames)[number] {
  return rankNames[rankIndexFromXp(Math.max(0, value))];
}

export function levelFromXp(value: number): number {
  return Math.max(1, Math.floor(Math.max(0, value) / 200) + 1);
}
