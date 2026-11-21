export const MAX_MEDIA_CAPTURE_BYTES = 20 * 1024 * 1024;

type CaptureStream = Pick<MediaStream, "getTracks">;

/** Append a recorder chunk only while the complete capture stays within its storage limit. */
export function appendMediaCaptureChunk(
  chunks: BlobPart[],
  currentBytes: number,
  chunk: Blob,
  maxBytes = MAX_MEDIA_CAPTURE_BYTES,
): number | null {
  if (!Number.isFinite(currentBytes) || currentBytes < 0 || !Number.isFinite(maxBytes) || maxBytes < 0) return null;
  if (chunk.size === 0) return currentBytes;
  if (currentBytes + chunk.size > maxBytes) return null;
  chunks.push(chunk);
  return currentBytes + chunk.size;
}
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
