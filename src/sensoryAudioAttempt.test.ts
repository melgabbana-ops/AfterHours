import { describe, expect, it } from "vitest";
import { createSensoryAudioAttemptGuard } from "./sensoryAudioAttempt";

describe("Sensory Lab audio attempt guard", () => {
  it("allows only one pending soundscape start", () => {
    const guard = createSensoryAudioAttemptGuard();
    const first = guard.begin();

    expect(first).not.toBeNull();
    expect(guard.begin()).toBeNull();
    expect(guard.isCurrent(first!)).toBe(true);
  });

  it("invalidates a pending start when STOP closes the audio context", () => {
    const guard = createSensoryAudioAttemptGuard();
    const attempt = guard.begin();

    guard.invalidate();

    expect(guard.isCurrent(attempt!)).toBe(false);
    expect(guard.finish(attempt!)).toBe(false);
    expect(guard.begin()).not.toBeNull();
  });

  it("does not let an old completion release a newer start", () => {
    const guard = createSensoryAudioAttemptGuard();
    const oldAttempt = guard.begin();
    guard.invalidate();
    const newAttempt = guard.begin();

    expect(guard.finish(oldAttempt!)).toBe(false);
    expect(guard.isCurrent(newAttempt!)).toBe(true);
    expect(guard.begin()).toBeNull();
  });

  it("allows another start after the current attempt finishes", () => {
    const guard = createSensoryAudioAttemptGuard();
    const attempt = guard.begin();

    expect(guard.finish(attempt!)).toBe(true);
    expect(guard.isCurrent(attempt!)).toBe(false);
    expect(guard.begin()).not.toBeNull();
  });
});
