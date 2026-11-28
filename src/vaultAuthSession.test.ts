import { afterEach, describe, expect, it, vi } from "vitest";
import { bindVaultAuthSession, hasVaultAuthIdentityChanged, type VaultAuthClient } from "./vaultAuthSession";

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
      userId: "user-1",
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
      userId: null,
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
      userId: "user-1",
    });
    expect(onChange).toHaveBeenNthCalledWith(2, {
      event: "TOKEN_REFRESHED",
      authenticated: true,
      userId: "user-1",
    });
    cleanup();
  });

  it("fails closed when a session user has no usable id", () => {
    const harness = createAuthHarness();
    const onChange = vi.fn();
    const cleanup = bindVaultAuthSession(harness.auth, onChange);

    harness.emit("INITIAL_SESSION", { user: {} });

    expect(onChange).toHaveBeenCalledWith({
      event: "INITIAL_SESSION",
      authenticated: false,
      userId: null,
    });
    cleanup();
  });

  it("detects a real account switch but not an initial or unchanged identity", () => {
    expect(hasVaultAuthIdentityChanged(null, "user-1")).toBe(false);
    expect(hasVaultAuthIdentityChanged("user-1", "user-1")).toBe(false);
    expect(hasVaultAuthIdentityChanged("user-1", "user-2")).toBe(true);
    expect(hasVaultAuthIdentityChanged("user-1", null)).toBe(false);
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
