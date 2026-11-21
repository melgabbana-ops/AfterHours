import type { Screen } from "./types";

const DEEP_LINK_SCREENS: readonly Screen[] = [
  "game", "gameSelect", "complete", "profile", "admin", "insights", "radio",
  "aftercare", "prompts", "safety", "store", "onboarding", "controlroom",
  "missions", "legal", "social", "lovense", "daily", "capture", "cinematic", "couples",
];

export function initialScreenFromSearch(search: string): Screen {
  const params = new URLSearchParams(search);
  if (params.has("couple")) return "couples";
  const value = params.get("screen");
  return value && DEEP_LINK_SCREENS.includes(value as Screen) ? value as Screen : "home";
}

export function shouldShowTeaser(search: string): boolean {
  return new URLSearchParams(search).get("teaser") === "1";
}
