import { afterEach, describe, expect, it, vi } from "vitest";
import { bindVaultAutoLock } from "./vaultAutoLock";

class FakeDocument extends EventTarget {
  visibilityState = "visible";
}

describe("Black Vault automatic locking", () => {
  afterEach(() => {
    vi.useRealTimers();
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

    vi.advanceTimersByTime(4 * 60 * 1000);
    windowTarget.dispatchEvent(new Event("keydown"));
    vi.advanceTimersByTime(4 * 60 * 1000);
    windowTarget.dispatchEvent(new Event("touchstart"));
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
