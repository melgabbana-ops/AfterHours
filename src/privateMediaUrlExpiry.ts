export const PRIVATE_MEDIA_URL_DISPLAY_MS = 55_000;

/**
 * Clear a signed private-media link from the UI shortly before its 60-second
 * server expiry. The margin allows for request transit and clock skew.
 */
export function createPrivateMediaUrlExpiryTimer() {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  const clear = () => {
    if (timeout === undefined) return;
    clearTimeout(timeout);
    timeout = undefined;
  };

  return {
    schedule(onExpire: () => void): void {
      clear();
      timeout = setTimeout(() => {
        timeout = undefined;
        onExpire();
      }, PRIVATE_MEDIA_URL_DISPLAY_MS);
    },
    clear,
  };
}
