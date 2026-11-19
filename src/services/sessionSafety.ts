export type SessionSafetyStatus = "ready" | "active" | "paused" | "completed" | "stopped";
export type ConsentSafetyStatus = "pending" | "active" | "revoked";
export type SessionSafetyAnnouncementEvent =
  | "started"
  | "paused"
  | "timer-paused"
  | "resumed"
  | "stopped"
  | "task-passed"
  | "consent-revoked"
  | "consent-confirmed";

export interface SessionSafetyAnnouncement {
  message: string;
  priority: "polite" | "assertive";
}


export const PASS_TASK_SELECTION = "__AFTER_HOURS_PASS__";

export function isTaskPassed(selection: string | null): boolean {
  return selection === PASS_TASK_SELECTION;
}

export function getTaskChoiceFeedback(selection: string | null, language: "nl" | "en"): string {
  if (isTaskPassed(selection)) {
    return language === "nl"
      ? "Vraag overgeslagen. Geen straf of uitleg nodig."
      : "Question skipped. No penalty or explanation is needed.";
  }
  if (selection) {
    return language === "nl"
      ? "Je keuze is bewaard voor deze ronde. Je kunt altijd van richting veranderen."
      : "Your choice is saved for this round. You can always change direction.";
  }
  return language === "nl"
    ? "Kies alleen als dit voor jou goed voelt en stem samen af."
    : "Choose only if it feels right for you, and check in with each other.";
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
    "task-passed": {
      nl: "PASS geregistreerd. Deze vraag is overgeslagen. Je hoeft niets uit te leggen.",
      en: "PASS recorded. This question was skipped. No explanation is needed.",
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
