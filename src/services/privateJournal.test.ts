import { describe, expect, it } from "vitest";
import {
  createPrivateJournalVault,
  deletePrivateJournalEntry,
  hasPrivateJournalVault,
  loadPrivateJournalEntries,
  PRIVATE_JOURNAL_STORAGE_KEY,
  savePrivateJournalEntry,
  unlockPrivateJournalVault,
} from "./privateJournal";

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
    removeItem: (key: string) => { values.delete(key); },
  };
}

describe("encrypted private journal vault", () => {
  it("encrypts entry text before it reaches browser storage and unlocks it again", async () => {
    const storage = memoryStorage();
    const key = await createPrivateJournalVault("een lange unieke wachtzin", storage);
    await savePrivateJournalEntry(key, { title: "Een rustige avond", body: "Ik voelde me gehoord en veilig." }, undefined, storage);
    const raw = storage.getItem(PRIVATE_JOURNAL_STORAGE_KEY) ?? "";
    expect(raw).not.toContain("Een rustige avond");
    expect(raw).not.toContain("Ik voelde me gehoord en veilig.");
    const unlocked = await unlockPrivateJournalVault("een lange unieke wachtzin", storage);
    const entries = await loadPrivateJournalEntries(unlocked, storage);
    expect(entries).toHaveLength(1);
    expect(entries[0].title).toBe("Een rustige avond");
    expect(entries[0].body).toBe("Ik voelde me gehoord en veilig.");
  });

  it("rejects an incorrect passphrase without revealing journal content", async () => {
    const storage = memoryStorage();
    const key = await createPrivateJournalVault("een lange unieke wachtzin", storage);
    await savePrivateJournalEntry(key, { title: "Privé", body: "Niet zichtbaar zonder sleutel." }, undefined, storage);
    await expect(unlockPrivateJournalVault("een totaal andere wachtzin", storage)).rejects.toThrow("Wachtzin onjuist");
  });

  it("preserves entry identity and creation date when editing, and deletes only the selected entry", async () => {
    const storage = memoryStorage();
    const key = await createPrivateJournalVault("een lange unieke wachtzin", storage);
    const first = await savePrivateJournalEntry(key, { title: "Eerste", body: "Tekst" }, undefined, storage, "2026-11-21T10:00:00.000Z");
    const edited = await savePrivateJournalEntry(key, { title: "Aangepast", body: "Nieuwe tekst" }, first.id, storage, "2026-11-21T11:00:00.000Z");
    expect(edited.id).toBe(first.id);
    expect(edited.createdAt).toBe(first.createdAt);
    expect(edited.updatedAt).toBe("2026-11-21T11:00:00.000Z");
    const second = await savePrivateJournalEntry(key, { title: "Tweede", body: "Nog een notitie" }, undefined, storage);
    expect(deletePrivateJournalEntry(first.id, storage)).toBe(true);
    const entries = await loadPrivateJournalEntries(key, storage);
    expect(entries.map(entry => entry.id)).toEqual([second.id]);
  });

  it("preserves an existing empty or malformed storage value instead of replacing it with a new vault", async () => {
    const storage = memoryStorage();
    storage.setItem(PRIVATE_JOURNAL_STORAGE_KEY, "");
    await expect(createPrivateJournalVault("een lange unieke wachtzin", storage)).rejects.toThrow("Er bestaat al journal-opslag");
    expect(storage.getItem(PRIVATE_JOURNAL_STORAGE_KEY)).toBe("");

    await expect(unlockPrivateJournalVault("een lange unieke wachtzin", storage)).rejects.toThrow("ontbreekt of is beschadigd");
    expect(storage.getItem(PRIVATE_JOURNAL_STORAGE_KEY)).toBe("");
  });

  it("rejects short passphrases and empty entries", async () => {
    const storage = memoryStorage();
    await expect(createPrivateJournalVault("kort", storage)).rejects.toThrow("minimaal 12");
    const key = await createPrivateJournalVault("een lange unieke wachtzin", storage);
    await expect(savePrivateJournalEntry(key, { title: " ", body: " " }, undefined, storage)).rejects.toThrow("Schrijf eerst");
    expect(hasPrivateJournalVault(storage)).toBe(true);
  });
});
