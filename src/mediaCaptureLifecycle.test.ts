import { describe, expect, it, vi } from "vitest";
import mediaVaultSource from "./MediaVault.tsx?raw";
import {
  bindMediaCaptureBackgroundGuard,
  isMediaCaptureAttemptCurrent,
} from "./mediaCaptureLifecycle";

class FakeDocument extends EventTarget {
  visibilityState = "visible";
}

describe("media capture visibility lifecycle", () => {
  it("accepts only the current attempt while mounted and visible", () => {
    expect(isMediaCaptureAttemptCurrent(3, 3, "visible", true)).toBe(true);
    expect(isMediaCaptureAttemptCurrent(3, 4, "visible", true)).toBe(false);
    expect(isMediaCaptureAttemptCurrent(3, 3, "hidden", true)).toBe(false);
    expect(isMediaCaptureAttemptCurrent(3, 3, "visible", false)).toBe(false);
  });

  it("stops once for a hidden transition even when pagehide follows", () => {
    const windowTarget = new EventTarget();
    const documentTarget = new FakeDocument();
    const onBackground = vi.fn();
    const onForeground = vi.fn();
    const cleanup = bindMediaCaptureBackgroundGuard(windowTarget, documentTarget, onBackground, onForeground);

    documentTarget.visibilityState = "hidden";
    documentTarget.dispatchEvent(new Event("visibilitychange"));
    windowTarget.dispatchEvent(new Event("pagehide"));
    expect(onBackground).toHaveBeenCalledOnce();
    expect(onForeground).not.toHaveBeenCalled();

    documentTarget.visibilityState = "visible";
    documentTarget.dispatchEvent(new Event("visibilitychange"));
    windowTarget.dispatchEvent(new Event("pageshow"));
    expect(onForeground).toHaveBeenCalledOnce();
    cleanup();
  });

  it("handles pagehide and pageshow when visibilitychange is unavailable", () => {
    const windowTarget = new EventTarget();
    const documentTarget = new FakeDocument();
    const onBackground = vi.fn();
    const onForeground = vi.fn();
    const cleanup = bindMediaCaptureBackgroundGuard(windowTarget, documentTarget, onBackground, onForeground);

    windowTarget.dispatchEvent(new Event("pagehide"));
    windowTarget.dispatchEvent(new Event("pageshow"));
    expect(onBackground).toHaveBeenCalledOnce();
    expect(onForeground).toHaveBeenCalledOnce();
    cleanup();
  });

  it("locks immediately when mounted into a hidden document", () => {
    const windowTarget = new EventTarget();
    const documentTarget = new FakeDocument();
    documentTarget.visibilityState = "hidden";
    const onBackground = vi.fn();
    const cleanup = bindMediaCaptureBackgroundGuard(windowTarget, documentTarget, onBackground);

    expect(onBackground).toHaveBeenCalledOnce();
    cleanup();
  });

  it("removes lifecycle listeners on cleanup", () => {
    const windowTarget = new EventTarget();
    const documentTarget = new FakeDocument();
    const onBackground = vi.fn();
    const cleanup = bindMediaCaptureBackgroundGuard(windowTarget, documentTarget, onBackground);
    cleanup();

    documentTarget.visibilityState = "hidden";
    documentTarget.dispatchEvent(new Event("visibilitychange"));
    windowTarget.dispatchEvent(new Event("pagehide"));
    expect(onBackground).not.toHaveBeenCalled();
  });

  it("wires synchronous background cleanup and stale-start guards into the private vault", () => {
    expect(mediaVaultSource).toContain("bindMediaCaptureBackgroundGuard");
    expect(mediaVaultSource).toContain("flushSync(() =>");
    expect(mediaVaultSource).toContain("discardMediaCapture(recorderRef.current");
    expect(mediaVaultSource).toContain("captureGenerationRef.current += 1");
    expect(mediaVaultSource).toContain("setItems([])");
    expect(mediaVaultSource).toContain("isMediaCaptureAttemptCurrent");
    expect(mediaVaultSource).toContain("createMediaPreviewUrlRegistry");
    expect(mediaVaultSource.match(/previewUrlRegistryRef\.current\?\.revokeAll\(\)/g)).toHaveLength(2);
  });
});
