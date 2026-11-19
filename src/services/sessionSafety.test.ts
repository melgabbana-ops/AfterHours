import { describe, expect, it } from "vitest";
import { getSessionSafetyAnnouncement, shouldResumeSession } from "./sessionSafety";

describe("session resume safety", () => {
  it("resumes only when both persisted session and consent are active", () => {
    expect(shouldResumeSession("active", "active")).toBe(true);
  });

  it.each([
    ["ready", "pending"],
    ["ready", "active"],
    ["ready", "revoked"],
    ["active", "pending"],
    ["active", "revoked"],
    ["paused", "pending"],
    ["paused", "active"],
    ["paused", "revoked"],
    ["stopped", "pending"],
    ["stopped", "active"],
    ["stopped", "revoked"],
    ["completed", "pending"],
    ["completed", "active"],
    ["completed", "revoked"],
  ] as const)("never resumes session=%s with consent=%s", (sessionStatus, consentStatus) => {
    expect(shouldResumeSession(sessionStatus, consentStatus)).toBe(false);
  });
});


describe("session safety announcements", () => {
  it.each([
    ["started", "nl", "Sessie gestart.", "polite"],
    ["started", "en", "Session started.", "polite"],
    ["paused", "nl", "Sessie gepauzeerd. Je kunt hervatten wanneer je er klaar voor bent.", "polite"],
    ["paused", "en", "Session paused. You can resume when you are ready.", "polite"],
    ["timer-paused", "nl", "De ronde is afgelopen. De sessie staat op pauze.", "polite"],
    ["timer-paused", "en", "The round has ended. The session is paused.", "polite"],
    ["resumed", "nl", "Sessie hervat.", "polite"],
    ["resumed", "en", "Session resumed.", "polite"],
    ["consent-confirmed", "nl", "Toestemming bevestigd. Je kunt de experience starten wanneer je er klaar voor bent.", "polite"],
    ["consent-confirmed", "en", "Consent confirmed. You can start the experience when you are ready.", "polite"],
    ["stopped", "nl", "Sessie onmiddellijk gestopt. Toestemming is ingetrokken. Bevestig opnieuw voordat je start.", "assertive"],
    ["stopped", "en", "Session stopped immediately. Consent has been revoked. Confirm again before starting.", "assertive"],
    ["consent-revoked", "nl", "Toestemming ingetrokken. De sessie is gestopt. Bevestig opnieuw voordat je start.", "assertive"],
    ["consent-revoked", "en", "Consent revoked. The session is stopped. Confirm again before starting.", "assertive"],
  ] as const)(
    "announces %s in %s with %s priority",
    (event, language, message, priority) => {
      expect(getSessionSafetyAnnouncement(event, language)).toEqual({ message, priority });
    },
  );
});
