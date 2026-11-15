import type { Screen } from "./types";

const DEEP_LINK_SCREENS: readonly Screen[] = [
  "game", "gameSelect", "complete", "profile", "admin", "insights", "radio",
  "aftercare", "prompts", "safety", "store", "onboarding", "controlroom",
  "missions", "legal", "social", "lovense", "daily",
];

export function initialScreenFromSearch(search: string): Screen {
  const value = new URLSearchParams(search).get("screen");
  return value && DEEP_LINK_SCREENS.includes(value as Screen) ? value as Screen : "home";
}
