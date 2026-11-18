import { afterEach, describe, expect, it, vi } from "vitest";

describe("notification sound playback", () => {
  afterEach(() => { vi.unstubAllGlobals(); vi.resetModules(); });

  it("reports unavailable when browser audio scheduling fails", async () => {
    class BrokenAudioContext {
      state = "running";
      currentTime = 0;
      destination = {};
      createOscillator() { throw new Error("Audio output unavailable"); }
    }
    vi.stubGlobal("window", {
      AudioContext: BrokenAudioContext,
      addEventListener: vi.fn(),
    });
    const { playNotificationSound } = await import("./notificationSound");
    await expect(playNotificationSound("safety")).resolves.toBe(false);
  });

  it.each([
    ["message", 8],
    ["checkin", 8],
    ["safety", 6],
  ] as const)("schedules the original %s signature at phone-speaker levels", async (kind, expectedOscillators) => {
    const started: number[] = [];
    const peakLevels: number[] = [];
    const audioParam = () => ({
      setValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn((value: number) => peakLevels.push(value)),
      exponentialRampToValueAtTime: vi.fn(),
    });
    class TestAudioContext {
      state = "running";
      currentTime = 0;
      destination = {};
      createOscillator() {
        return {
          type: "sine",
          frequency: audioParam(),
          detune: audioParam(),
          connect: vi.fn(function (this: { connect: ReturnType<typeof vi.fn> }) { return this; }),
          start: vi.fn(() => started.push(1)),
          stop: vi.fn(),
        };
      }
      createBiquadFilter() {
        return {
          type: "lowpass",
          frequency: audioParam(),
          connect: vi.fn(function (this: { connect: ReturnType<typeof vi.fn> }) { return this; }),
        };
      }
      createGain() {
        return {
          gain: audioParam(),
          connect: vi.fn(function (this: { connect: ReturnType<typeof vi.fn> }) { return this; }),
        };
      }
    }
    vi.stubGlobal("window", { AudioContext: TestAudioContext, addEventListener: vi.fn() });
    const { playNotificationSound } = await import("./notificationSound");
    await expect(playNotificationSound(kind)).resolves.toBe(true);
    expect(started).toHaveLength(expectedOscillators);
    expect(Math.max(...peakLevels)).toBeGreaterThanOrEqual(0.12);
  });

  it("resumes a suspended iOS-style audio context before scheduling tones", async () => {
    const started: number[] = [];
    class SuspendedAudioContext {
      state = "suspended";
      currentTime = 0;
      destination = {};
      resume = vi.fn(async () => { this.state = "running"; });
      createOscillator() {
        const param = { setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() };
        return {
          type: "sine", frequency: param, detune: param,
          connect: vi.fn(function (this: { connect: ReturnType<typeof vi.fn> }) { return this; }),
          start: vi.fn(() => started.push(1)), stop: vi.fn(),
        };
      }
      createBiquadFilter() {
        return { type: "lowpass", frequency: { setValueAtTime: vi.fn() }, connect: vi.fn(function (this: { connect: ReturnType<typeof vi.fn> }) { return this; }) };
      }
      createGain() {
        const gain = { setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() };
        return { gain, connect: vi.fn(function (this: { connect: ReturnType<typeof vi.fn> }) { return this; }) };
      }
    }
    vi.stubGlobal("window", { AudioContext: SuspendedAudioContext, addEventListener: vi.fn() });
    const { playNotificationSound } = await import("./notificationSound");
    await expect(playNotificationSound("message")).resolves.toBe(true);
    expect(started).toHaveLength(8);
  });
});
