type CaptureStream = Pick<MediaStream, "getTracks">;
type CaptureRecorder = Pick<MediaRecorder, "state" | "stop" | "ondataavailable" | "onstop" | "onerror">;

/** Stop every camera/microphone track, even if one browser track has already ended. */
export function stopMediaStreams(streams: readonly (CaptureStream | null | undefined)[]): void {
  const stoppedTracks = new Set<MediaStreamTrack>();
  for (const stream of streams) {
    for (const track of stream?.getTracks() ?? []) {
      if (stoppedTracks.has(track)) continue;
      stoppedTracks.add(track);
      try {
        track.stop();
      } catch {
        // Continue releasing the remaining tracks if a browser has already closed one.
      }
    }
  }
}

/** Discard an unfinished capture without allowing late recorder events to publish a preview. */
export function discardMediaCapture(
  recorder: CaptureRecorder | null | undefined,
  streams: readonly (CaptureStream | null | undefined)[],
): void {
  if (recorder) {
    recorder.ondataavailable = null;
    recorder.onstop = null;
    recorder.onerror = null;
    if (recorder.state !== "inactive") {
      try {
        recorder.stop();
      } catch {
        // Track shutdown below remains the final best-effort release path.
      }
    }
  }
  stopMediaStreams(streams);
}
