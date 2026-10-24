export type SessionSafetyStatus = "ready" | "active" | "paused" | "completed" | "stopped";
export type ConsentSafetyStatus = "pending" | "active" | "revoked";

/**
 * A restored timer may run only when both persisted session and consent are active.
 * Runtime values can come from persisted or remote state, so accept unknown inputs
 * and fail closed unless both values are exactly "active".
 */
export function shouldResumeSession(sessionStatus: unknown, consentStatus: unknown): boolean {
  return sessionStatus === "active" && consentStatus === "active";
}
