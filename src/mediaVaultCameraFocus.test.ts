import mediaVaultSource from "./MediaVault.tsx?raw";
import { describe, expect, it } from "vitest";

describe("Media Vault camera focus return", () => {
  it("attaches a stable focus target to the camera launcher", () => {
    expect(mediaVaultSource).toContain("const captureStartButtonRef = useRef<HTMLButtonElement|null>(null);");
    expect(mediaVaultSource).toContain("ref={captureStartButtonRef}");
  });

  it("restores focus only after the camera and capture review have closed", () => {
    expect(mediaVaultSource).toContain("if(!isPhotoCameraOpen&&!pendingCapture&&returnFocusToCaptureRef.current)");
    expect(mediaVaultSource).toContain("returnFocusToCaptureRef.current=false;");
    expect(mediaVaultSource).toContain("captureStartButtonRef.current?.focus();");
  });

  it("marks the camera cancel path for focus restoration before releasing the camera", () => {
    const cancelStart = mediaVaultSource.indexOf("const cancelPhotoCamera=()=>{");
    const cancelEnd = mediaVaultSource.indexOf("\n  };", cancelStart);
    const cancelHandler = mediaVaultSource.slice(cancelStart, cancelEnd);
    expect(cancelStart).toBeGreaterThanOrEqual(0);
    expect(cancelHandler.indexOf("returnFocusToCaptureRef.current=true;")).toBeGreaterThanOrEqual(0);
    expect(cancelHandler.indexOf("returnFocusToCaptureRef.current=true;")).toBeLessThan(cancelHandler.indexOf("stopCaptureTracks();"));
  });

  it("keeps the camera cancel action connected to the focus-aware handler", () => {
    expect(mediaVaultSource).toContain('onClick={cancelPhotoCamera}>{t("Annuleren","Cancel")}</button>');
  });

  it("restores focus after a reviewed capture is saved or discarded", () => {
    expect(mediaVaultSource).toContain("if(!isPhotoCameraOpen&&!pendingCapture&&returnFocusToCaptureRef.current)");
    const saveStart = mediaVaultSource.indexOf("const saveCapture=async()=>{");
    const saveEnd = mediaVaultSource.indexOf("\n  };", saveStart);
    const saveHandler = mediaVaultSource.slice(saveStart, saveEnd);
    expect(saveHandler.indexOf("returnFocusToCaptureRef.current=true;")).toBeGreaterThanOrEqual(0);
    expect(saveHandler.indexOf("returnFocusToCaptureRef.current=true;")).toBeLessThan(saveHandler.indexOf("setPendingCapture(null);"));
    const discardStart = mediaVaultSource.indexOf("const discardCapture=()=>{");
    const discardEnd = mediaVaultSource.indexOf("\n  };", discardStart);
    const discardHandler = mediaVaultSource.slice(discardStart, discardEnd);
    expect(discardHandler.indexOf("returnFocusToCaptureRef.current=true;")).toBeGreaterThanOrEqual(0);
    expect(discardHandler.indexOf("returnFocusToCaptureRef.current=true;")).toBeLessThan(discardHandler.indexOf("setPendingCapture(null);"));
  });
});
