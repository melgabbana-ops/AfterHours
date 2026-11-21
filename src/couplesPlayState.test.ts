import { describe, expect, it } from "vitest";
import { canStartRemotePlay, canResumeRemotePlay, shouldPauseRemotePlay } from "./couplesPlayState";

describe("remote couple play safety", () => {
  const ready = { connected: true, participantCount: 2, partnerPresent: true, ownConsent: true, partnerConsent: true };

  it("starts only when exactly two connected participants both consent", () => {
    expect(canStartRemotePlay(ready)).toBe(true);
    expect(canStartRemotePlay({ ...ready, participantCount: 3 })).toBe(false);
    expect(canStartRemotePlay({ ...ready, partnerConsent: false })).toBe(false);
    expect(canStartRemotePlay({ ...ready, connected: false })).toBe(false);
  });

  it("pauses an active remote experience when the partner disconnects", () => {
    expect(shouldPauseRemotePlay({ connected: true, active: true, partnerPresent: false })).toBe(true);
    expect(shouldPauseRemotePlay({ connected: true, active: true, partnerPresent: true })).toBe(false);
    expect(shouldPauseRemotePlay({ connected: true, active: false, partnerPresent: false })).toBe(false);
    expect(shouldPauseRemotePlay({ connected: false, active: true, partnerPresent: true })).toBe(true);
  });

  it("requires the partner to be present and consenting before resuming", () => {
    expect(canResumeRemotePlay({ connected: true, participantCount: 2, partnerPresent: true, ownConsent: true, partnerConsent: true })).toBe(true);
    expect(canResumeRemotePlay({ connected: true, partnerPresent: false, ownConsent: true, partnerConsent: true })).toBe(false);
    expect(canResumeRemotePlay({ connected: true, partnerPresent: true, ownConsent: false, partnerConsent: true })).toBe(false);
    expect(canResumeRemotePlay({ connected: true, partnerPresent: true, ownConsent: true, partnerConsent: false })).toBe(false);
    expect(canResumeRemotePlay({ connected: false, participantCount: 2, partnerPresent: true, ownConsent: true, partnerConsent: true })).toBe(false);
  });
});
