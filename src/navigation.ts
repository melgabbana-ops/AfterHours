import type { Screen } from "./types";

const DEEP_LINK_SCREENS: readonly Screen[] = [
  "game", "gameSelect", "complete", "profile", "admin", "insights", "radio",
  "aftercare", "prompts", "safety", "store", "onboarding", "controlroom",
  "missions", "legal", "social", "lovense", "daily", "capture", "cinematic", "couples", "settings",
];

export function initialScreenFromSearch(search: string): Screen {
  const params = new URLSearchParams(search);
  if (params.has("stop") || params.get("screen") === "safety") return "safety";
  if (params.has("couple")) return "couples";
  const value = params.get("screen");
  return value && DEEP_LINK_SCREENS.includes(value as Screen) ? value as Screen : "home";
}

export function shouldShowColdIntro(search: string): boolean {
  const params = new URLSearchParams(search);
  return !params.has("stop") && !params.has("couple") && params.get("screen") !== "safety" && params.get("screen") !== "legal";
}

export function shouldShowTeaser(search: string): boolean {
  const params = new URLSearchParams(search);
  const protectedRoute = params.has("stop")
    || params.has("couple")
    || params.get("screen") === "safety"
    || params.get("screen") === "legal";
  return params.get("teaser") === "1" && !protectedRoute;
}
