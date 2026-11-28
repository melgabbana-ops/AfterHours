import { describe, expect, it } from "vitest";
import { getGuidedExperienceBlockReason, shouldShowExperienceEmergencyDock } from "./experienceAccess";

describe("guided experience access", () => {
  const verifiedAccess = {
    consentActive: true,
    supabaseConfigured: true,
    authenticated: true,
    remoteStateVerified: true,
  };

  it("requires explicit consent before any guided game can start", () => {
    expect(getGuidedExperienceBlockReason({ ...verifiedAccess, consentActive: false })).toBe("consent");
  });

  it("prioritizes the consent requirement before account diagnostics", () => {
    expect(getGuidedExperienceBlockReason({
      consentActive: false,
      supabaseConfigured: true,
      authenticated: false,
      remoteStateVerified: false,
    })).toBe("consent");
  });

  it("allows a consented local-only experience without remote infrastructure", () => {
    expect(getGuidedExperienceBlockReason({
      consentActive: true,
      supabaseConfigured: false,
      authenticated: false,
      remoteStateVerified: false,
    })).toBeNull();
  });

  it("requires authentication when Supabase is configured", () => {
    expect(getGuidedExperienceBlockReason({ ...verifiedAccess, authenticated: false })).toBe("account");
  });

  it("requires verified server state before account-backed guided games", () => {
    expect(getGuidedExperienceBlockReason({ ...verifiedAccess, remoteStateVerified: false })).toBe("account");
  });

  it("allows guided games only after consent and account state are verified", () => {
    expect(getGuidedExperienceBlockReason(verifiedAccess)).toBeNull();
  });
});


describe("Experience Engine emergency controls", () => {
  const emptyState = {
    activeRunId: null,
    activeScenePresent: false,
    runStatus: null,
    recoverableRunId: null,
    recoverableRunStatus: null,
  } as const;

  it.each(["active", "paused"] as const)("keeps the dock visible for an %s active scene", (runStatus) => {
    expect(shouldShowExperienceEmergencyDock({
      ...emptyState,
      activeRunId: "run-1",
      activeScenePresent: true,
      runStatus,
    })).toBe(true);
  });

  it.each(["active", "paused"] as const)("keeps STOP visible for a recoverable %s run", (recoverableRunStatus) => {
    expect(shouldShowExperienceEmergencyDock({
      ...emptyState,
      recoverableRunId: "run-2",
      recoverableRunStatus,
    })).toBe(true);
  });

  it("keeps STOP visible when a stale active pointer coexists with a recoverable run", () => {
    expect(shouldShowExperienceEmergencyDock({
      ...emptyState,
      activeRunId: "stale-run",
      activeScenePresent: false,
      runStatus: "active",
      recoverableRunId: "recoverable-run",
      recoverableRunStatus: "paused",
    })).toBe(true);
  });

  it("keeps STOP visible for a recoverable run when the stale active pointer is completed", () => {
    expect(shouldShowExperienceEmergencyDock({
      ...emptyState,
      activeRunId: "stale-run",
      activeScenePresent: true,
      runStatus: "completed",
      recoverableRunId: "recoverable-run",
      recoverableRunStatus: "active",
    })).toBe(true);
  });

  it("does not show the dock without a live scene or recoverable run", () => {
    expect(shouldShowExperienceEmergencyDock({
      ...emptyState,
      activeRunId: "run-3",
      activeScenePresent: false,
      runStatus: "active",
    })).toBe(false);
    expect(shouldShowExperienceEmergencyDock(emptyState)).toBe(false);
  });

  it("does not show emergency controls for completed or stopped runs", () => {
    expect(shouldShowExperienceEmergencyDock({
      ...emptyState,
      activeRunId: "run-4",
      activeScenePresent: true,
      runStatus: "completed",
    })).toBe(false);
    expect(shouldShowExperienceEmergencyDock({
      ...emptyState,
      recoverableRunId: "run-5",
      recoverableRunStatus: "stopped",
    })).toBe(false);
  });
});
