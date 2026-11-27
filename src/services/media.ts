import { supabase, supabaseConfigured } from "./supabase";

const BUCKET = "after-hours-private-media";
const MAX_FILE_BYTES = 20 * 1024 * 1024;
const STORAGE_PAGE_SIZE = 1000;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "image/heic",
  "image/heif",
  "video/webm",
  "video/mp4",
  "video/quicktime",
  "audio/mpeg",
  "audio/mp4",
  "audio/aac",
  "audio/wav",
  "audio/x-wav",
  "audio/ogg",
  "audio/webm",
  "audio/flac",
]);

export interface PrivateMediaItem {
  name: string;
  path: string;
  size: number;
  createdAt: string | null;
  contentType: string | null;
}

export function validatePrivateMediaPath(path: string, userId: string): boolean {
  if (!userId || !path || path.includes("\\") || path.startsWith("/") || /[\u0000-\u001F\u007F]/.test(path)) return false;
  // Uploaded paths are generated from a strict safe-name alphabet, so any percent
  // sign is unexpected. Reject all percent encoding to block single- and double-encoded
  // separators, traversal, and control characters before signing or deleting objects.
  if (path.includes("%")) return false;
  const segments = path.split("/");
  const safeSegment = /^[a-zA-Z0-9._-]+$/;
  return segments.length === 3
    && segments[0] === userId
    && segments.every((segment) =>
      segment.length > 0
      && segment !== "."
      && segment !== ".."
      && safeSegment.test(segment)
    );
}

interface PrivateMediaStorageEntry {
  name?: string | null;
  id?: string | null;
  metadata?: { size?: unknown; mimetype?: unknown } | null;
  created_at?: string | null;
}

/** Convert untrusted Storage list metadata into a safe, owner-scoped vault item. */
export function toPrivateMediaItem(
  userId: string,
  folderName: string,
  item: PrivateMediaStorageEntry,
): PrivateMediaItem | null {
  if (!item.name || !item.id) return null;
  const path = `${userId}/${folderName}/${item.name}`;
  if (!validatePrivateMediaPath(path, userId)) return null;

  const size = item.metadata?.size;
  // Storage metadata is untrusted: do not coerce strings, null, or missing values
  // into a plausible byte count before displaying private-file details.
  if (typeof size !== "number" || !Number.isSafeInteger(size) || size < 0) return null;

  const createdAt = typeof item.created_at === "string" && Number.isFinite(Date.parse(item.created_at))
    ? item.created_at
    : null;
  const contentType = typeof item.metadata?.mimetype === "string" && item.metadata.mimetype.trim()
    ? item.metadata.mimetype.trim()
    : null;

  return { name: item.name, path, size, createdAt, contentType };
}

export function normalizePrivateMediaMimeType(type: string): string {
  return type.toLowerCase().split(";")[0].trim();
}

const OVERLAY_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"]);

/** HEIC/HEIF decoding is not consistently available to canvas across browsers. */
export function canApplyMediaOverlay(type: string): boolean {
  return OVERLAY_IMAGE_TYPES.has(normalizePrivateMediaMimeType(type));
}

export function validatePrivateMediaFile(file: Pick<File, "type" | "size">): void {
  if (!ALLOWED_TYPES.has(normalizePrivateMediaMimeType(file.type))) throw new Error("Kies een afbeelding, audio- of videobestand.");
  if (!Number.isSafeInteger(file.size) || file.size <= 0 || file.size > MAX_FILE_BYTES) throw new Error("Bestanden moeten kleiner zijn dan 20 MB.");
}

export function safePrivateMediaFileName(value: string): string {
  const normalized = value.normalize("NFKD").replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(-100);
  return !normalized || normalized === "." || normalized === ".." ? "bestand" : normalized;
}

export function safeMediaSessionFolder(value: string): string {
  const raw = value.trim();
  // Check dot-only path segments before filename normalization replaces them.
  if (!raw || raw === "." || raw === "..") return "general";
  return safePrivateMediaFileName(raw);
}

export function safeAssignmentPrefix(value?: string): string {
  if (!value?.trim()) return "";
  return `${safeMediaSessionFolder(value).slice(0, 40)}-`;
}

async function currentUserId(): Promise<string> {
  if (!supabaseConfigured || !supabase) throw new Error("Privéopslag is nog niet geconfigureerd.");
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error("Log in om privébestanden te gebruiken.");
  return data.user.id;
}

export async function listPrivateMedia(): Promise<PrivateMediaItem[]> {
  const userId = await currentUserId();
  const storage = supabase!.storage.from(BUCKET);
  const items: PrivateMediaItem[] = [];
  // Storage list() is paginated. Walk every page so older sessions and large
  // vaults do not silently disappear after the first 100 entries.
  for (let folderOffset = 0; ; folderOffset += STORAGE_PAGE_SIZE) {
    const { data: folders, error: folderError } = await storage.list(userId, {
      limit: STORAGE_PAGE_SIZE,
      offset: folderOffset,
      sortBy: { column: "name", order: "asc" },
    });
    if (folderError) throw folderError;
    for (const folder of folders ?? []) {
      if (!folder.name) continue;
      const prefix = `${userId}/${folder.name}`;
      for (let fileOffset = 0; ; fileOffset += STORAGE_PAGE_SIZE) {
        const { data, error } = await storage.list(prefix, {
          limit: STORAGE_PAGE_SIZE,
          offset: fileOffset,
          sortBy: { column: "created_at", order: "desc" },
        });
        if (error) throw error;
        for (const item of data ?? []) {
          const safeItem = toPrivateMediaItem(userId, folder.name, item);
          if (safeItem) items.push(safeItem);
        }
        if ((data?.length ?? 0) < STORAGE_PAGE_SIZE) break;
      }
    }
    if ((folders?.length ?? 0) < STORAGE_PAGE_SIZE) break;
  }
  return items.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? "")).slice(0, 100);
}

export async function uploadPrivateMedia(file: File, sessionId: string, assignmentTitle?: string): Promise<void> {
  validatePrivateMediaFile(file);
  const userId = await currentUserId();
  const safeSessionId = safeMediaSessionFolder(sessionId);
  const safeAssignment = safeAssignmentPrefix(assignmentTitle);
  const path = `${userId}/${safeSessionId}/${safeAssignment}${crypto.randomUUID()}-${safePrivateMediaFileName(file.name)}`;
  const { error } = await supabase!.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    contentType: normalizePrivateMediaMimeType(file.type),
    upsert: false,
  });
  if (error) throw error;
}

export async function createPrivateMediaUrl(path: string): Promise<string> {
  const userId = await currentUserId();
  if (!validatePrivateMediaPath(path, userId)) throw new Error("Je hebt geen toegang tot dit bestand.");
  const { data, error } = await supabase!.storage.from(BUCKET).createSignedUrl(path, 60);
  if (error) throw error;
  return data.signedUrl;
}

/** Require Storage to confirm the single requested object was actually removed. */
export function assertPrivateMediaDeletionConfirmed(data: readonly unknown[] | null | undefined): void {
  if (!Array.isArray(data) || data.length !== 1 || data[0] === null || typeof data[0] !== "object") {
    throw new Error("Verwijderen kon niet worden bevestigd. Het bestand staat mogelijk nog in je privékluis. Vernieuw de lijst en probeer opnieuw.");
  }
}

export async function deletePrivateMedia(path: string): Promise<void> {
  const userId = await currentUserId();
  if (!validatePrivateMediaPath(path, userId)) throw new Error("Je hebt geen toegang tot dit bestand.");
  const { data, error } = await supabase!.storage.from(BUCKET).remove([path]);
  if (error) throw error;
  assertPrivateMediaDeletionConfirmed(data);
}
