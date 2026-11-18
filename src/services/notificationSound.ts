let audioContext: AudioContext | null = null;
type AudioWindow = Window & { webkitAudioContext?: typeof AudioContext };

const getContext = (): AudioContext | null => {
  if (typeof window === "undefined") return null;
  if (audioContext && audioContext.state !== "closed") return audioContext;
  const Constructor = window.AudioContext ?? (window as AudioWindow).webkitAudioContext;
  if (!Constructor) return null;
  try {
    audioContext = new Constructor({ latencyHint: "interactive" });
    return audioContext;
  } catch {
    return null;
  }
};

let gestureBound = false;

/** Call directly from a user gesture (tap/click) to unlock iOS Safari audio. */
export function primeNotificationAudio(): void {
  const context = getContext();
  if (!context || context.state === "running") return;
  try {
    // Calling resume synchronously from the gesture is important on iOS.
    void context.resume().catch(() => undefined);
  } catch {
    // Audio is an optional enhancement; never interrupt app controls.
  }
}

function bindGestureUnlock() {
  if (typeof window === "undefined" || gestureBound) return;
  gestureBound = true;
  const unlock = () => primeNotificationAudio();
  window.addEventListener("pointerdown", unlock, { passive: true });
  window.addEventListener("touchend", unlock, { passive: true });
  window.addEventListener("keydown", unlock);
}
bindGestureUnlock();

function note(
  frequency: number,
  start: number,
  duration: number,
  peak: number,
  wave: OscillatorType = "sine",
  detune = 0
) {
  const context = getContext();
  if (!context) return;
  const oscillator = context.createOscillator();
  const overtone = context.createOscillator();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();
  const shimmer = context.createGain();
  const at = context.currentTime + start;

  oscillator.type = wave;
  oscillator.frequency.setValueAtTime(frequency, at);
  oscillator.detune.setValueAtTime(detune, at);
  overtone.type = "sine";
  overtone.frequency.setValueAtTime(frequency * 2.006, at);
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(3200, at);

  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.linearRampToValueAtTime(peak, at + 0.025);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
  shimmer.gain.setValueAtTime(0.0001, at);
  shimmer.gain.linearRampToValueAtTime(peak * 0.22, at + 0.035);
  shimmer.gain.exponentialRampToValueAtTime(0.0001, at + duration * 0.78);

  oscillator.connect(filter).connect(gain).connect(context.destination);
  overtone.connect(filter).connect(shimmer).connect(context.destination);
  oscillator.start(at);
  overtone.start(at);
  oscillator.stop(at + duration + 0.05);
  overtone.stop(at + duration + 0.05);
}

function playSignature(kind: "message" | "checkin" | "safety") {
  // Original AFTER HOURS four-note "Gilded Nocturne" motif, synthesized locally.
  // Peaks are deliberately calibrated for phone speakers; the previous values
  // were so low that the test could appear to do nothing on mobile.
  if (kind === "safety") {
    note(174.61, 0, 0.28, 0.17, "triangle", -3);
    note(130.81, 0.2, 0.36, 0.15, "sine", 2);
    note(98, 0.43, 0.5, 0.13, "triangle", -2);
    return;
  }
  if (kind === "checkin") {
    note(293.66, 0, 0.24, 0.14, "sine", 2);
    note(369.99, 0.15, 0.3, 0.16, "triangle", -2);
    note(440, 0.34, 0.36, 0.14, "sine", 1);
    note(587.33, 0.54, 0.48, 0.12, "sine", 0);
    return;
  }
  note(220, 0, 0.25, 0.14, "sine", -2);
  note(329.63, 0.13, 0.3, 0.16, "triangle", 2);
  note(392, 0.31, 0.34, 0.14, "sine", -1);
  note(523.25, 0.5, 0.48, 0.12, "sine", 1);
}

/** Returns true only when the browser accepted scheduling the signature sound. */
export async function playNotificationSound(
  kind: "message" | "checkin" | "safety" = "message"
): Promise<boolean> {
  const context = getContext();
  if (!context) return false;
  try {
    if (context.state !== "running") await context.resume();
  } catch {
    return false;
  }
  if (context.state !== "running") return false;
  try {
    playSignature(kind);
    return true;
  } catch {
    return false;
  }
}

export function notificationAudioAvailable() {
  return typeof window !== "undefined" &&
    ("AudioContext" in window || "webkitAudioContext" in (window as AudioWindow));
}
