import { afterEach, describe, expect, it, vi } from "vitest";
import { playNotificationSound } from "./notificationSound";

describe("notification sound resilience", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("does not throw when the browser audio API fails while scheduling a safety tone", async () => {
    class BrokenAudioContext {
      state = "running";
      currentTime = 0;
      destination = {};
      createOscillator() {
        throw new Error("Audio output unavailable");
      }
    }

    vi.stubGlobal("window", { AudioContext: BrokenAudioContext });

    await expect(playNotificationSound("safety")).resolves.toBeUndefined();
  });
});
