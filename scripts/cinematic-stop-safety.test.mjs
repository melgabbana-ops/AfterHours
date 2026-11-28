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
const pauseStart = source.indexOf("async function pauseScene()");
const pauseEnd = source.indexOf("async function stopScene(", pauseStart);
const pauseHandler = source.slice(pauseStart, pauseEnd);
const pauseCatchStart = pauseHandler.indexOf("} catch {");
const pauseFinallyStart = pauseHandler.indexOf("} finally", pauseCatchStart);
const pauseCatch = pauseHandler.slice(pauseCatchStart, pauseFinallyStart);

describe("Experience Engine immediate STOP", () => {
  it("routes an unconfirmed pause through the run-specific atomic STOP", () => {
    expect(pauseStart).toBeGreaterThanOrEqual(0);
    expect(pauseEnd).toBeGreaterThan(pauseStart);
    expect(pauseCatch).toContain("await stopScene()");
    expect(pauseCatch).not.toContain("onSafetyPause()");
    expect(pauseCatch).not.toContain("onSafetyStop()");
  });

  it("rejects a late pause response after STOP, account, consent, or run changes", () => {
    expect(pauseHandler).toContain("isExperiencePauseAttemptCurrent");
    expect(pauseHandler).toContain("currentAttemptId: startAttemptRef.current");
    expect(pauseHandler).toContain("currentRunId: activeRunId");
    expect(pauseHandler).toContain("if (!isCurrentPause()) return;");
  });

  it("does not apply stale pause history after a newer safety action", () => {
    expect(source).toContain("async function refreshData(userId = remoteProfileId, isCurrent?: () => boolean)");
    expect(source).toContain("const canApply = () => isWorldOwnerAttemptCurrent(");
    expect(source).toContain("if (!canApply()) return;");
    expect(pauseHandler).toContain("await refreshData(attempt.ownerId, isCurrentPause)");
  });
  it("scopes private world refreshes to the account and view generation that requested them", () => {
    expect(source).toContain("const attempt: WorldOwnerAttempt = { ownerId: userId, generation: worldOwnerGenerationRef.current };");
    expect(source).toContain("startContextRef.current.remoteProfileId");
    expect(source).toContain("worldOwnerGenerationRef.current");
  });

  it("ignores late Director's Room saves and deletes after an account switch", () => {
    const saveStart = source.indexOf("async function saveDirectorScene()");
    const saveEnd = source.indexOf("\n  function prepareScene", saveStart);
    const saveHandler = source.slice(saveStart, saveEnd);
    const deleteStart = source.indexOf("async function removeScene(");
    const deleteEnd = source.indexOf("\n  async function saveVaultNote", deleteStart);
    const deleteHandler = source.slice(deleteStart, deleteEnd);
    const persistStart = source.indexOf("async function persist(");
    const persistEnd = source.indexOf("\n  function requestStartAccess", persistStart);
    const persistHandler = source.slice(persistStart, persistEnd);

    expect(saveHandler).toContain("if (!isOwnerCurrent()) return;");
    expect(saveHandler).toContain("if (isOwnerCurrent()) {");
    expect(deleteHandler).toContain("if (!isOwnerCurrent()) return;");
    expect(deleteHandler).toContain("if (isOwnerCurrent()) {");
    expect(persistHandler).toContain("if (!isOwnerCurrent()) return saved;");
  });

  it("does not let stale Director's Room completions clear another account's mutation state", () => {
    const saveStart = source.indexOf("async function saveDirectorScene()");
    const saveEnd = source.indexOf("\n  function prepareScene", saveStart);
    const saveHandler = source.slice(saveStart, saveEnd);
    const deleteStart = source.indexOf("async function removeScene(");
    const deleteEnd = source.indexOf("\n  async function saveVaultNote", deleteStart);
    const deleteHandler = source.slice(deleteStart, deleteEnd);
    const ownerEffect = source.match(/useLayoutEffect\(\(\) => \{[\s\S]*?worldOwnerGenerationRef\.current \+= 1;[\s\S]*?\}, \[remoteProfileId\]\);/)?.[0] ?? "";

    expect(saveHandler).toContain("if (isOwnerCurrent()) setBusy(false);");
    expect(deleteHandler).toContain("if (isOwnerCurrent()) {");
    expect(deleteHandler).toContain("deletingSceneRef.current = false;");
    expect(ownerEffect).toContain("setBusy(false);");
    expect(ownerEffect).toContain("deletingSceneRef.current = false;");
    expect(ownerEffect).toContain("setDeletingSceneKey(null);");
  });

  it("applies local stop and safety state before dispatching server confirmation", () => {
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

  it("blocks invitation creation while STOP is awaiting server confirmation", () => {
    const inviteStart = source.indexOf("async function createRunInvitation(");
    const inviteEnd = source.indexOf("\n  async function ", inviteStart + 1);
    const inviteHandler = source.slice(inviteStart, inviteEnd);
    const firstStopGuard = inviteHandler.indexOf("if (stopPendingRef.current || stopPending)");
    const tokenGeneration = inviteHandler.indexOf("crypto.getRandomValues");
    const invitationWrite = inviteHandler.indexOf("await createExperienceInvitation");
    const secondStopGuard = inviteHandler.indexOf("if (!isActionCurrent())", tokenGeneration);

    expect(inviteStart).toBeGreaterThanOrEqual(0);
    expect(inviteEnd).toBeGreaterThan(inviteStart);
    expect(firstStopGuard).toBeGreaterThanOrEqual(0);
    expect(firstStopGuard).toBeLessThan(tokenGeneration);
    expect(secondStopGuard).toBeGreaterThan(tokenGeneration);
    expect(secondStopGuard).toBeLessThan(invitationWrite);
    expect(inviteHandler).toContain("isInvitationOwnerAttemptCurrent");
    expect(inviteHandler).toContain("revokeCreatedInvitation");
  });

  it("disables the invitation control while STOP is pending", () => {
    const button = source.match(/<button type="button" className="cw-primary"[^>]*onClick=\{\(\) => void createRunInvitation\(selectedInviteRunId\)\}[^>]*>/)?.[0] ?? "";

    expect(button).toContain("disabled={busy || stopPending || !remoteProfileId || !selectedInviteRunId}");
  });

  it("provides 48px touch targets and visible keyboard focus for safety controls", () => {
    expect(styles).toMatch(/\.cw-checkin button\{[^}]*min-height:48px/);
    expect(styles).toMatch(/\.cw-run-actions>button:not\(\.cw-primary\)\{[^}]*min-height:48px/);
    expect(styles).toMatch(/\.cw-checkin button:focus-visible/);
  });
});
