import { afterEach, describe, expect, it, vi } from "vitest";
import { bindVaultAuthSession, type VaultAuthClient } from "./vaultAuthSession";

function createAuthHarness() {
  let listener: ((event: string, session: { user?: unknown } | null) => void) | undefined;
  const unsubscribe = vi.fn();
  const auth: VaultAuthClient = {
    onAuthStateChange(callback) {
      listener = callback;
      return { data: { subscription: { unsubscribe } } };
    },
  };

  return {
    auth,
    unsubscribe,
    emit(event: string, session: { user?: unknown } | null) {
      listener?.(event, session);
    },
  };
}

describe("Black Vault authentication lifecycle", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("reports an authenticated initial session", () => {
    const harness = createAuthHarness();
    const onChange = vi.fn();
    const cleanup = bindVaultAuthSession(harness.auth, onChange);

    harness.emit("INITIAL_SESSION", { user: { id: "user-1" } });

    expect(onChange).toHaveBeenCalledWith({
      event: "INITIAL_SESSION",
      authenticated: true,
    });
    cleanup();
  });

  it("treats SIGNED_OUT as unauthenticated even if a stale session object is supplied", () => {
    const harness = createAuthHarness();
    const onChange = vi.fn();
    const cleanup = bindVaultAuthSession(harness.auth, onChange);

    harness.emit("SIGNED_OUT", { user: { id: "stale-user" } });

    expect(onChange).toHaveBeenCalledWith({
      event: "SIGNED_OUT",
      authenticated: false,
    });
    cleanup();
  });

  it("reports a restored session after sign-in or token refresh", () => {
    const harness = createAuthHarness();
    const onChange = vi.fn();
    const cleanup = bindVaultAuthSession(harness.auth, onChange);
    const session = { user: { id: "user-1" } };

    harness.emit("SIGNED_IN", session);
    harness.emit("TOKEN_REFRESHED", session);

    expect(onChange).toHaveBeenNthCalledWith(1, {
      event: "SIGNED_IN",
      authenticated: true,
    });
    expect(onChange).toHaveBeenNthCalledWith(2, {
      event: "TOKEN_REFRESHED",
      authenticated: true,
    });
    cleanup();
  });

  it("unsubscribes and ignores callbacks after cleanup", () => {
    const harness = createAuthHarness();
    const onChange = vi.fn();
    const cleanup = bindVaultAuthSession(harness.auth, onChange);

    cleanup();
    harness.emit("SIGNED_OUT", null);
    cleanup();

    expect(harness.unsubscribe).toHaveBeenCalledOnce();
    expect(onChange).not.toHaveBeenCalled();
  });
});
