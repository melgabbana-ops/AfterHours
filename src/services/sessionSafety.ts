export type SessionSafetyStatus = "ready" | "active" | "paused" | "completed" | "stopped";
export type ConsentSafetyStatus = "pending" | "active" | "revoked";
export type SessionSafetyAnnouncementEvent =
  | "started"
  | "paused"
  | "timer-paused"
  | "resumed"
  | "stopped"
  | "consent-revoked"
  | "consent-confirmed";

export interface SessionSafetyAnnouncement {
  message: string;
  priority: "polite" | "assertive";
}

/** A restored timer may run only when both persisted session and consent are active. */
export function shouldResumeSession(sessionStatus: SessionSafetyStatus, consentStatus: ConsentSafetyStatus): boolean {
  return sessionStatus === "active" && consentStatus === "active";
}

/** Localized screen-reader feedback for consent and session safety transitions. */
export function getSessionSafetyAnnouncement(
  event: SessionSafetyAnnouncementEvent,
  language: "nl" | "en",
): SessionSafetyAnnouncement {
  const messages: Record<SessionSafetyAnnouncementEvent, Record<"nl" | "en", string>> = {
    started: {
      nl: "Sessie gestart.",
      en: "Session started.",
    },
    paused: {
      nl: "Sessie gepauzeerd. Je kunt hervatten wanneer je er klaar voor bent.",
      en: "Session paused. You can resume when you are ready.",
    },
    "timer-paused": {
      nl: "De ronde is afgelopen. De sessie staat op pauze.",
      en: "The round has ended. The session is paused.",
    },
    resumed: {
      nl: "Sessie hervat.",
      en: "Session resumed.",
    },
    stopped: {
      nl: "Sessie onmiddellijk gestopt. Toestemming is ingetrokken. Bevestig opnieuw voordat je start.",
      en: "Session stopped immediately. Consent has been revoked. Confirm again before starting.",
    },
    "consent-revoked": {
      nl: "Toestemming ingetrokken. De sessie is gestopt. Bevestig opnieuw voordat je start.",
      en: "Consent revoked. The session is stopped. Confirm again before starting.",
    },
    "consent-confirmed": {
      nl: "Toestemming bevestigd. Je kunt de experience starten wanneer je er klaar voor bent.",
      en: "Consent confirmed. You can start the experience when you are ready.",
    },
  };

  const priority = event === "stopped" || event === "consent-revoked" ? "assertive" : "polite";
  return { message: messages[event][language], priority };
}
