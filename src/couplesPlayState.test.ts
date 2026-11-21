import { describe, expect, it } from "vitest";
import { canStartRemotePlay, canResumeRemotePlay, shouldPauseRemotePlay, normalizeRoomCode, ROOM_CODE_LENGTH, canStartLocalPlay } from "./couplesPlayState";

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


describe("local couple play readiness", () => {
  const ready = { ownConsent: true, partnerConsent: true, ownName: "Alex", partnerName: "Sam" };

  it("requires two explicit consents and both participant names", () => {
    expect(canStartLocalPlay(ready)).toBe(true);
    expect(canStartLocalPlay({ ...ready, ownConsent: false })).toBe(false);
    expect(canStartLocalPlay({ ...ready, partnerConsent: false })).toBe(false);
    expect(canStartLocalPlay({ ...ready, ownName: "   " })).toBe(false);
    expect(canStartLocalPlay({ ...ready, partnerName: "" })).toBe(false);
  });
});


describe("local shared-device answers", () => {
  it("stores trimmed answers per player without mutating the previous round state", async () => {
    const { saveLocalRoundAnswer } = await import("./couplesPlayState");
    const original = { player2: "Already answered" };
    const next = saveLocalRoundAnswer(original, "player1", "  My answer  ");
    expect(next).toEqual({ player1: "My answer", player2: "Already answered" });
    expect(original).toEqual({ player2: "Already answered" });
  });

  it("ignores empty answers and caps a response at 1000 characters", async () => {
    const { saveLocalRoundAnswer } = await import("./couplesPlayState");
    const original = { player1: "Existing" };
    expect(saveLocalRoundAnswer(original, "player2", "   ")).toBe(original);
    expect(saveLocalRoundAnswer({}, "player1", "x".repeat(1200)).player1).toHaveLength(1000);
  });

  it("alternates the local turn between the two named players", async () => {
    const { nextLocalPlayer } = await import("./couplesPlayState");
    expect(nextLocalPlayer("player1")).toBe("player2");
    expect(nextLocalPlayer("player2")).toBe("player1");
  });
});
