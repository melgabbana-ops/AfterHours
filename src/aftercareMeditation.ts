export const AFTERCARE_MEDITATION_DURATION_SECONDS = 30 * 60;

export const AFTERCARE_MEDITATION_PHASES = [
  {
    id: "arrive",
    endSeconds: 5 * 60,
    titleNl: "Aankomen",
    titleEn: "Arrive",
    instructionNl: "Zoek een houding die prettig voelt. Je ogen mogen open of dicht blijven; allebei is goed.",
    instructionEn: "Find a position that feels comfortable. Your eyes may stay open or closed; either is fine.",
  },
  {
    id: "breath",
    endSeconds: 10 * 60,
    titleNl: "Ademruimte",
    titleEn: "Breathing space",
    instructionNl: "Merk je ademhaling op zoals die vanzelf gaat. Verander of houd je adem niet vast. Als aandacht voor je adem niet prettig voelt, voel dan je voeten op de vloer.",
    instructionEn: "Notice your breath as it naturally moves. Do not change it or hold it. If focusing on breathing feels uncomfortable, notice your feet on the floor instead.",
  },
  {
    id: "body",
    endSeconds: 15 * 60,
    titleNl: "Lichaam",
    titleEn: "Body",
    instructionNl: "Breng je aandacht rustig langs je schouders, handen, kaak en gezicht. Je hoeft niets te veranderen of op te lossen.",
    instructionEn: "Gently move your attention across your shoulders, hands, jaw and face. Nothing needs to be changed or fixed.",
  },
  {
    id: "ground",
    endSeconds: 20 * 60,
    titleNl: "Gronding",
    titleEn: "Grounding",
    instructionNl: "Voel waar je lichaam wordt ondersteund. Merk drie dingen op die je kunt zien, horen of voelen.",
    instructionEn: "Notice where your body is supported. Name three things you can see, hear or feel.",
  },
  {
    id: "kindness",
    endSeconds: 25 * 60,
    titleNl: "Zachtheid",
    titleEn: "Kindness",
    instructionNl: "Laat gedachten komen en gaan zonder ze weg te duwen. Je hoeft je niet op een bepaalde manier te voelen.",
    instructionEn: "Let thoughts come and go without pushing them away. You do not have to feel any particular way.",
  },
  {
    id: "return",
    endSeconds: AFTERCARE_MEDITATION_DURATION_SECONDS,
    titleNl: "Terugkeren",
    titleEn: "Return",
    instructionNl: "Kom rustig terug in de ruimte. Beweeg je vingers en tenen, kijk om je heen en kies wat je nu nodig hebt.",
    instructionEn: "Gently return to the room. Move your fingers and toes, look around and choose what you need next.",
  },
] as const;

function normalizeElapsedSeconds(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(AFTERCARE_MEDITATION_DURATION_SECONDS, Math.max(0, Math.floor(value)));
}

export function getAftercareMeditationPhase(elapsedSeconds: number) {
  const elapsed = normalizeElapsedSeconds(elapsedSeconds);
  return AFTERCARE_MEDITATION_PHASES.find((phase) => elapsed < phase.endSeconds)
    ?? AFTERCARE_MEDITATION_PHASES[AFTERCARE_MEDITATION_PHASES.length - 1];
}

/** Move to the next phase boundary without rewinding elapsed time. */
export function skipAftercareMeditationPhase(elapsedSeconds: number): number {
  const elapsed = normalizeElapsedSeconds(elapsedSeconds);
  return Math.max(elapsed, getAftercareMeditationPhase(elapsed).endSeconds);
}

export function getAftercareMeditationRemainingSeconds(elapsedSeconds: number): number {
  return AFTERCARE_MEDITATION_DURATION_SECONDS - normalizeElapsedSeconds(elapsedSeconds);
}

export function getAftercareMeditationProgressPercent(elapsedSeconds: number): number {
  return Math.round((normalizeElapsedSeconds(elapsedSeconds) / AFTERCARE_MEDITATION_DURATION_SECONDS) * 100);
}

export function formatAftercareMeditationTime(seconds: number): string {
  const safeSeconds = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
  const minutes = Math.floor(safeSeconds / 60).toString().padStart(2, "0");
  const remainder = (safeSeconds % 60).toString().padStart(2, "0");
  return minutes + ":" + remainder;
}

/** A concise localized label for assistive technology; the visible clock stays compact. */
export function getAftercareMeditationAccessibleTime(seconds: number, language: "nl" | "en"): string {
  const safeSeconds = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = safeSeconds % 60;

  if (language === "nl") {
    const minuteLabel = minutes === 1 ? "minuut" : "minuten";
    const secondLabel = remainder === 1 ? "seconde" : "seconden";
    if (minutes === 0) return remainder + " " + secondLabel + " resterend";
    if (remainder === 0) return minutes + " " + minuteLabel + " resterend";
    return minutes + " " + minuteLabel + " en " + remainder + " " + secondLabel + " resterend";
  }

  const minuteLabel = minutes === 1 ? "minute" : "minutes";
  const secondLabel = remainder === 1 ? "second" : "seconds";
  if (minutes === 0) return remainder + " " + secondLabel + " remaining";
  if (remainder === 0) return minutes + " " + minuteLabel + " remaining";
  return minutes + " " + minuteLabel + " and " + remainder + " " + secondLabel + " remaining";
}

type AftercareMeditationStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;
const AFTERCARE_MEDITATION_PROGRESS_KEY = "afterhours:aftercare-meditation-progress:v1";

/** Read tab-scoped progress safely; malformed or unavailable storage starts at zero. */
export function loadAftercareMeditationProgress(storage: AftercareMeditationStorage | null): number {
  if (!storage) return 0;
  try {
    const raw = storage.getItem(AFTERCARE_MEDITATION_PROGRESS_KEY);
    if (raw === null || raw.trim() === "") return 0;
    const parsed = Number(raw);
    return normalizeElapsedSeconds(parsed);
  } catch {
    return 0;
  }
}

/** Save only elapsed seconds, never journal text, mood data or session content. */
export function saveAftercareMeditationProgress(
  storage: AftercareMeditationStorage | null,
  elapsedSeconds: number,
): boolean {
  if (!storage) return false;
  try {
    storage.setItem(AFTERCARE_MEDITATION_PROGRESS_KEY, String(normalizeElapsedSeconds(elapsedSeconds)));
    return true;
  } catch {
    return false;
  }
}

/** Explicitly clear the saved timer when the user ends the exercise. */
export function clearAftercareMeditationProgress(storage: AftercareMeditationStorage | null): boolean {
  if (!storage) return false;
  try {
    storage.removeItem(AFTERCARE_MEDITATION_PROGRESS_KEY);
    return true;
  } catch {
    return false;
  }
}
