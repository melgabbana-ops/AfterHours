export type RitualDrawHistoryItem = {
  id: string;
  title: string;
  text: string;
  drawnAt: string;
};

type RitualDrawRecord = {
  record_key: string;
  payload: unknown;
  created_at?: string | null;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function validDate(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0 && Number.isFinite(Date.parse(value));
}

export function getRitualDrawHistory(records: readonly RitualDrawRecord[]): RitualDrawHistoryItem[] {
  return records
    .map((record, index) => {
      if (!record.record_key.startsWith("draw:")) return null;
      const payload = asRecord(record.payload);
      const title = typeof payload?.title === "string" ? payload.title.trim() : "";
      const text = typeof payload?.text === "string" ? payload.text.trim() : "";
      if (!title || !text) return null;

      const drawnAt = validDate(payload?.drawnAt)
        ? payload.drawnAt
        : validDate(record.created_at)
          ? record.created_at
          : "";

      return { id: record.record_key, title, text, drawnAt, index };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .sort((a, b) => {
      const aTime = a.drawnAt ? Date.parse(a.drawnAt) : Number.NEGATIVE_INFINITY;
      const bTime = b.drawnAt ? Date.parse(b.drawnAt) : Number.NEGATIVE_INFINITY;
      return (bTime - aTime) || (a.index - b.index);
    })
    .map(({ index: _index, ...item }) => item);
}
