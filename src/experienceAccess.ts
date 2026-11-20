import { canStartSessionWithVerifiedState } from "./services/sessionSafety";

export type GuidedExperienceBlockReason = "consent" | "account" | null;

export interface GuidedExperienceAccess {
  consentActive: boolean;
  supabaseConfigured: boolean;
  authenticated: boolean;
  remoteStateVerified: boolean;
}

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
