import { describe, expect, it } from "vitest";
import { shouldResumeSession } from "./sessionSafety";

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
