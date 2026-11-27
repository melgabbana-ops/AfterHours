import { afterEach, describe, expect, it, vi } from "vitest";
import { bindVaultAutoLock, hasSensitiveVaultContent } from "./vaultAutoLock";

class FakeDocument extends EventTarget {
  visibilityState = "visible";
}

describe("Black Vault automatic locking", () => {
  it("only treats authenticated, unlocked private content as sensitive", () => {
    const empty = {
      authenticated: true,
      locked: false,
      itemCount: 0,
      hasSignedUrl: false,
      hasPendingPreview: false,
      hasActiveCapture: false,
    };

    expect(hasSensitiveVaultContent(empty)).toBe(false);
    expect(hasSensitiveVaultContent({ ...empty, itemCount: 1 })).toBe(true);
    expect(hasSensitiveVaultContent({ ...empty, hasSignedUrl: true })).toBe(true);
    expect(hasSensitiveVaultContent({ ...empty, hasPendingPreview: true })).toBe(true);
    expect(hasSensitiveVaultContent({ ...empty, hasActiveCapture: true })).toBe(true);
    expect(hasSensitiveVaultContent({ ...empty, authenticated: false, itemCount: 1 })).toBe(false);
    expect(hasSensitiveVaultContent({ ...empty, locked: true, itemCount: 1 })).toBe(false);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("locks immediately when the vault guard mounts while the document is already hidden", () => {
    vi.useFakeTimers();
    const windowTarget = new EventTarget();
    const documentTarget = new FakeDocument();
    const onLock = vi.fn();
    documentTarget.visibilityState = "hidden";

    const cleanup = bindVaultAutoLock(windowTarget, documentTarget, () => true, onLock);

    expect(onLock).toHaveBeenCalledOnce();
    expect(onLock).toHaveBeenCalledWith("background");
    vi.advanceTimersByTime(5 * 60 * 1000);
    expect(onLock).toHaveBeenCalledOnce();
    cleanup();
  });

  it("does not lock an empty vault when the guard mounts while hidden", () => {
    const windowTarget = new EventTarget();
    const documentTarget = new FakeDocument();
    const onLock = vi.fn();
    documentTarget.visibilityState = "hidden";

    const cleanup = bindVaultAutoLock(windowTarget, documentTarget, () => false, onLock);

    expect(onLock).not.toHaveBeenCalled();
    cleanup();
  });

  it("locks sensitive content when the app becomes hidden", () => {
    const windowTarget = new EventTarget();
    const documentTarget = new FakeDocument();
    const onLock = vi.fn();
    const cleanup = bindVaultAutoLock(windowTarget, documentTarget, () => true, onLock);

    documentTarget.visibilityState = "hidden";
    documentTarget.dispatchEvent(new Event("visibilitychange"));

    expect(onLock).toHaveBeenCalledOnce();
    expect(onLock).toHaveBeenCalledWith("background");
    cleanup();
  });

  it("uses the synchronous background callback before page snapshots", () => {
    const windowTarget = new EventTarget();
    const documentTarget = new FakeDocument();
    const onLock = vi.fn();
    const onBackgroundLock = vi.fn();
    const cleanup = bindVaultAutoLock(windowTarget, documentTarget, () => true, onLock, undefined, onBackgroundLock);

    documentTarget.visibilityState = "hidden";
    documentTarget.dispatchEvent(new Event("visibilitychange"));
    expect(onBackgroundLock).toHaveBeenCalledOnce();
    expect(onBackgroundLock).toHaveBeenCalledWith("background");
    expect(onLock).not.toHaveBeenCalled();

    windowTarget.dispatchEvent(new Event("pagehide"));
    expect(onBackgroundLock).toHaveBeenCalledTimes(2);
    expect(onLock).not.toHaveBeenCalled();
    cleanup();
  });

  it("keeps the normal callback for an already-hidden initial mount", () => {
    const windowTarget = new EventTarget();
    const documentTarget = new FakeDocument();
    const onLock = vi.fn();
    const onBackgroundLock = vi.fn();
    documentTarget.visibilityState = "hidden";

    const cleanup = bindVaultAutoLock(windowTarget, documentTarget, () => true, onLock, undefined, onBackgroundLock);

    expect(onLock).toHaveBeenCalledOnce();
    expect(onLock).toHaveBeenCalledWith("background");
    expect(onBackgroundLock).not.toHaveBeenCalled();
    cleanup();
  });

  it("locks on pagehide but ignores lifecycle events when the vault is empty", () => {
    const windowTarget = new EventTarget();
    const documentTarget = new FakeDocument();
    const onLock = vi.fn();
    let sensitive = false;
    const cleanup = bindVaultAutoLock(windowTarget, documentTarget, () => sensitive, onLock);

    windowTarget.dispatchEvent(new Event("pagehide"));
    expect(onLock).not.toHaveBeenCalled();

    sensitive = true;
    windowTarget.dispatchEvent(new Event("pagehide"));
    expect(onLock).toHaveBeenCalledOnce();
    expect(onLock).toHaveBeenCalledWith("background");
    cleanup();
  });

  it("resets the five-minute inactivity deadline after pointer, keyboard or touch activity", () => {
    vi.useFakeTimers();
    const windowTarget = new EventTarget();
    const documentTarget = new FakeDocument();
    const onLock = vi.fn();
    const cleanup = bindVaultAutoLock(windowTarget, documentTarget, () => true, onLock);

    vi.advanceTimersByTime(3 * 60 * 1000);
    windowTarget.dispatchEvent(new Event("pointerdown"));
    vi.advanceTimersByTime(3 * 60 * 1000);
    windowTarget.dispatchEvent(new Event("keydown"));
    vi.advanceTimersByTime(3 * 60 * 1000);
    windowTarget.dispatchEvent(new Event("touchstart"));
    vi.advanceTimersByTime(5 * 60 * 1000 - 1);
    expect(onLock).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(onLock).toHaveBeenCalledOnce();
    expect(onLock).toHaveBeenCalledWith("idle");
    cleanup();
  });

  it("resets the inactivity deadline after wheel and nested scroll activity", () => {
    vi.useFakeTimers();
    const windowTarget = new EventTarget();
    const documentTarget = new FakeDocument();
    const onLock = vi.fn();
    const cleanup = bindVaultAutoLock(windowTarget, documentTarget, () => true, onLock);

    vi.advanceTimersByTime(4 * 60 * 1000);
    windowTarget.dispatchEvent(new Event("wheel"));
    vi.advanceTimersByTime(4 * 60 * 1000);
    documentTarget.dispatchEvent(new Event("scroll"));
    vi.advanceTimersByTime(5 * 60 * 1000 - 1);

    expect(onLock).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(onLock).toHaveBeenCalledOnce();
    expect(onLock).toHaveBeenCalledWith("idle");
    cleanup();
  });

  it("removes listeners and cancels the inactivity timer on cleanup", () => {
    vi.useFakeTimers();
    const windowTarget = new EventTarget();
    const documentTarget = new FakeDocument();
    const onLock = vi.fn();
    const cleanup = bindVaultAutoLock(windowTarget, documentTarget, () => true, onLock);

    cleanup();
    vi.advanceTimersByTime(5 * 60 * 1000);
    windowTarget.dispatchEvent(new Event("pagehide"));
    documentTarget.visibilityState = "hidden";
    documentTarget.dispatchEvent(new Event("visibilitychange"));

    expect(onLock).not.toHaveBeenCalled();
  });
});
