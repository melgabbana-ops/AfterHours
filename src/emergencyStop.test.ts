import { describe, expect, it } from "vitest";
import { createEmergencyStoppedState } from "./emergencyStop";
import { defaultState } from "./storage";

function activeState() {
  const state = defaultState();
  const startedAt = "2026-11-27T02:30:00.000Z";
  return {
    ...state,
    consent: { status: "active" as const, confirmedAt: startedAt, revokedAt: null },
    session: { ...state.session, status: "active" as const, startedAt, updatedAt: startedAt },
  };
}

describe("emergency STOP state transition", () => {
  it("revokes consent and stops the session at the supplied timestamp", () => {
    const state = activeState();
    const now = "2026-11-27T03:00:00.000Z";

    const stopped = createEmergencyStoppedState(state, now);

    expect(stopped.consent).toEqual({ status: "revoked", confirmedAt: null, revokedAt: now });
    expect(stopped.session).toMatchObject({ status: "stopped", startedAt: null, updatedAt: now });
  });

  it("preserves profile, history and existing notifications when no notice is supplied", () => {
    const state = activeState();
    const stopped = createEmergencyStoppedState(state, "2026-11-27T03:00:00.000Z");

    expect(stopped.profile).toBe(state.profile);
    expect(stopped.history).toBe(state.history);
    expect(stopped.notifications).toBe(state.notifications);
    expect(stopped.ageConfirmed).toBe(state.ageConfirmed);
    expect(stopped.safety).toBe(state.safety);
  });

  it("adds a safety notice without allowing the notification list to grow beyond twenty", () => {
    const state = {
      ...activeState(),
      notifications: Array.from({ length: 20 }, (_, index) => ({
        id: `notification-${index}`,
        kind: "message" as const,
        title: "Message",
        body: "Existing notification",
        createdAt: "2026-11-27T02:00:00.000Z",
        read: false,
      })),
    };

    const stopped = createEmergencyStoppedState(state, "2026-11-27T03:00:00.000Z", "Session stopped.");

    expect(stopped.notifications).toHaveLength(20);
    expect(stopped.notifications[0]).toMatchObject({ kind: "safety", body: "Session stopped." });
    expect(stopped.notifications[stopped.notifications.length - 1]?.id).toBe("notification-18");
  });
});
