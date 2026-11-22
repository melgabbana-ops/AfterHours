import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  new URL("../src/CinematicWorld.tsx", import.meta.url),
  "utf8",
);
const styles = readFileSync(
  new URL("../src/cinematic-experience.css", import.meta.url),
  "utf8",
);
const stopStart = source.indexOf("async function stopScene(");
const stopEnd = source.indexOf("async function completeScene(", stopStart);
const stopHandler = source.slice(stopStart, stopEnd);

describe("Experience Engine immediate STOP", () => {
  it("applies local stop and safety state before waiting for network confirmation", () => {
    const localReset = stopHandler.indexOf("setActiveScene(null)");
    const safetyStop = stopHandler.indexOf("onSafetyStop()");
    const consentRpc = stopHandler.indexOf("await withdrawExperienceConsent");

    expect(stopStart).toBeGreaterThanOrEqual(0);
    expect(stopEnd).toBeGreaterThan(stopStart);
    expect(localReset).toBeGreaterThanOrEqual(0);
    expect(safetyStop).toBeGreaterThanOrEqual(0);
    expect(consentRpc).toBeGreaterThanOrEqual(0);
    expect(localReset).toBeLessThan(consentRpc);
    expect(safetyStop).toBeLessThan(consentRpc);
  });

  it("dispatches atomic STOP without waiting for an in-flight run mutation", () => {
    const pendingWait = stopHandler.indexOf("await pendingMutation.catch");
    const consentRpc = stopHandler.indexOf("await withdrawExperienceConsent");
    const fallback = stopHandler.indexOf("await updateExperienceRun");

    expect(pendingWait).toBe(-1);
    expect(consentRpc).toBeGreaterThanOrEqual(0);
    expect(fallback).toBeGreaterThan(consentRpc);
    expect(stopHandler).toContain("stopPendingRef.current");
    expect(stopHandler).toContain("The existing RPC locks the run and revokes consent in the same");
  });

  it("keeps the dedicated STOP control available while other requests are busy", () => {
    const button = source.match(/<button type="button" className="cw-stop"[\s\S]*?<\/button>/)?.[0] ?? "";

    expect(button).toContain("aria-label=");
    expect(button).toContain("onClick={() => void stopScene()}");
    expect(button).not.toMatch(/\bdisabled\s*=/);
  });

  it("prevents a new scene from starting while the stop is being confirmed", () => {
    expect(source).toContain("if (stopPendingRef.current) return;");
    expect(source).toContain("disabled={busy || stopPending}");
    expect(source).toContain("|| stopPending || !canStartExperience");
  });

  it("keeps new sessions fail-closed if the server cannot confirm STOP", () => {
    expect(stopHandler).toContain("setStopPending(!serverConfirmed)");
    expect(stopHandler).toContain("await withdrawExperienceConsent(runId, userId)");
    expect(stopHandler).toContain("server could not confirm");
    expect(source).toContain("if (stopPendingRef.current || stopPending) return;");
  });

  it("provides 48px touch targets and visible keyboard focus for safety controls", () => {
    expect(styles).toMatch(/\.cw-checkin button\{[^}]*min-height:48px/);
    expect(styles).toMatch(/\.cw-run-actions>button:not\(\.cw-primary\)\{[^}]*min-height:48px/);
    expect(styles).toMatch(/\.cw-checkin button:focus-visible/);
  });
});
