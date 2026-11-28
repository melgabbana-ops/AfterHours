import { canStartSessionWithVerifiedState } from "./services/sessionSafety";

export type GuidedExperienceBlockReason = "consent" | "account" | null;

export interface GuidedExperienceAccess {
  consentActive: boolean;
  supabaseConfigured: boolean;
  authenticated: boolean;
  remoteStateVerified: boolean;
}

/** UI access gate only; the server-side session and consent RPCs remain authoritative. */
/** Guided games require explicit consent and, when configured, verified account state. */
export function getGuidedExperienceBlockReason(access: GuidedExperienceAccess): GuidedExperienceBlockReason {
  if (!access.consentActive) return "consent";
  if (!canStartSessionWithVerifiedState(
    access.supabaseConfigured,
    access.authenticated,
    access.remoteStateVerified,
  )) return "account";
  return null;
}


export type ExperienceEmergencyRunStatus = "active" | "paused" | "completed" | "stopped" | null;

export interface ExperienceEmergencyDockState {
  activeRunId: string | null;
  activeScenePresent: boolean;
  runStatus: ExperienceEmergencyRunStatus;
  recoverableRunId: string | null;
  recoverableRunStatus: ExperienceEmergencyRunStatus;
}

/** Keep direct STOP controls visible for active and recoverable Experience Engine runs. */
export function shouldShowExperienceEmergencyDock(state: ExperienceEmergencyDockState): boolean {
  if (state.activeRunId) {
    return state.activeScenePresent && (state.runStatus === "active" || state.runStatus === "paused");
  }
  return Boolean(
    state.recoverableRunId
      && (state.recoverableRunStatus === "active" || state.recoverableRunStatus === "paused"),
  );
}
