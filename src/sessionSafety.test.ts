import { describe, expect, it } from "vitest";
import { shouldResumeSession } from "./services/sessionSafety";

describe("shouldResumeSession", () => {
  it("resumes only when both session and consent are active", () => {
    expect(shouldResumeSession("active", "active")).toBe(true);
  });

  it.each([
    ["ready", "active"],
    ["paused", "active"],
    ["completed", "active"],
    ["stopped", "active"],
    ["active", "pending"],
    ["active", "revoked"],
    ["paused", "revoked"],
  ] as const)("does not resume a %s session with %s consent", (session, consent) => {
    expect(shouldResumeSession(session, consent)).toBe(false);
  });
});
