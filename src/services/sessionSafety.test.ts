import { describe, expect, it } from "vitest";
import { shouldResumeSession } from "./sessionSafety";

describe("session resume safety", () => {
  it("resumes only when both the session and consent are active", () => {
    expect(shouldResumeSession("active", "active")).toBe(true);
  });

  it.each([
    ["active", "pending"],
    ["active", "revoked"],
    ["paused", "active"],
    ["stopped", "active"],
    ["completed", "active"],
    ["ready", "active"],
  ] as const)("does not resume session=%s consent=%s", (sessionStatus, consentStatus) => {
    expect(shouldResumeSession(sessionStatus, consentStatus)).toBe(false);
  });
});
