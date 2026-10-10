export const rankNames = [
  "CURIOUS",
  "TEASE",
  "PLAYTHING",
  "SUBMISSIVE",
  "BRAT",
  "TOY",
  "PET",
  "THRALL",
  "DEVOTEE",
  "OBEDIENT",
  "ENTHRALLED",
  "COLLARED",
  "OWNED",
  "DEVOTED",
  "DARK DEVOTION",
] as const;

// Fifteen approved player ranks; the final title unlocks at 5,000 XP.
export const rankThresholds = [
  0, 100, 250, 450, 700, 1000, 1400, 1800, 2300, 2800, 3400, 3900, 4350, 4700, 5000,
] as const;

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
