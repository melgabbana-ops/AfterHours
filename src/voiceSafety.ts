export type VoiceSafetyIntent = "stop" | "pause";

/**
 * Map explicit spoken safety words to app-level actions.
 * STOP has priority if a transcript contains both STOP and PAUSE language.
 */
export function getVoiceSafetyIntent(spoken: string, language: "nl" | "en"): VoiceSafetyIntent | null {
  const message = spoken.normalize("NFKC").toLocaleLowerCase(language === "nl" ? "nl-NL" : "en-US").trim();
  if (!message) return null;

  const stopIntent = language === "nl"
    ? /\b(?:stop(?:pen)?|rood|ik wil niet|beëindig(?:en)?|beeindig(?:en)?|klaar ermee)\b/i
    : /\b(?:stop|red|i don't want to|i do not want to|end it|finish now)\b/i;
  const pauseIntent = language === "nl"
    ? /\b(?:geel|pauze|twijfel|langzamer|aanpassen|anders|help|onveilig|bang|pijn|niet prettig)\b/i
    : /\b(?:yellow|pause|not sure|slower|slow down|change|adjust|help|unsafe|scared|pain|uncomfortable)\b/i;

  if (stopIntent.test(message)) return "stop";
  if (pauseIntent.test(message)) return "pause";
  return null;
}
