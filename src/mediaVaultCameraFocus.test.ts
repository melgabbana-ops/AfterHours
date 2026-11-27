import mediaVaultSource from "./MediaVault.tsx?raw";
import { describe, expect, it } from "vitest";

const compactMediaVaultSource = mediaVaultSource.replace(/\s+/g, "");

describe("Media Vault camera focus return", () => {
  it("attaches a stable focus target to the camera launcher", () => {
    expect(compactMediaVaultSource).toContain("constcaptureStartButtonRef=useRef<HTMLButtonElement|null>(null);");
    expect(compactMediaVaultSource).toContain("ref={captureStartButtonRef}");
  });

  it("restores focus only after the camera and capture review have closed", () => {
    expect(compactMediaVaultSource).toContain("if(!isPhotoCameraOpen&&!pendingCapture&&returnFocusToCaptureRef.current)");
    expect(compactMediaVaultSource).toContain("returnFocusToCaptureRef.current=false;");
    expect(compactMediaVaultSource).toContain("captureStartButtonRef.current?.focus();");
  });

  it("marks the camera cancel path for focus restoration before releasing the camera", () => {
    const cancelStart = compactMediaVaultSource.indexOf("constcancelPhotoCamera=()=>{");
    const cancelEnd = compactMediaVaultSource.indexOf("};", cancelStart);
    const cancelHandler = compactMediaVaultSource.slice(cancelStart, cancelEnd);
    expect(cancelStart).toBeGreaterThanOrEqual(0);
    expect(cancelHandler.indexOf("returnFocusToCaptureRef.current=true;")).toBeGreaterThanOrEqual(0);
    expect(cancelHandler.indexOf("returnFocusToCaptureRef.current=true;")).toBeLessThan(cancelHandler.indexOf("stopCaptureTracks();"));
  });

  it("keeps the camera cancel action connected to the focus-aware handler", () => {
    expect(compactMediaVaultSource).toContain('onClick={cancelPhotoCamera}>{t("Annuleren","Cancel")}</button>');
  });

  it("restores focus after a reviewed capture is saved or discarded", () => {
    expect(compactMediaVaultSource).toContain("if(!isPhotoCameraOpen&&!pendingCapture&&returnFocusToCaptureRef.current)");
    const saveStart = compactMediaVaultSource.indexOf("constsaveCapture=async()=>{");
    const saveEnd = compactMediaVaultSource.indexOf("};", saveStart);
    const saveHandler = compactMediaVaultSource.slice(saveStart, saveEnd);
    expect(saveHandler.indexOf("returnFocusToCaptureRef.current=true;")).toBeGreaterThanOrEqual(0);
    expect(saveHandler.indexOf("returnFocusToCaptureRef.current=true;")).toBeLessThan(saveHandler.indexOf("setPendingCapture(null);"));
    const discardStart = compactMediaVaultSource.indexOf("constdiscardCapture=()=>{");
    const discardEnd = compactMediaVaultSource.indexOf("};", discardStart);
    const discardHandler = compactMediaVaultSource.slice(discardStart, discardEnd);
    expect(discardHandler.indexOf("returnFocusToCaptureRef.current=true;")).toBeGreaterThanOrEqual(0);
    expect(discardHandler.indexOf("returnFocusToCaptureRef.current=true;")).toBeLessThan(discardHandler.indexOf("setPendingCapture(null);"));
  });
});
