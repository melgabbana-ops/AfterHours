export type SessionSafetyStatus = "ready" | "active" | "paused" | "completed" | "stopped";
export type ConsentSafetyStatus = "pending" | "active" | "revoked";

/** A restored timer may run only when both persisted session and consent are active. */
export function shouldResumeSession(sessionStatus: SessionSafetyStatus, consentStatus: ConsentSafetyStatus): boolean {
  return sessionStatus === "active" && consentStatus === "active";
}
