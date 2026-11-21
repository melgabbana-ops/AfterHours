import { describe, expect, it, vi } from "vitest";
import { appendMediaCaptureChunk, canRecoverInterruptedCapture, discardMediaCapture, MAX_MEDIA_CAPTURE_BYTES, missingCaptureTrack, stopMediaRecorder, stopMediaStreams, waitForVideoReady, watchMediaStreamInterruption } from "./mediaCapture";

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

describe("camera video readiness", () => {
  function fakeVideo() {
    return Object.assign(new EventTarget(), { videoWidth: 0, videoHeight: 0, error: null }) as unknown as HTMLVideoElement;
  }

  it("rechecks dimensions after attaching listeners to close the ready-event race", async () => {
    vi.useFakeTimers();
    try {
      const video = fakeVideo();
      let widthReads = 0;
      Object.defineProperty(video, "videoWidth", { get: () => (++widthReads === 1 ? 0 : 1280) });
      Object.defineProperty(video, "videoHeight", { get: () => 720 });
      await expect(waitForVideoReady(video, 5000)).resolves.toBeUndefined();
      expect(widthReads).toBeGreaterThanOrEqual(2);
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it("resolves when loadeddata supplies actual video dimensions", async () => {
    const video = fakeVideo();
    const ready = waitForVideoReady(video, 5000);
    Object.defineProperty(video, "videoWidth", { value: 640 });
    Object.defineProperty(video, "videoHeight", { value: 480 });
    video.dispatchEvent(new Event("loadeddata"));
    await expect(ready).resolves.toBeUndefined();
  });

  it("rejects media errors and removes all event listeners", async () => {
    const video = fakeVideo();
    const remove = vi.spyOn(video, "removeEventListener");
    const ready = waitForVideoReady(video, 5000, "timeout", "media error");
    video.dispatchEvent(new Event("error"));
    await expect(ready).rejects.toThrow("media error");
    expect(remove).toHaveBeenCalledTimes(3);
  });

  it("rejects a timeout and cleans up its timer and listeners", async () => {
    vi.useFakeTimers();
    try {
      const video = fakeVideo();
      const remove = vi.spyOn(video, "removeEventListener");
      const ready = waitForVideoReady(video, 250, "camera timeout");
      const assertion = expect(ready).rejects.toThrow("camera timeout");
      await vi.advanceTimersByTimeAsync(250);
      await assertion;
      expect(remove).toHaveBeenCalledTimes(3);
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it("detects an error that happened before listeners could be attached", async () => {
    const video = fakeVideo();
    Object.defineProperty(video, "error", { value: { code: 4 } });
    await expect(waitForVideoReady(video, 5000, "timeout", "early error")).rejects.toThrow("early error");
  });
});


describe("media stream interruption", () => {
  function fakeTrack(readyState: MediaStreamTrackState = "live") {
    return Object.assign(new EventTarget(), { readyState }) as unknown as MediaStreamTrack;
  }

  it("reports the first ended camera or microphone track only once", () => {
    const camera = fakeTrack();
    const microphone = fakeTrack();
    const onInterrupted = vi.fn();
    const cleanup = watchMediaStreamInterruption(
      { getTracks: () => [camera, microphone] },
      onInterrupted,
    );

    camera.dispatchEvent(new Event("ended"));
    microphone.dispatchEvent(new Event("ended"));
    cleanup();

    expect(onInterrupted).toHaveBeenCalledOnce();
  });

  it("removes all track listeners after the first interruption", () => {
    const camera = fakeTrack();
    const microphone = fakeTrack();
    const cameraRemove = vi.spyOn(camera, "removeEventListener");
    const microphoneRemove = vi.spyOn(microphone, "removeEventListener");
    const cleanup = watchMediaStreamInterruption(
      { getTracks: () => [camera, microphone] },
      vi.fn(),
    );

    camera.dispatchEvent(new Event("ended"));

    expect(cameraRemove).toHaveBeenCalledWith("ended", expect.any(Function));
    expect(microphoneRemove).toHaveBeenCalledWith("ended", expect.any(Function));
    cleanup();
  });

  it("does not notify after the watcher has been cleaned up", () => {
    const camera = fakeTrack();
    const onInterrupted = vi.fn();
    const cleanup = watchMediaStreamInterruption({ getTracks: () => [camera] }, onInterrupted);

    cleanup();
    camera.dispatchEvent(new Event("ended"));

    expect(onInterrupted).not.toHaveBeenCalled();
  });

  it("detects a track that ended before listener registration", () => {
    const ended = fakeTrack("ended");
    const live = fakeTrack();
    const onInterrupted = vi.fn();

    const cleanup = watchMediaStreamInterruption(
      { getTracks: () => [ended, live] },
      onInterrupted,
    );

    expect(onInterrupted).toHaveBeenCalledOnce();
    cleanup();
  });
});


describe("safe recorder stop", () => {
  it("stops an active recorder once", () => {
    const stop = vi.fn();
    expect(stopMediaRecorder({ state: "recording", stop })).toBe(true);
    expect(stop).toHaveBeenCalledOnce();
  });

  it("does not stop an inactive recorder", () => {
    const stop = vi.fn();
    expect(stopMediaRecorder({ state: "inactive", stop })).toBe(false);
    expect(stop).not.toHaveBeenCalled();
  });

  it("contains a state race when the browser deactivates the recorder before stop", () => {
    const stop = vi.fn(() => { throw new DOMException("Recorder is inactive", "InvalidStateError"); });
    expect(stopMediaRecorder({ state: "recording", stop })).toBe(false);
    expect(stop).toHaveBeenCalledOnce();
  });

  it("accepts a missing recorder during asynchronous startup", () => {
    expect(stopMediaRecorder(null)).toBe(false);
  });
});


describe("required capture tracks", () => {
  const track = (readyState: MediaStreamTrackState = "live") => ({ readyState }) as MediaStreamTrack;
  const stream = (video: MediaStreamTrack[], audio: MediaStreamTrack[]) => ({
    getVideoTracks: () => video,
    getAudioTracks: () => audio,
  });

  it("requires a live camera track for photo and video capture", () => {
    expect(missingCaptureTrack(stream([], [track()]), true, false)).toBe("video");
    expect(missingCaptureTrack(stream([track("ended")], [track()]), true, false)).toBe("video");
    expect(missingCaptureTrack(stream([track()], []), true, false)).toBeNull();
  });

  it("requires a live microphone track for voice and video capture", () => {
    expect(missingCaptureTrack(stream([track()], []), false, true)).toBe("audio");
    expect(missingCaptureTrack(stream([track()], [track("ended")]), false, true)).toBe("audio");
    expect(missingCaptureTrack(stream([track()], [track()]), true, true)).toBeNull();
  });

  it("does not require a microphone for still photos", () => {
    expect(missingCaptureTrack(stream([track()], []), true, false)).toBeNull();
  });
});


describe("interrupted capture recovery", () => {
  it("allows a non-empty partial preview within the storage limit", () => {
    expect(canRecoverInterruptedCapture(1)).toBe(true);
    expect(canRecoverInterruptedCapture(MAX_MEDIA_CAPTURE_BYTES)).toBe(true);
  });

  it("rejects empty, oversized, negative, or non-finite captures", () => {
    expect(canRecoverInterruptedCapture(0)).toBe(false);
    expect(canRecoverInterruptedCapture(MAX_MEDIA_CAPTURE_BYTES + 1)).toBe(false);
    expect(canRecoverInterruptedCapture(-1)).toBe(false);
    expect(canRecoverInterruptedCapture(Number.NaN)).toBe(false);
    expect(canRecoverInterruptedCapture(1, Number.POSITIVE_INFINITY)).toBe(false);
  });
});
