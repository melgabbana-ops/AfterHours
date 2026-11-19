import { describe, expect, it } from "vitest";
import { getSessionSafetyAnnouncement, getTaskChoiceFeedback, isTaskPassed, PASS_TASK_SELECTION, shouldResumeSession, shouldResumeSessionBeforeHydration } from "./sessionSafety";

describe("session resume safety", () => {
  it("resumes only when both persisted session and consent are active", () => {
    expect(shouldResumeSession("active", "active")).toBe(true);
  });

  it("does not resume an active local session when server state could not be verified", () => {
    expect(shouldResumeSession("active", "active", false)).toBe(false);
    expect(shouldResumeSession("paused", "active", false)).toBe(false);
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
    ["task-passed", "nl", "PASS geregistreerd. Deze vraag is overgeslagen. Je hoeft niets uit te leggen.", "polite"],
    ["task-passed", "en", "PASS recorded. This question was skipped. No explanation is needed.", "polite"],
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


describe("session task PASS", () => {
  it("uses a dedicated marker without treating a normal answer as PASS", () => {
    expect(isTaskPassed(PASS_TASK_SELECTION)).toBe(true);
    expect(isTaskPassed("Tempo")).toBe(false);
    expect(isTaskPassed(null)).toBe(false);
  });

  it.each([
    [PASS_TASK_SELECTION, "nl", "Vraag overgeslagen. Geen straf of uitleg nodig."],
    [PASS_TASK_SELECTION, "en", "Question skipped. No penalty or explanation is needed."],
    ["Tempo", "nl", "Je keuze is bewaard voor deze ronde. Je kunt altijd van richting veranderen."],
    ["Pace", "en", "Your choice is saved for this round. You can always change direction."],
    [null, "nl", "Kies alleen als dit voor jou goed voelt en stem samen af."],
    [null, "en", "Choose only if it feels right for you, and check in with each other."],
  ] as const)("provides safe feedback for selection=%s in %s", (selection, language, expected) => {
    expect(getTaskChoiceFeedback(selection, language)).toBe(expected);
  });
});


describe("initial session hydration safety", () => {
  it("allows an active local-only session to restore without a remote account", () => {
    expect(shouldResumeSessionBeforeHydration(false, "active", "active")).toBe(true);
  });

  it("keeps a Supabase-backed local session paused until remote state is verified", () => {
    expect(shouldResumeSessionBeforeHydration(true, "active", "active")).toBe(false);
  });

  it("does not resume local-only sessions unless both session and consent are active", () => {
    expect(shouldResumeSessionBeforeHydration(false, "paused", "active")).toBe(false);
    expect(shouldResumeSessionBeforeHydration(false, "active", "revoked")).toBe(false);
  });
});
