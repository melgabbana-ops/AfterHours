import { describe, expect, it, vi } from "vitest";
import { appendMediaCaptureChunk, discardMediaCapture, MAX_MEDIA_CAPTURE_BYTES, stopMediaStreams } from "./mediaCapture";

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

    const stream = { getTracks: () => [track] } as unknown as MediaStream;
    discardMediaCapture(recorder, [stream]);

    expect(stop).not.toHaveBeenCalled();
    expect(recorder.ondataavailable).toBeNull();
    expect(recorder.onstop).toBeNull();
    expect(recorder.onerror).toBeNull();
    expect(track.stop).toHaveBeenCalledOnce();
  });
});

describe("media capture size guard", () => {
  it("uses the same 20 MB ceiling as private media storage", () => {
    expect(MAX_MEDIA_CAPTURE_BYTES).toBe(20 * 1024 * 1024);
  });
  it("appends chunks and reports the cumulative byte count", () => {
    const chunks: BlobPart[] = [];
    expect(appendMediaCaptureChunk(chunks, 0, new Blob(["first"]), 10)).toBe(5);
    expect(appendMediaCaptureChunk(chunks, 5, new Blob(["next"]), 10)).toBe(9);
    expect(chunks).toHaveLength(2);
  });

  it("rejects the chunk that would cross the limit without retaining it", () => {
    const chunks: BlobPart[] = [new Blob(["kept"])];
    expect(appendMediaCaptureChunk(chunks, 4, new Blob(["too large"]), 10)).toBeNull();
    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toBeInstanceOf(Blob);
    expect((chunks[0] as Blob).size).toBe(4);
  });

  it("accepts a capture exactly at the limit and ignores empty chunks", () => {
    const chunks: BlobPart[] = [];
    expect(appendMediaCaptureChunk(chunks, 4, new Blob(["123456"]), 10)).toBe(10);
    expect(appendMediaCaptureChunk(chunks, 10, new Blob([]), 10)).toBe(10);
    expect(chunks).toHaveLength(1);
  });

  it("rejects invalid byte counters rather than accepting an unbounded capture", () => {
    const chunks: BlobPart[] = [];
    expect(appendMediaCaptureChunk(chunks, Number.NaN, new Blob(["x"]), 10)).toBeNull();
    expect(appendMediaCaptureChunk(chunks, 0, new Blob(["x"]), Number.POSITIVE_INFINITY)).toBeNull();
    expect(chunks).toHaveLength(0);
  });
});
