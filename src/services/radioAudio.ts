export function formatRadioTime(value: number): string {
  if (!Number.isFinite(value) || value < 0) return "0:00";
  const seconds = Math.floor(value);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}
export function getNextRadioTrackIndex(currentIndex: number, trackCount: number, options: { shuffle?: boolean; repeatOne?: boolean } = {}, random: () => number = Math.random): number {
  if (!Number.isInteger(trackCount) || trackCount <= 0) return -1;
  if (options.repeatOne && currentIndex >= 0 && currentIndex < trackCount) return currentIndex;
  if (trackCount === 1) return 0;
  if (options.shuffle) {
    const candidate = Math.min(trackCount - 2, Math.max(0, Math.floor(random() * (trackCount - 1))));
    return currentIndex < 0 || currentIndex >= trackCount ? Math.min(trackCount - 1, Math.floor(random() * trackCount)) : candidate >= currentIndex ? candidate + 1 : candidate;
  }
  return currentIndex < 0 || currentIndex >= trackCount ? 0 : (currentIndex + 1) % trackCount;
}
