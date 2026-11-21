import { describe, expect, it } from "vitest";
import {
  deletePrivateSessionNote,
  isPrivateSessionNote,
  loadPrivateSessionNote,
  PRIVATE_NOTE_FIELD_LIMIT,
  savePrivateSessionNote,
} from "./privateNotes";

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
    removeItem: (key: string) => { values.delete(key); },
  };
}

const draft = { howFelt: "Rustig en verbonden", whatLiked: "De check-ins", changeNextTime: "" };

describe("browser-local aftercare notes", () => {
  it("stores a note scoped to one owner and session", () => {
    const storage = memoryStorage();
    const saved = savePrivateSessionNote("owner-a", "session-1", draft, storage, "2026-11-19T12:00:00.000Z");
    expect(saved).not.toBeNull();
    expect(loadPrivateSessionNote("owner-a", "session-1", storage)).toEqual(saved);
    expect(loadPrivateSessionNote("owner-b", "session-1", storage)).toBeNull();
    expect(loadPrivateSessionNote("owner-a", "session-2", storage)).toBeNull();
  });

  it("preserves createdAt while updating updatedAt", () => {
    const storage = memoryStorage();
    const first = savePrivateSessionNote("owner-a", "session-1", draft, storage, "2026-11-19T12:00:00.000Z");
    const second = savePrivateSessionNote("owner-a", "session-1", { ...draft, whatLiked: "De rustige afronding" }, storage, "2026-11-19T13:00:00.000Z");
    expect(second?.createdAt).toBe(first?.createdAt);
    expect(second?.updatedAt).toBe("2026-11-19T13:00:00.000Z");
  });

  it("does not store an empty note", () => {
    const storage = memoryStorage();
    expect(savePrivateSessionNote("owner-a", "session-1", { howFelt: " ", whatLiked: "", changeNextTime: "" }, storage)).toBeNull();
  });

  it("rejects blank identifiers and fields over the documented limit", () => {
    const storage = memoryStorage();
    expect(savePrivateSessionNote(" ", "session-1", draft, storage)).toBeNull();
    expect(savePrivateSessionNote("owner-a", "", draft, storage)).toBeNull();
    expect(savePrivateSessionNote("owner-a", "session-1", { ...draft, howFelt: "x".repeat(PRIVATE_NOTE_FIELD_LIMIT + 1) }, storage)).toBeNull();
  });

  it("rejects malformed, mismatched, and invalid-timestamp records", () => {
    expect(isPrivateSessionNote({ ...draft, ownerId: "owner-a", sessionId: "session-1", createdAt: "bad", updatedAt: "bad" })).toBe(false);
    const storage = memoryStorage();
    storage.setItem("afterhours.private-session-note.v1:owner-a:session-1", JSON.stringify({ ...draft, ownerId: "owner-b", sessionId: "session-1", createdAt: "2026-11-19T12:00:00.000Z", updatedAt: "2026-11-19T12:00:00.000Z" }));
    expect(loadPrivateSessionNote("owner-a", "session-1", storage)).toBeNull();
    storage.setItem("afterhours.private-session-note.v1:owner-a:session-1", "{");
    expect(loadPrivateSessionNote("owner-a", "session-1", storage)).toBeNull();
  });

  it("deletes only the selected owner-session note", () => {
    const storage = memoryStorage();
    savePrivateSessionNote("owner-a", "session-1", draft, storage);
    savePrivateSessionNote("owner-a", "session-2", draft, storage);
    expect(deletePrivateSessionNote("owner-a", "session-1", storage)).toBe(true);
    expect(loadPrivateSessionNote("owner-a", "session-1", storage)).toBeNull();
    expect(loadPrivateSessionNote("owner-a", "session-2", storage)).not.toBeNull();
  });

  it("does not report success when browser storage silently drops a note", () => {
    const silentStorage = {
      getItem: () => null,
      setItem: () => undefined,
      removeItem: () => undefined,
    };
    expect(savePrivateSessionNote("owner-a", "session-1", draft, silentStorage, "2026-11-21T08:00:00.000Z")).toBeNull();
  });

  it("does not report success when browser storage changes the saved payload", () => {
    const alteredStorage = {
      getItem: () => JSON.stringify({ unexpected: true }),
      setItem: () => undefined,
      removeItem: () => undefined,
    };
    expect(savePrivateSessionNote("owner-a", "session-1", draft, alteredStorage, "2026-11-21T08:00:00.000Z")).toBeNull();
  });

  it("does not report deletion success when browser storage ignores the removal", () => {
    const existing = JSON.stringify({
      ownerId: "owner-a",
      sessionId: "session-1",
      ...draft,
      createdAt: "2026-11-21T08:00:00.000Z",
      updatedAt: "2026-11-21T08:00:00.000Z",
    });
    const stubbornStorage = {
      getItem: () => existing,
      setItem: () => undefined,
      removeItem: () => undefined,
    };
    expect(deletePrivateSessionNote("owner-a", "session-1", stubbornStorage)).toBe(false);
  });

  it("fails safely when storage is unavailable or throws", () => {
    const broken = { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("blocked"); }, removeItem: () => { throw new Error("blocked"); } };
    expect(loadPrivateSessionNote("owner-a", "session-1", broken)).toBeNull();
    expect(savePrivateSessionNote("owner-a", "session-1", draft, broken)).toBeNull();
    expect(deletePrivateSessionNote("owner-a", "session-1", broken)).toBe(false);
  });
});
