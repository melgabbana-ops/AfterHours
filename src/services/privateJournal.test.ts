import journalSource from "../AftercareJournal.tsx?raw";
import { describe, expect, it } from "vitest";
import {
  createPrivateJournalVault,
  deletePrivateJournalEntry,
  exportPrivateJournalBackup,
  hasPrivateJournalVault,
  importPrivateJournalBackup,
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
  it("locks on background and page hide, removes listeners and clears in-memory text", () => {
    expect(journalSource).toContain('document.addEventListener("visibilitychange", lockWhenHidden)');
    expect(journalSource).toContain('window.addEventListener("pagehide", lockOnPageHide)');
    expect(journalSource).toContain('document.removeEventListener("visibilitychange", lockWhenHidden)');
    expect(journalSource).toContain('window.removeEventListener("pagehide", lockOnPageHide)');
    expect(journalSource).toContain('setKey(null)');
    expect(journalSource).toContain('setPassphrase("")');
    expect(journalSource).toContain('setEntries([])');
    expect(journalSource).toContain('lockGeneration.current += 1;');
    expect(journalSource).toContain('"De journal-kluis is vergrendeld."');
    expect(journalSource).toContain('"Journal automatisch vergrendeld toen de app naar de achtergrond ging.');
  });
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

  it("exports ciphertext and merges a backup encrypted with a different passphrase", async () => {
    const currentStorage = memoryStorage();
    const backupStorage = memoryStorage();
    const currentKey = await createPrivateJournalVault("huidige unieke wachtzin", currentStorage);
    const backupKey = await createPrivateJournalVault("oude unieke backup wachtzin", backupStorage);
    await savePrivateJournalEntry(currentKey, { title: "Huidig", body: "Blijft behouden." }, undefined, currentStorage);
    await savePrivateJournalEntry(backupKey, { title: "Uit back-up", body: "Wordt samengevoegd." }, undefined, backupStorage);
    const backup = await exportPrivateJournalBackup(backupKey, backupStorage);
    expect(backup).not.toContain("Wordt samengevoegd.");
    await expect(importPrivateJournalBackup(currentKey, backup, "verkeerde backup wachtzin", currentStorage)).rejects.toThrow("vergrendeld");
    const imported = await importPrivateJournalBackup(currentKey, backup, "oude unieke backup wachtzin", currentStorage);
    expect(imported).toBe(1);
    const entries = await loadPrivateJournalEntries(currentKey, currentStorage);
    expect(entries.map(entry => entry.title).sort()).toEqual(["Huidig", "Uit back-up"]);
    const stored = currentStorage.getItem(PRIVATE_JOURNAL_STORAGE_KEY) ?? "";
    expect(stored).not.toContain("Blijft behouden.");
    expect(stored).not.toContain("Wordt samengevoegd.");
  });

  it("rejects a stale key even when the replacement vault has no entries", async () => {
    const originalStorage = memoryStorage();
    const replacementStorage = memoryStorage();
    const oldKey = await createPrivateJournalVault("eerste unieke wachtzin", originalStorage);
    await createPrivateJournalVault("tweede unieke wachtzin", replacementStorage);
    await expect(loadPrivateJournalEntries(oldKey, replacementStorage)).rejects.toThrow("vergrendeld");
    await expect(savePrivateJournalEntry(oldKey, { title: "Test", body: "Nooit opslaan" }, undefined, replacementStorage)).rejects.toThrow("vergrendeld");
    expect(replacementStorage.getItem(PRIVATE_JOURNAL_STORAGE_KEY)).not.toContain("Nooit opslaan");
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

  it("does not create or save a vault after the journal has been locked", async () => {
    const storage = memoryStorage();
    await expect(createPrivateJournalVault("een lange unieke wachtzin", storage, () => false)).rejects.toThrow("Journal vergrendeld");
    expect(storage.getItem(PRIVATE_JOURNAL_STORAGE_KEY)).toBeNull();

    const key = await createPrivateJournalVault("een lange unieke wachtzin", storage);
    await expect(savePrivateJournalEntry(
      key,
      { title: "Concept", body: "Mag niet worden opgeslagen na vergrendelen." },
      undefined,
      storage,
      "2026-11-21T12:00:00.000Z",
      () => false,
    )).rejects.toThrow("Journal vergrendeld");
    const entries = await loadPrivateJournalEntries(key, storage);
    expect(entries).toHaveLength(0);
  });

  it("rejects short passphrases and empty entries", async () => {
    const storage = memoryStorage();
    await expect(createPrivateJournalVault("kort", storage)).rejects.toThrow("minimaal 12");
    const key = await createPrivateJournalVault("een lange unieke wachtzin", storage);
    await expect(savePrivateJournalEntry(key, { title: " ", body: " " }, undefined, storage)).rejects.toThrow("Schrijf eerst");
    expect(hasPrivateJournalVault(storage)).toBe(true);
  });
});
