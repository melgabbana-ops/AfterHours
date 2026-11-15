let audioContext: AudioContext | null = null;
type AudioWindow = Window & { webkitAudioContext?: typeof AudioContext };
const getContext = (): AudioContext | null => {
  if (typeof window === "undefined") return null;
  if (audioContext && audioContext.state !== "closed") return audioContext;
  const Constructor = window.AudioContext ?? (window as AudioWindow).webkitAudioContext;
  if (!Constructor) return null;
  try { audioContext = new Constructor(); return audioContext; } catch { return null; }
};
let gestureBound = false;
export function primeNotificationAudio() {
  const context = getContext();
  if (context?.state === "suspended") void context.resume().catch(() => undefined);
}
function bindGestureUnlock() {
  if (typeof window === "undefined" || gestureBound) return;
  gestureBound = true;
  const unlock = () => primeNotificationAudio();
  window.addEventListener("pointerdown", unlock, { passive: true });
  window.addEventListener("keydown", unlock);
}
bindGestureUnlock();

function note(frequency: number, start: number, duration: number, peak: number, wave: OscillatorType = "sine", detune = 0) {
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
  filter.frequency.setValueAtTime(2600, at);
  gain.gain.setValueAtTime(0, at);
  gain.gain.linearRampToValueAtTime(peak, at + .035);
  gain.gain.exponentialRampToValueAtTime(.0001, at + duration);
  shimmer.gain.setValueAtTime(0, at);
  shimmer.gain.linearRampToValueAtTime(peak * .16, at + .045);
  shimmer.gain.exponentialRampToValueAtTime(.0001, at + duration * .72);
  oscillator.connect(filter).connect(gain).connect(context.destination);
  overtone.connect(filter).connect(shimmer).connect(context.destination);
  oscillator.start(at); overtone.start(at);
  oscillator.stop(at + duration + .04); overtone.stop(at + duration + .04);
}
function playSignature(kind: "message" | "checkin" | "safety") {
  // Original AFTER HOURS four-note "Gilded Nocturne" motif, synthesized locally.
  if (kind === "safety") {
    note(174.61, 0, .28, .045, "triangle", -3);
    note(130.81, .2, .36, .04, "sine", 2);
    note(98, .43, .5, .034, "triangle", -2);
    return;
  }
  if (kind === "checkin") {
    note(293.66, 0, .24, .026, "sine", 2);
    note(369.99, .15, .3, .03, "triangle", -2);
    note(440, .34, .36, .026, "sine", 1);
    note(587.33, .54, .48, .021, "sine", 0);
    return;
  }
  note(220, 0, .25, .024, "sine", -2);
  note(329.63, .13, .3, .028, "triangle", 2);
  note(392, .31, .34, .024, "sine", -1);
  note(523.25, .5, .48, .02, "sine", 1);
}
export async function playNotificationSound(kind: "message" | "checkin" | "safety" = "message") {
  const context = getContext();
  if (!context) return;
  try { if (context.state === "suspended") await context.resume(); } catch { return; }
  if (context.state !== "running") return;
  playSignature(kind);
}
export function notificationAudioAvailable() {
  return typeof window !== "undefined" && ("AudioContext" in window || "webkitAudioContext" in (window as AudioWindow));
}
