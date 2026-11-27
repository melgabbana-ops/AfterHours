import type { AfterHoursState } from "./types";
import { notificationEvents } from "./services/notifications";

/** Build the local, fail-closed state for an immediate STOP transition. */
export function createEmergencyStoppedState(
  state: AfterHoursState,
  now: string,
  notice?: string,
): AfterHoursState {
  return {
    ...state,
    consent: { status: "revoked", confirmedAt: null, revokedAt: now },
    notifications: notice
      ? [notificationEvents.safety(notice), ...state.notifications].slice(0, 20)
      : state.notifications,
    session: {
      ...state.session,
      status: "stopped",
      startedAt: null,
      updatedAt: now,
    },
  };
}
