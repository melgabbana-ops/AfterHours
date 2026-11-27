export type VaultAutoLockReason = "background" | "idle";

export interface VaultSensitiveContentState {
  authenticated: boolean;
  locked: boolean;
  itemCount: number;
  hasSignedUrl: boolean;
  hasPendingPreview: boolean;
  hasActiveCapture: boolean;
}

/** Only arm the inactivity lock while authenticated private content is visible. */
export function hasSensitiveVaultContent(state: VaultSensitiveContentState): boolean {
  return state.authenticated
    && !state.locked
    && (
      state.itemCount > 0
      || state.hasSignedUrl
      || state.hasPendingPreview
      || state.hasActiveCapture
    );
}

export interface VaultVisibilityTarget extends EventTarget {
  readonly visibilityState: string;
}

/**
 * Installs lifecycle and inactivity guards for sensitive vault state.
 * Returns a cleanup function suitable for a React effect.
 */
export function bindVaultAutoLock(
  windowTarget: EventTarget,
  documentTarget: VaultVisibilityTarget,
  isSensitive: () => boolean,
  onLock: (reason: VaultAutoLockReason) => void,
  idleMs = 5 * 60 * 1000,
  onBackgroundLock: (reason: VaultAutoLockReason) => void = onLock,
): () => void {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  const clearIdleTimeout = () => {
    if (timeout !== undefined) {
      clearTimeout(timeout);
      timeout = undefined;
    }
  };

  const lockIfSensitive = (
    reason: VaultAutoLockReason,
    notify: (reason: VaultAutoLockReason) => void = onLock,
  ) => {
    if (!isSensitive()) return;
    clearIdleTimeout();
    notify(reason);
  };

  // Background lifecycle events need a synchronous UI commit so private text
  // is cleared before mobile browsers capture the app-switcher snapshot.
  const onVisibilityChange = () => {
    if (documentTarget.visibilityState !== "visible") {
      lockIfSensitive("background", onBackgroundLock);
    }
  };

  const onPageHide = () => lockIfSensitive("background", onBackgroundLock);

  const resetIdleTimer = () => {
    clearIdleTimeout();
    if (!isSensitive()) return;
    timeout = setTimeout(() => lockIfSensitive("idle"), idleMs);
  };

  const activityEvents = ["pointerdown", "keydown", "touchstart", "wheel"] as const;
  documentTarget.addEventListener("visibilitychange", onVisibilityChange);
  // Capture scrolls from nested containers too, including the private vault list.
  documentTarget.addEventListener("scroll", resetIdleTimer, { passive: true, capture: true });
  windowTarget.addEventListener("pagehide", onPageHide);
  activityEvents.forEach((eventName) => {
    windowTarget.addEventListener(eventName, resetIdleTimer, { passive: true });
  });

  // The effect can mount after the document has already become hidden
  // (for example, between an async unlock check and React's next commit).
  // Do not wait for another visibilitychange event that may never arrive.
  if (documentTarget.visibilityState !== "visible") {
    lockIfSensitive("background");
  } else {
    resetIdleTimer();
  }

  return () => {
    clearIdleTimeout();
    documentTarget.removeEventListener("visibilitychange", onVisibilityChange);
    documentTarget.removeEventListener("scroll", resetIdleTimer, true);
    windowTarget.removeEventListener("pagehide", onPageHide);
    activityEvents.forEach((eventName) => {
      windowTarget.removeEventListener(eventName, resetIdleTimer);
    });
  };
}
