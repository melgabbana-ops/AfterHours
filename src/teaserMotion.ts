export const TEASER_REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

export interface TeaserVideoMotionSettings {
  autoPlay: boolean;
  loop: boolean;
  controls: boolean;
  preload: "metadata" | "none";
}

/** Keep the cinematic loop for normal motion preferences; make playback user-controlled when motion is reduced. */
export function getTeaserVideoMotionSettings(prefersReducedMotion: boolean): TeaserVideoMotionSettings {
  if (prefersReducedMotion) {
    return { autoPlay: false, loop: false, controls: true, preload: "none" };
  }
  return { autoPlay: true, loop: true, controls: false, preload: "metadata" };
}

/** Subscribe to OS/browser motion preference changes, including older Safari's listener API. */
export function subscribeToReducedMotionPreference(
  mediaQuery: MediaQueryList,
  onChange: (prefersReducedMotion: boolean) => void,
): () => void {
  const listener = (event: MediaQueryListEvent) => onChange(event.matches);

  if (typeof mediaQuery.addEventListener === "function") {
    mediaQuery.addEventListener("change", listener);
    return () => mediaQuery.removeEventListener("change", listener);
  }

  mediaQuery.addListener(listener);
  return () => mediaQuery.removeListener(listener);
}
