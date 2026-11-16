import { afterEach, describe, expect, it, vi } from "vitest";

describe("notification sound resilience", () => {
  afterEach(() => { vi.unstubAllGlobals(); vi.resetModules(); });

  it("does not throw when browser audio scheduling fails", async () => {
    class BrokenAudioContext {
      state = "running";
      currentTime = 0;
      destination = {};
      createOscillator() {
        throw new Error("Audio output unavailable");
      }
    }

    vi.stubGlobal("window", { AudioContext: BrokenAudioContext, addEventListener: vi.fn(), removeEventListener: vi.fn() });

    const { playNotificationSound } = await import("./notificationSound");
    await expect(playNotificationSound("safety")).resolves.toBeUndefined();
  });

  it.each([
    ["message", 8],
    ["checkin", 8],
    ["safety", 6],
  ] as const)("schedules the original %s signature with paired tones", async (kind, expectedOscillators) => {
    const started: number[] = [];
    const audioParam = () => ({
      setValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
    });
    class TestAudioContext {
      state = "running";
      currentTime = 0;
      destination = {};
      createOscillator() {
        const frequency = audioParam();
        return {
          type: "sine",
          frequency,
          detune: audioParam(),
          connect: vi.fn(function (this: { connect: ReturnType<typeof vi.fn> }) { return this; }),
          start: vi.fn(() => started.push(1)),
          stop: vi.fn(),
        };
      }
      createBiquadFilter() {
        return { type: "lowpass", frequency: audioParam(), connect: vi.fn(function (this: { connect: ReturnType<typeof vi.fn> }) { return this; }) };
      }
      createGain() {
        return { gain: audioParam(), connect: vi.fn(function (this: { connect: ReturnType<typeof vi.fn> }) { return this; }) };
      }
    }

    vi.stubGlobal("window", { AudioContext: TestAudioContext, addEventListener: vi.fn(), removeEventListener: vi.fn() });

    const { playNotificationSound } = await import("./notificationSound");
    await expect(playNotificationSound(kind)).resolves.toBeUndefined();
    expect(started).toHaveLength(expectedOscillators);
  });
});
