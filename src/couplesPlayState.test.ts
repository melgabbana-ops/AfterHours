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
  });

  it("requires the partner to be present and consenting before resuming", () => {
    expect(canResumeRemotePlay({ partnerPresent: true, partnerConsent: true })).toBe(true);
    expect(canResumeRemotePlay({ partnerPresent: false, partnerConsent: true })).toBe(false);
    expect(canResumeRemotePlay({ partnerPresent: true, partnerConsent: false })).toBe(false);
  });
});
