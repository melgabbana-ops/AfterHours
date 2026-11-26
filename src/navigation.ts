import type { Screen } from "./types";

const DEEP_LINK_SCREENS: readonly Screen[] = [
  "game", "gameSelect", "complete", "profile", "admin", "insights", "radio",
  "aftercare", "prompts", "safety", "store", "onboarding", "controlroom",
  "missions", "legal", "social", "lovense", "daily", "capture", "cinematic", "couples",
];

const SAFETY_ENTRY_PARAMS = ["stop", "safety", "safeword", "pause"] as const;

export function initialScreenFromSearch(search: string): Screen {
  const params = new URLSearchParams(search);
  if (params.has("couple")) return "couples";
  const value = params.get("screen");
  return value && DEEP_LINK_SCREENS.includes(value as Screen) ? value as Screen : "home";
}

/**
 * Show the cinematic intro on a normal cold launch only.
 * Deep links, explicit entry links, maintenance previews and any in-progress
 * safety state bypass it so the intro can never sit in front of STOP or safety.
 */
export function shouldShowTeaser(search: string, hasActiveSafetyState = false): boolean {
  const params = new URLSearchParams(search);
  if (hasActiveSafetyState) return false;
  if (params.get("enter") === "1" || params.get("maintenance") === "1") return false;
  if (SAFETY_ENTRY_PARAMS.some((key) => params.has(key))) return false;
  if (params.has("couple")) return false;
  const screen = params.get("screen");
  if (screen && DEEP_LINK_SCREENS.includes(screen as Screen)) return false;
  return params.get("teaser") === "1" || search.trim() === "" || !params.has("screen");
}
