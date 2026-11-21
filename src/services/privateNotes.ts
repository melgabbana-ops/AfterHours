export const PRIVATE_NOTE_FIELD_LIMIT = 1200;

export interface PrivateSessionNote {
  ownerId: string;
  sessionId: string;
  howFelt: string;
  whatLiked: string;
  changeNextTime: string;
  createdAt: string;
  updatedAt: string;
}

export type PrivateSessionNoteDraft = Pick<PrivateSessionNote, "howFelt" | "whatLiked" | "changeNextTime">;
type NoteStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

const STORAGE_PREFIX = "afterhours.private-session-note.v1";

function resolveStorage(storage?: NoteStorage): NoteStorage | undefined {
  if (storage) return storage;
  try { return globalThis.localStorage; } catch { return undefined; }
}

function storageKey(ownerId: string, sessionId: string): string | null {
  const owner = ownerId.trim();
  const session = sessionId.trim();
  if (!owner || !session) return null;
  return `${STORAGE_PREFIX}:${encodeURIComponent(owner)}:${encodeURIComponent(session)}`;
}

function validTimestamp(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && Number.isFinite(Date.parse(value));
}

export function isPrivateSessionNote(value: unknown, ownerId?: string, sessionId?: string): value is PrivateSessionNote {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const note = value as Record<string, unknown>;
  return typeof note.ownerId === "string" && note.ownerId.trim().length > 0
    && typeof note.sessionId === "string" && note.sessionId.trim().length > 0
    && (ownerId === undefined || note.ownerId === ownerId)
    && (sessionId === undefined || note.sessionId === sessionId)
    && ["howFelt", "whatLiked", "changeNextTime"].every((field) =>
      typeof note[field] === "string" && (note[field] as string).length <= PRIVATE_NOTE_FIELD_LIMIT)
    && validTimestamp(note.createdAt) && validTimestamp(note.updatedAt);
}

export function loadPrivateSessionNote(ownerId: string, sessionId: string, storage?: NoteStorage): PrivateSessionNote | null {
  const target = resolveStorage(storage);
  const key = storageKey(ownerId, sessionId);
  if (!target || !key) return null;
  try {
    const raw = target.getItem(key);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isPrivateSessionNote(parsed, ownerId.trim(), sessionId.trim()) ? parsed : null;
  } catch {
    return null;
  }
}

export function savePrivateSessionNote(
  ownerId: string,
  sessionId: string,
  draft: PrivateSessionNoteDraft,
  storage?: NoteStorage,
  now = new Date().toISOString(),
): PrivateSessionNote | null {
  const target = resolveStorage(storage);
  const key = storageKey(ownerId, sessionId);
  if (!target || !key || !validTimestamp(now)) return null;
  const fields = {
    howFelt: typeof draft.howFelt === "string" ? draft.howFelt.trim() : "",
    whatLiked: typeof draft.whatLiked === "string" ? draft.whatLiked.trim() : "",
    changeNextTime: typeof draft.changeNextTime === "string" ? draft.changeNextTime.trim() : "",
  };
  if (Object.values(fields).some((value) => value.length > PRIVATE_NOTE_FIELD_LIMIT)
    || !Object.values(fields).some(Boolean)) return null;
  const previous = loadPrivateSessionNote(ownerId.trim(), sessionId.trim(), target);
  const note: PrivateSessionNote = {
    ownerId: ownerId.trim(),
    sessionId: sessionId.trim(),
    ...fields,
    createdAt: previous?.createdAt ?? now,
    updatedAt: now,
  };
  try {
    const serialized = JSON.stringify(note);
    target.setItem(key, serialized);
    const persisted = target.getItem(key);
    if (persisted !== serialized) return null;
    const verified: unknown = JSON.parse(persisted);
    return isPrivateSessionNote(verified, note.ownerId, note.sessionId) ? verified : null;
  } catch {
    return null;
  }
}

export function deletePrivateSessionNote(ownerId: string, sessionId: string, storage?: NoteStorage): boolean {
  const target = resolveStorage(storage);
  const key = storageKey(ownerId, sessionId);
  if (!target || !key) return false;
  try {
    target.removeItem(key);
    return target.getItem(key) === null;
  } catch {
    return false;
  }
}
