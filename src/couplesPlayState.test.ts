import { describe, expect, it } from "vitest";
import { canStartLocalPlay, canStartRemotePlay, canResumeRemotePlay, shouldPauseRemotePlay, normalizeRoomCode, ROOM_CODE_LENGTH } from "./couplesPlayState";

describe("local couple play consent", () => {
  it("requires separate consent from both people before starting", () => {
    expect(canStartLocalPlay(true, true)).toBe(true);
    expect(canStartLocalPlay(true, false)).toBe(false);
    expect(canStartLocalPlay(false, true)).toBe(false);
    expect(canStartLocalPlay(false, false)).toBe(false);
  });
});

describe("remote couple play safety", () => {
  const ready = { connected: true, serverAuthorized: true, participantCount: 2, partnerPresent: true, ownConsent: true, partnerConsent: true };

  it("starts only when exactly two connected participants both consent", () => {
    expect(canStartRemotePlay(ready)).toBe(true);
    expect(canStartRemotePlay({ ...ready, participantCount: 3 })).toBe(false);
    expect(canStartRemotePlay({ ...ready, partnerConsent: false })).toBe(false);
    expect(canStartRemotePlay({ ...ready, connected: false })).toBe(false);
    expect(canStartRemotePlay({ ...ready, serverAuthorized: false })).toBe(false);
  });

  it("pauses an active remote experience when the partner disconnects", () => {
    expect(shouldPauseRemotePlay({ connected: true, active: true, partnerPresent: false })).toBe(true);
    expect(shouldPauseRemotePlay({ connected: true, active: true, partnerPresent: true })).toBe(false);
    expect(shouldPauseRemotePlay({ connected: true, active: false, partnerPresent: false })).toBe(false);
    expect(shouldPauseRemotePlay({ connected: false, active: true, partnerPresent: true })).toBe(true);
  });

  it("requires the partner to be present and consenting before resuming", () => {
    expect(canResumeRemotePlay({ connected: true, serverAuthorized: true, participantCount: 2, partnerPresent: true, ownConsent: true, partnerConsent: true })).toBe(true);
    expect(canResumeRemotePlay({ connected: true, serverAuthorized: true, participantCount: 2, partnerPresent: false, ownConsent: true, partnerConsent: true })).toBe(false);
    expect(canResumeRemotePlay({ connected: true, serverAuthorized: true, participantCount: 2, partnerPresent: true, ownConsent: false, partnerConsent: true })).toBe(false);
    expect(canResumeRemotePlay({ connected: true, serverAuthorized: true, participantCount: 2, partnerPresent: true, ownConsent: true, partnerConsent: false })).toBe(false);
    expect(canResumeRemotePlay({ connected: false, serverAuthorized: true, participantCount: 2, partnerPresent: true, ownConsent: true, partnerConsent: true })).toBe(false);
    expect(canResumeRemotePlay({ connected: true, serverAuthorized: false, participantCount: 2, partnerPresent: true, ownConsent: true, partnerConsent: true })).toBe(false);
  });
});


describe("remote room code validation", () => {
  it("accepts only complete 16-character codes and normalizes case and separators", () => {
    expect(ROOM_CODE_LENGTH).toBe(16);
    expect(normalizeRoomCode("ab-cd efgh ijkl mn23")).toBe("ABCDEFGHIJKLMN23");
    expect(normalizeRoomCode("123456789012345" )).toBe("");
    expect(normalizeRoomCode(null)).toBe("");
  });
});
