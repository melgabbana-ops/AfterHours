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
function parseVault(raw: string | null): StoredVault | null {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;
    const vault = value as Record<string, unknown>;
    if (vault.version !== 1 || typeof vault.salt !== "string" || !vault.salt
      || !vault.verifier || typeof vault.verifier !== "object" || Array.isArray(vault.verifier)
      || !Array.isArray(vault.entries)) return null;
    const verifier = vault.verifier as Record<string, unknown>;
    if (typeof verifier.iv !== "string" || typeof verifier.ciphertext !== "string") return null;
    const entries = vault.entries.filter((item): item is EncryptedJournalEntry => {
      if (!item || typeof item !== "object" || Array.isArray(item)) return false;
      const row = item as Record<string, unknown>;
      return typeof row.id === "string" && typeof row.createdAt === "string"
        && Number.isFinite(Date.parse(row.createdAt)) && typeof row.updatedAt === "string"
        && Number.isFinite(Date.parse(row.updatedAt)) && typeof row.iv === "string"
        && typeof row.ciphertext === "string";
    });
    return { version: 1, salt: vault.salt, verifier: { iv: verifier.iv, ciphertext: verifier.ciphertext }, entries };
  } catch { return null; }
}
async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const crypto = webCrypto();
  const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(passphrase), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 310_000, hash: "SHA-256" },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}
async function encryptText(key: CryptoKey, text: string): Promise<{ iv: string; ciphertext: string }> {
  const iv = webCrypto().getRandomValues(new Uint8Array(12));
  const encrypted = await webCrypto().subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(text));
  return { iv: toBase64(iv), ciphertext: toBase64(new Uint8Array(encrypted)) };
}
async function decryptText(key: CryptoKey, encrypted: { iv: string; ciphertext: string }): Promise<string> {
  const clear = await webCrypto().subtle.decrypt(
    { name: "AES-GCM", iv: fromBase64(encrypted.iv) },
    key,
    fromBase64(encrypted.ciphertext),
  );
  return new TextDecoder().decode(clear);
}
function persistVault(target: JournalStorage, vault: StoredVault): void {
  const serialized = JSON.stringify(vault);
  target.setItem(PRIVATE_JOURNAL_STORAGE_KEY, serialized);
  if (target.getItem(PRIVATE_JOURNAL_STORAGE_KEY) !== serialized) throw new Error("De versleutelde journalgegevens konden niet worden gecontroleerd na opslaan.");
}

export function hasPrivateJournalVault(storage?: JournalStorage): boolean {
  const target = storageTarget(storage);
  if (!target) return false;
  try { return parseVault(target.getItem(PRIVATE_JOURNAL_STORAGE_KEY)) !== null; } catch { return false; }
}

export async function createPrivateJournalVault(
  passphrase: string,
  storage?: JournalStorage,
): Promise<CryptoKey> {
  if (passphrase.length < PRIVATE_JOURNAL_MIN_PASSPHRASE) {
    throw new Error("Kies een wachtzin van minimaal 12 tekens.");
  }
  const target = storageTarget(storage);
  if (!target) throw new Error("Lokale opslag is niet beschikbaar.");
  if (target.getItem(PRIVATE_JOURNAL_STORAGE_KEY)) throw new Error("Er bestaat al een journal-kluis. Ontgrendel deze eerst.");
  const salt = webCrypto().getRandomValues(new Uint8Array(16));
  const key = await deriveKey(passphrase, salt);
  const verifier = await encryptText(key, VERIFIER);
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

export async function savePrivateJournalEntry(
  key: CryptoKey,
  draft: PrivateJournalDraft,
  entryId?: string,
  storage?: JournalStorage,
  now = new Date().toISOString(),
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
  const row: EncryptedJournalEntry = { id: entry.id, createdAt: entry.createdAt, updatedAt: entry.updatedAt, ...encrypted };
  const entries = existing
    ? vault.entries.map((item) => item.id === entry.id ? row : item)
    : [row, ...vault.entries];
  persistVault(target, { ...vault, entries });
  return entry;
}

export function deletePrivateJournalEntry(entryId: string, storage?: JournalStorage): boolean {
  const target = storageTarget(storage);
  if (!target || !entryId) return false;
  const vault = parseVault(target.getItem(PRIVATE_JOURNAL_STORAGE_KEY));
  if (!vault || !vault.entries.some((row) => row.id === entryId)) return false;
  try {
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
