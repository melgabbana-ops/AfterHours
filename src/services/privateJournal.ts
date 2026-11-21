export const PRIVATE_JOURNAL_STORAGE_KEY = "afterhours.private-journal.v1";
export const PRIVATE_JOURNAL_MIN_PASSPHRASE = 12;
export const PRIVATE_JOURNAL_ENTRY_LIMIT = 5000;

export interface PrivateJournalEntry {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}
export interface PrivateJournalDraft { title: string; body: string; }
export interface EncryptedJournalEntry {
  id: string;
  createdAt: string;
  updatedAt: string;
  iv: string;
  ciphertext: string;
}
interface StoredVault {
  version: 1;
  salt: string;
  verifier: { iv: string; ciphertext: string };
  entries: EncryptedJournalEntry[];
}
type JournalStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;
const VERIFIER = "AFTER HOURS PRIVATE JOURNAL · VAULT CHECK · V1";

/** Isolate each person's encrypted journal in the same browser profile. */
export function privateJournalStorageForOwner(ownerId: string, backingStorage?: JournalStorage): JournalStorage {
  const owner = ownerId.trim();
  if (!owner) throw new Error("Een geldig profiel is nodig om het privéjournal te openen.");
  const storageKey = `${PRIVATE_JOURNAL_STORAGE_KEY}:${encodeURIComponent(owner)}`;
  const target = backingStorage ?? (() => {
    try { return globalThis.localStorage; } catch { return undefined; }
  })();
  const requireTarget = (): JournalStorage => {
    if (!target) throw new Error("Lokale opslag is niet beschikbaar.");
    return target;
  };
  return {
    getItem: () => requireTarget().getItem(storageKey),
    setItem: (_key, value) => requireTarget().setItem(storageKey, value),
    removeItem: () => requireTarget().removeItem(storageKey),
  };
}

function storageTarget(storage?: JournalStorage): JournalStorage | undefined {
  if (storage) return storage;
  try { return globalThis.localStorage; } catch { return undefined; }
}
function webCrypto(): Crypto {
  if (!globalThis.crypto?.subtle || !globalThis.crypto.getRandomValues) {
    throw new Error("Versleuteling wordt niet ondersteund in deze browser of verbinding.");
  }
  return globalThis.crypto;
}
function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}
function fromBase64(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}
function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer as ArrayBuffer;
}
function parseVault(raw: string | null): StoredVault | null {
  if (raw === null) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;
    const vault = value as Record<string, unknown>;
    if (vault.version !== 1 || typeof vault.salt !== "string" || !vault.salt
      || !vault.verifier || typeof vault.verifier !== "object" || Array.isArray(vault.verifier)
      || !Array.isArray(vault.entries)) return null;
    const verifier = vault.verifier as Record<string, unknown>;
    if (typeof verifier.iv !== "string" || typeof verifier.ciphertext !== "string") return null;
    const entries: EncryptedJournalEntry[] = [];
    for (const item of vault.entries) {
      if (!item || typeof item !== "object" || Array.isArray(item)) return null;
      const row = item as Record<string, unknown>;
      if (typeof row.id !== "string" || !row.id
        || typeof row.createdAt !== "string" || !Number.isFinite(Date.parse(row.createdAt))
        || typeof row.updatedAt !== "string" || !Number.isFinite(Date.parse(row.updatedAt))
        || typeof row.iv !== "string" || typeof row.ciphertext !== "string") return null;
      entries.push({ id: row.id, createdAt: row.createdAt, updatedAt: row.updatedAt, iv: row.iv, ciphertext: row.ciphertext });
    }
    return { version: 1, salt: vault.salt, verifier: { iv: verifier.iv, ciphertext: verifier.ciphertext }, entries };
  } catch { return null; }
}
async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const crypto = webCrypto();
  const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(passphrase), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: toArrayBuffer(salt), iterations: 310_000, hash: "SHA-256" },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}
async function encryptText(key: CryptoKey, text: string): Promise<{ iv: string; ciphertext: string }> {
  const iv = webCrypto().getRandomValues(new Uint8Array(12));
  const encrypted = await webCrypto().subtle.encrypt({ name: "AES-GCM", iv: toArrayBuffer(iv) }, key, toArrayBuffer(new TextEncoder().encode(text)));
  return { iv: toBase64(iv), ciphertext: toBase64(new Uint8Array(encrypted)) };
}
async function decryptText(key: CryptoKey, encrypted: { iv: string; ciphertext: string }): Promise<string> {
  const clear = await webCrypto().subtle.decrypt(
    { name: "AES-GCM", iv: toArrayBuffer(fromBase64(encrypted.iv)) },
    key,
    toArrayBuffer(fromBase64(encrypted.ciphertext)),
  );
  return new TextDecoder().decode(clear);
}
async function assertVaultKey(key: CryptoKey, vault: StoredVault): Promise<void> {
  try {
    if (await decryptText(key, vault.verifier) !== VERIFIER) throw new Error("wrong key");
  } catch {
    throw new Error("De journal-kluis is vergrendeld of de sleutel hoort niet bij deze kluis.");
  }
}
async function decryptVaultEntries(key: CryptoKey, vault: StoredVault): Promise<PrivateJournalEntry[]> {
  await assertVaultKey(key, vault);
  const entries = await Promise.all(vault.entries.map(async (row) => {
    const parsed: unknown = JSON.parse(await decryptText(key, row));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("Ongeldige journalnotitie.");
    const entry = parsed as Record<string, unknown>;
    if (entry.id !== row.id || typeof entry.title !== "string" || typeof entry.body !== "string"
      || entry.title.length > 120 || entry.body.length > PRIVATE_JOURNAL_ENTRY_LIMIT
      || entry.createdAt !== row.createdAt || entry.updatedAt !== row.updatedAt) {
      throw new Error("Een journalnotitie kon niet veilig worden gelezen.");
    }
    return entry as unknown as PrivateJournalEntry;
  }));
  return entries.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}
function persistVault(target: JournalStorage, vault: StoredVault): void {
  const serialized = JSON.stringify(vault);
  target.setItem(PRIVATE_JOURNAL_STORAGE_KEY, serialized);
  if (target.getItem(PRIVATE_JOURNAL_STORAGE_KEY) !== serialized) throw new Error("De versleutelde journalgegevens konden niet worden gecontroleerd na opslaan.");
}

export function hasPrivateJournalVault(storage?: JournalStorage): boolean {
  const target = storageTarget(storage);
  if (!target) return false;
  try { return target.getItem(PRIVATE_JOURNAL_STORAGE_KEY) !== null; } catch { return false; }
}

export async function createPrivateJournalVault(
  passphrase: string,
  storage?: JournalStorage,
  canCommit: () => boolean = () => true,
): Promise<CryptoKey> {
  if (passphrase.length < PRIVATE_JOURNAL_MIN_PASSPHRASE) {
    throw new Error("Kies een wachtzin van minimaal 12 tekens.");
  }
  const target = storageTarget(storage);
  if (!target) throw new Error("Lokale opslag is niet beschikbaar.");
  if (target.getItem(PRIVATE_JOURNAL_STORAGE_KEY) !== null) throw new Error("Er bestaat al journal-opslag. Ontgrendel of herstel deze eerst; bestaande gegevens worden niet overschreven.");
  const salt = webCrypto().getRandomValues(new Uint8Array(16));
  const key = await deriveKey(passphrase, salt);
  const verifier = await encryptText(key, VERIFIER);
  if (!canCommit()) throw new Error("Journal vergrendeld voordat de kluis kon worden aangemaakt.");
  persistVault(target, { version: 1, salt: toBase64(salt), verifier, entries: [] });
  return key;
}

export async function unlockPrivateJournalVault(
  passphrase: string,
  storage?: JournalStorage,
): Promise<CryptoKey> {
  const target = storageTarget(storage);
  if (!target) throw new Error("Lokale opslag is niet beschikbaar.");
  const vault = parseVault(target.getItem(PRIVATE_JOURNAL_STORAGE_KEY));
  if (!vault) throw new Error("De journal-kluis ontbreekt of is beschadigd.");
  const key = await deriveKey(passphrase, fromBase64(vault.salt));
  try {
    const verifier = await decryptText(key, vault.verifier);
    if (verifier !== VERIFIER) throw new Error("invalid verifier");
    return key;
  } catch {
    throw new Error("Wachtzin onjuist. De kluis blijft vergrendeld.");
  }
}

export async function loadPrivateJournalEntries(
  key: CryptoKey,
  storage?: JournalStorage,
): Promise<PrivateJournalEntry[]> {
  const target = storageTarget(storage);
  if (!target) throw new Error("Lokale opslag is niet beschikbaar.");
  const vault = parseVault(target.getItem(PRIVATE_JOURNAL_STORAGE_KEY));
  if (!vault) throw new Error("De journal-kluis ontbreekt of is beschadigd.");
  return decryptVaultEntries(key, vault);
}

export async function savePrivateJournalEntry(
  key: CryptoKey,
  draft: PrivateJournalDraft,
  entryId?: string,
  storage?: JournalStorage,
  now = new Date().toISOString(),
  canCommit: () => boolean = () => true,
): Promise<PrivateJournalEntry> {
  const title = typeof draft.title === "string" ? draft.title.trim().slice(0, 120) : "";
  const body = typeof draft.body === "string" ? draft.body.trim() : "";
  if (!title && !body) throw new Error("Schrijf eerst iets voordat je opslaat.");
  if (body.length > PRIVATE_JOURNAL_ENTRY_LIMIT) throw new Error("Deze notitie is te lang.");
  if (!Number.isFinite(Date.parse(now))) throw new Error("Ongeldige datum.");
  const target = storageTarget(storage);
  if (!target) throw new Error("Lokale opslag is niet beschikbaar.");
  const vault = parseVault(target.getItem(PRIVATE_JOURNAL_STORAGE_KEY));
  if (!vault) throw new Error("De journal-kluis ontbreekt of is beschadigd.");
  await assertVaultKey(key, vault);
  const existing = entryId ? vault.entries.find((row) => row.id === entryId) : undefined;
  if (entryId && !existing) throw new Error("Deze notitie bestaat niet meer.");
  const entry: PrivateJournalEntry = {
    id: existing?.id ?? webCrypto().randomUUID(),
    title: title || "Zonder titel",
    body,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  const encrypted = await encryptText(key, JSON.stringify(entry));
  if (!canCommit()) throw new Error("Journal vergrendeld voordat de notitie kon worden opgeslagen.");
  const row: EncryptedJournalEntry = { id: entry.id, createdAt: entry.createdAt, updatedAt: entry.updatedAt, ...encrypted };
  const entries = existing
    ? vault.entries.map((item) => item.id === entry.id ? row : item)
    : [row, ...vault.entries];
  persistVault(target, { ...vault, entries });
  return entry;
}

export async function exportPrivateJournalBackup(key: CryptoKey, storage?: JournalStorage): Promise<string> {
  const target = storageTarget(storage);
  if (!target) throw new Error("Lokale opslag is niet beschikbaar.");
  const vault = parseVault(target.getItem(PRIVATE_JOURNAL_STORAGE_KEY));
  if (!vault) throw new Error("De journal-kluis ontbreekt of is beschadigd.");
  await decryptVaultEntries(key, vault);
  return JSON.stringify({ format: "afterhours-private-journal", ...vault });
}

export async function importPrivateJournalBackup(
  currentKey: CryptoKey,
  backupText: string,
  backupPassphrase: string,
  storage?: JournalStorage,
  canCommit: () => boolean = () => true,
): Promise<number> {
  if (backupText.length > 5_000_000) throw new Error("Dit back-upbestand is te groot.");
  let parsed: unknown;
  try { parsed = JSON.parse(backupText); } catch { throw new Error("Dit is geen geldig journal-back-upbestand."); }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)
    || (parsed as Record<string, unknown>).format !== "afterhours-private-journal") {
    throw new Error("Dit bestand is geen AFTER HOURS journal-back-up.");
  }
  const backupVault = parseVault(JSON.stringify(parsed));
  if (!backupVault) throw new Error("De back-up is beschadigd of heeft een onbekend formaat.");
  const backupKey = await deriveKey(backupPassphrase, fromBase64(backupVault.salt));
  const backupEntries = await decryptVaultEntries(backupKey, backupVault);
  const target = storageTarget(storage);
  if (!target) throw new Error("Lokale opslag is niet beschikbaar.");
  const currentVault = parseVault(target.getItem(PRIVATE_JOURNAL_STORAGE_KEY));
  if (!currentVault) throw new Error("De huidige journal-kluis ontbreekt of is beschadigd.");
  const currentEntries = await decryptVaultEntries(currentKey, currentVault);
  const merged = new Map<string, PrivateJournalEntry>();
  for (const entry of [...currentEntries, ...backupEntries]) {
    const previous = merged.get(entry.id);
    if (!previous || entry.updatedAt > previous.updatedAt) merged.set(entry.id, entry);
  }
  const encryptedRows = await Promise.all([...merged.values()].map(async (entry) => ({
    id: entry.id,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
    ...(await encryptText(currentKey, JSON.stringify(entry))),
  })));
  if (!canCommit()) throw new Error("Journal vergrendeld voordat de back-up kon worden hersteld.");
  persistVault(target, { ...currentVault, entries: encryptedRows });
  return backupEntries.length;
}

export async function deletePrivateJournalEntry(
  entryId: string,
  key: CryptoKey,
  storage?: JournalStorage,
  canCommit: () => boolean = () => true,
): Promise<boolean> {
  const target = storageTarget(storage);
  if (!target || !entryId) return false;
  try {
    const vault = parseVault(target.getItem(PRIVATE_JOURNAL_STORAGE_KEY));
    if (!vault || !vault.entries.some((row) => row.id === entryId)) return false;
    await assertVaultKey(key, vault);
    if (!canCommit()) return false;
    persistVault(target, { ...vault, entries: vault.entries.filter((row) => row.id !== entryId) });
    return true;
  } catch { return false; }
}

export function deletePrivateJournalVault(storage?: JournalStorage): boolean {
  const target = storageTarget(storage);
  if (!target) return false;
  try {
    target.removeItem(PRIVATE_JOURNAL_STORAGE_KEY);
    return target.getItem(PRIVATE_JOURNAL_STORAGE_KEY) === null;
  } catch { return false; }
}
