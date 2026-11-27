
/** Bound a permission prompt so a stalled camera/microphone request cannot lock the capture UI forever. */
export function requestMediaStream(
  request: () => Promise<MediaStream>,
  timeoutMs = 30000,
  timeoutMessage = "The camera or microphone permission request timed out.",
): Promise<MediaStream> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const timeout = setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(new Error(timeoutMessage));
    }, timeoutMs);

    Promise.resolve()
      .then(request)
      .then(stream => {
        if (settled) {
          stopMediaStreams([stream]);
          return;
        }
        settled = true;
        clearTimeout(timeout);
        resolve(stream);
      })
      .catch(error => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        reject(error);
      });
  });
}

export const MAX_MEDIA_CAPTURE_BYTES = 20 * 1024 * 1024;
/** Wait for real video dimensions without missing an already-fired metadata event. */
export function waitForVideoReady(
  video: HTMLVideoElement,
  timeoutMs = 5000,
  timeoutMessage = "The camera did not start in time.",
  mediaErrorMessage = "The camera could not provide a video frame.",
): Promise<void> {
  if (video.videoWidth > 0 && video.videoHeight > 0) return Promise.resolve();
  return new Promise((resolve, reject) => {
    let settled = false;
    const cleanup = () => {
      clearTimeout(timeout);
      video.removeEventListener("loadedmetadata", onReady);
      video.removeEventListener("loadeddata", onReady);
      video.removeEventListener("error", onError);
    };
    const finish = (error?: Error) => {
      if (settled) return;
      settled = true;
      cleanup();
      if (error) reject(error);
      else resolve();
    };
    const onReady = () => {
      if (video.videoWidth > 0 && video.videoHeight > 0) finish();
    };
    const onError = () => finish(new Error(mediaErrorMessage));
    const timeout = setTimeout(() => finish(new Error(timeoutMessage)), timeoutMs);
    video.addEventListener("loadedmetadata", onReady);
    video.addEventListener("loadeddata", onReady);
    video.addEventListener("error", onError);
    // A ready event can arrive between the first dimension check and listener setup.
    if (video.error) onError();
    else onReady();
  });
}


type CaptureStream = Pick<MediaStream, "getTracks">;

/** Append a recorder chunk only while the complete capture stays within its storage limit. */
export function appendMediaCaptureChunk(
  chunks: BlobPart[],
  currentBytes: number,
  chunk: Blob,
  maxBytes = MAX_MEDIA_CAPTURE_BYTES,
): number | null {
  if (!Number.isSafeInteger(currentBytes) || currentBytes < 0 || !Number.isSafeInteger(maxBytes) || maxBytes < 0 || currentBytes > maxBytes) return null;
  if (!Number.isSafeInteger(chunk.size) || chunk.size < 0) return null;
  if (chunk.size === 0) return currentBytes;
  if (chunk.size > maxBytes - currentBytes) return null;
  chunks.push(chunk);
  return currentBytes + chunk.size;
}
type CaptureRecorder = Pick<MediaRecorder, "state" | "stop" | "ondataavailable" | "onstop" | "onerror">;

/** Request a recorder stop once, tolerating browser state changes between checks and stop(). */
export function stopMediaRecorder(recorder: Pick<MediaRecorder, "state" | "stop"> | null | undefined): boolean {
  if (!recorder || recorder.state === "inactive") return false;
  try {
    recorder.stop();
    return true;
  } catch {
    // MediaRecorder can become inactive between the state check and stop().
    return false;
  }
}

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


/** Notify once when any camera or microphone track ends unexpectedly. */
export function watchMediaStreamInterruption(
  stream: Pick<MediaStream, "getTracks">,
  onInterrupted: () => void,
): () => void {
  const tracks = stream.getTracks();
  let active = true;
  function handleEnded() {
    if (!active) return;
    cleanup();
    onInterrupted();
  }
  const cleanup = () => {
    if (!active) return;
    active = false;
    tracks.forEach(track => track.removeEventListener("ended", handleEnded));
  };

  // A track can end before listeners are attached, especially during device changes.
  if (tracks.some(track => track.readyState === "ended")) {
    active = false;
    onInterrupted();
    return () => undefined;
  }

  tracks.forEach(track => track.addEventListener("ended", handleEnded));
  // Recheck after listener registration to close the readyState/listener race.
  if (tracks.some(track => track.readyState === "ended")) handleEnded();
  return cleanup;
}


/** Identify a missing or already-ended required camera/microphone track before recording. */
export function missingCaptureTrack(
  stream: Pick<MediaStream, "getVideoTracks" | "getAudioTracks">,
  needsVideo: boolean,
  needsAudio: boolean,
): "video" | "audio" | null {
  if (needsVideo && !stream.getVideoTracks().some(track => track.readyState === "live")) return "video";
  if (needsAudio && !stream.getAudioTracks().some(track => track.readyState === "live")) return "audio";
  return null;
}


/** An interrupted capture may be previewed locally only when it contains usable, bounded data. */
export function canRecoverInterruptedCapture(blobSize: number, maxBytes = MAX_MEDIA_CAPTURE_BYTES): boolean {
  return Number.isSafeInteger(blobSize) && Number.isSafeInteger(maxBytes) && blobSize > 0 && maxBytes >= 0 && blobSize <= maxBytes;
}


/** Pick the first browser-supported recording format, or let MediaRecorder choose its default. */
export function selectMediaRecorderMimeType(
  candidates: readonly string[],
  isTypeSupported: (mimeType: string) => boolean,
): string | undefined {
  for (const candidate of candidates) {
    try {
      if (isTypeSupported(candidate)) return candidate;
    } catch {
      // A browser may expose MediaRecorder but fail a format capability query.
    }
  }
  return undefined;
}
