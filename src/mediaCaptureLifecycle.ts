export interface MediaCaptureVisibilityDocument extends EventTarget {
  readonly visibilityState: string;
}

/** A pending camera/microphone request is valid only while the same view stays mounted and visible. */
export function isMediaCaptureAttemptCurrent(
  generation: number,
  currentGeneration: number,
  visibilityState: string,
  mounted: boolean,
): boolean {
  return mounted && generation === currentGeneration && visibilityState === "visible";
}

/** Stop capture and hide private previews when the page leaves the foreground. */
export function bindMediaCaptureBackgroundGuard(
  windowTarget: EventTarget,
  documentTarget: MediaCaptureVisibilityDocument,
  onBackground: () => void,
  onForeground: () => void = () => undefined,
): () => void {
  let active = true;
  let backgroundNotified = false;
  let foregroundNotified = documentTarget.visibilityState === "visible";

  const notifyBackground = () => {
    if (!active || backgroundNotified) return;
    backgroundNotified = true;
    foregroundNotified = false;
    onBackground();
  };

  const notifyForeground = () => {
    if (!active || documentTarget.visibilityState !== "visible" || foregroundNotified) return;
    foregroundNotified = true;
    backgroundNotified = false;
    onForeground();
  };

  const onVisibilityChange = () => {
    if (documentTarget.visibilityState === "visible") notifyForeground();
    else notifyBackground();
  };

  documentTarget.addEventListener("visibilitychange", onVisibilityChange);
  windowTarget.addEventListener("pagehide", notifyBackground);
  windowTarget.addEventListener("pageshow", notifyForeground);

  if (documentTarget.visibilityState !== "visible") notifyBackground();

  return () => {
    if (!active) return;
    active = false;
    documentTarget.removeEventListener("visibilitychange", onVisibilityChange);
    windowTarget.removeEventListener("pagehide", notifyBackground);
    windowTarget.removeEventListener("pageshow", notifyForeground);
  };
}
