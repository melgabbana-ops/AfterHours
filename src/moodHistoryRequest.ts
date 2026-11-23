export function createMoodHistoryRequestGuard() {
  let generation = 0;

  return {
    begin(): number {
      generation += 1;
      return generation;
    },
    isCurrent(requestId: number): boolean {
      return requestId === generation;
    },
    invalidate(): void {
      generation += 1;
    },
  };
}
