export type PendingExperienceStop = {
  runId: string;
  ownerId: string;
  queuedAt: string;
};

export type PendingExperienceStopStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

const STORAGE_KEY = "afterhours.pending-experience-stops.v1";
const MAX_PENDING_STOPS = 20;

function readAll(storage: PendingExperienceStopStorage): PendingExperienceStop[] {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is PendingExperienceStop =>
      Boolean(item)
      && typeof item === "object"
      && typeof (item as PendingExperienceStop).runId === "string"
      && (item as PendingExperienceStop).runId.trim().length > 0
      && typeof (item as PendingExperienceStop).ownerId === "string"
      && (item as PendingExperienceStop).ownerId.trim().length > 0
      && typeof (item as PendingExperienceStop).queuedAt === "string"
      && (item as PendingExperienceStop).queuedAt.length > 0
    );
  } catch {
    return [];
  }
}

/** Read only minimal run/owner identifiers for a pending server-side STOP. */
export function getPendingExperienceStops(
  storage: PendingExperienceStopStorage,
  ownerId: string,
): PendingExperienceStop[] {
  if (!ownerId) return [];
  return readAll(storage).filter((item) => item.ownerId === ownerId);
}

/** Persist a STOP retry without storing scene content, consent text, or interaction history. */
export function enqueuePendingExperienceStop(
  storage: PendingExperienceStopStorage,
  runId: string,
  ownerId: string,
  queuedAt = new Date().toISOString(),
): boolean {
  if (!runId.trim() || !ownerId.trim() || !queuedAt) return false;
  const current = readAll(storage);
  if (current.some((item) => item.runId === runId && item.ownerId === ownerId)) return true;
  if (current.length >= MAX_PENDING_STOPS) return false;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify([...current, { runId, ownerId, queuedAt }]));
    return true;
  } catch {
    return false;
  }
}

/** Remove only the matching owner's retry marker after the server STOP is verified. */
export function removePendingExperienceStop(
  storage: PendingExperienceStopStorage,
  runId: string,
  ownerId: string,
): boolean {
  const current = readAll(storage);
  const next = current.filter((item) => item.runId !== runId || item.ownerId !== ownerId);
  if (next.length === current.length) return true;
  try {
    if (next.length) storage.setItem(STORAGE_KEY, JSON.stringify(next));
    else storage.removeItem(STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}
