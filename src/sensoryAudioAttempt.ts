export type SensoryAudioAttemptGuard = ReturnType<typeof createSensoryAudioAttemptGuard>;

/**
 * Prevents overlapping Web Audio starts and makes a pending start stale when
 * the user stops audio or leaves the owning account context.
 */
export function createSensoryAudioAttemptGuard() {
  let generation = 0;
  let pending = false;

  return {
    begin(): number | null {
      if (pending) return null;
      pending = true;
      generation += 1;
      return generation;
    },

    isCurrent(attemptId: number): boolean {
      return pending && attemptId === generation;
    },

    finish(attemptId: number): boolean {
      if (!pending || attemptId !== generation) return false;
      pending = false;
      return true;
    },

    invalidate(): void {
      generation += 1;
      pending = false;
    },
  };
}
