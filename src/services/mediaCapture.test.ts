import { describe, expect, it, vi } from "vitest";
import { discardMediaCapture, stopMediaStreams } from "./mediaCapture";

describe("media capture cleanup", () => {
  it("stops every track across camera and composited streams", () => {
    const cameraVideo = { stop: vi.fn() };
    const cameraAudio = { stop: vi.fn() };
    const compositeVideo = { stop: vi.fn() };
    const streams = [
      { getTracks: () => [cameraVideo, cameraAudio] },
      { getTracks: () => [compositeVideo, cameraAudio] },
      null,
    ] as unknown as MediaStream[];

    stopMediaStreams(streams);

    expect(cameraVideo.stop).toHaveBeenCalledTimes(1);
    expect(cameraAudio.stop).toHaveBeenCalledOnce();
    expect(compositeVideo.stop).toHaveBeenCalledTimes(1);
  });

  it("continues stopping tracks if one track has already ended", () => {
    const endedTrack = { stop: vi.fn(() => { throw new Error("already ended"); }) };
    const activeTrack = { stop: vi.fn() };
    const stream = { getTracks: () => [endedTrack, activeTrack] } as unknown as MediaStream;

    expect(() => stopMediaStreams([stream])).not.toThrow();
    expect(activeTrack.stop).toHaveBeenCalledOnce();
  });

  it("detaches recorder callbacks before stopping an unfinished recording", () => {
    let recorder: MediaRecorder;
    const stop = vi.fn(() => {
      expect(recorder.ondataavailable).toBeNull();
      expect(recorder.onstop).toBeNull();
      expect(recorder.onerror).toBeNull();
    });
    recorder = {
      state: "recording",
      stop,
      ondataavailable: vi.fn(),
      onstop: vi.fn(),
      onerror: vi.fn(),
    } as unknown as MediaRecorder;
    const track = { stop: vi.fn() };
    const stream = { getTracks: () => [track] } as unknown as MediaStream;

    discardMediaCapture(recorder, [stream]);

    expect(stop).toHaveBeenCalledOnce();
    expect(track.stop).toHaveBeenCalledOnce();
  });

  it("does not stop an already inactive recorder but still releases its stream", () => {
    const stop = vi.fn();
    const recorder = {
      state: "inactive",
      stop,
      ondataavailable: vi.fn(),
      onstop: vi.fn(),
      onerror: vi.fn(),
    } as unknown as MediaRecorder;
    const track = { stop: vi.fn() };

    discardMediaCapture(recorder, [{ getTracks: () => [track] }]);

    expect(stop).not.toHaveBeenCalled();
    expect(recorder.ondataavailable).toBeNull();
    expect(recorder.onstop).toBeNull();
    expect(recorder.onerror).toBeNull();
    expect(track.stop).toHaveBeenCalledOnce();
  });
});
