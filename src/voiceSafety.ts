export type VoiceSafetyIntent = "stop" | "pause";

export interface VoiceSafetySignals {
  stopWord?: string;
  pauseWord?: string;
}

function matchesConfiguredSignal(message: string, signal: string | undefined, locale: string): boolean {
  const normalizedSignal = (signal ?? "")
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase(locale);
  if (!normalizedSignal) return false;

  const escaped = normalizedSignal.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`(^|[^\\p{L}\\p{N}_-])${escaped}(?=$|[^\\p{L}\\p{N}_-])`, "u");
  return pattern.test(message);
}

/**
 * Map built-in and user-configured spoken safety signals to app-level actions.
 * Custom signals are read from the local safety plan and are never sent to a server.
 * STOP has priority if a transcript contains both STOP and PAUSE language.
 */
export function getVoiceSafetyIntent(
  spoken: string,
  language: "nl" | "en",
  signals: VoiceSafetySignals = {},
): VoiceSafetyIntent | null {
  const locale = language === "nl" ? "nl-NL" : "en-US";
  const message = spoken
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .toLocaleLowerCase(locale)
    .trim();
  if (!message) return null;

  const stopIntent = language === "nl"
    ? /\b(?:stop(?:pen)?|rood|ik wil niet|beëindig(?:en)?|beeindig(?:en)?|klaar ermee)\b/i
    : /\b(?:stop|red|i don't want to|i do not want to|end it|finish now)\b/i;
  const pauseIntent = language === "nl"
    ? /\b(?:geel|pauze|twijfel|langzamer|aanpassen|anders|help|onveilig|bang|pijn|niet prettig)\b/i
    : /\b(?:yellow|pause|not sure|slower|slow down|change|adjust|help|unsafe|scared|pain|uncomfortable)\b/i;

  if (stopIntent.test(message) || matchesConfiguredSignal(message, signals.stopWord, locale)) return "stop";
  if (pauseIntent.test(message) || matchesConfiguredSignal(message, signals.pauseWord, locale)) return "pause";
  return null;
}


/**
 * Recognize only explicit, standalone PASS requests.
 * This is navigation, not a safety signal: STOP and PAUSE are evaluated first.
 * A pass skips the current card/round but never completes a game or awards XP.
 */
export function isExplicitVoicePass(spoken: string, language: "nl" | "en"): boolean {
  const locale = language === "nl" ? "nl-NL" : "en-US";
  const normalized = spoken
    .normalize("NFKC")
    .replace(/[’‘]/g, "'")
    .replace(/[.,!?;:]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase(locale);

  if (!normalized) return false;

  const explicitPass = language === "nl"
    ? /^(?:pass|nee|nee bedankt|ik pas|ik wil passen|overslaan|sla over|sla deze over|deze overslaan|ik wil overslaan|ik wil deze overslaan)$/u
    : /^(?:pass|no|no thanks|i'll pass|i will pass|skip|skip this|not this one|i want to skip|i want to skip this)$/u;

  return explicitPass.test(normalized);
}
