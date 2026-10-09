import { supabase, supabaseConfigured } from "./supabase";

const BUCKET = "after-hours-private-media";
const MAX_FILE_BYTES = 20 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
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
  return segments.length === 3
    && segments[0] === userId
    && segments.every((segment) => segment.length > 0 && segment !== "." && segment !== "..");
}

export function validatePrivateMediaFile(file: Pick<File, "type" | "size">): void {
  if (!ALLOWED_TYPES.has(file.type.toLowerCase())) throw new Error("Kies een afbeelding of audiobestand.");
  if (file.size <= 0 || file.size > MAX_FILE_BYTES) throw new Error("Bestanden moeten kleiner zijn dan 20 MB.");
}

function safeFileName(value: string): string {
  const normalized = value.normalize("NFKD").replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(-100);
  return normalized || "bestand";
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
  const { data: folders, error: folderError } = await supabase!.storage.from(BUCKET).list(userId, {
    limit: 100,
    sortBy: { column: "name", order: "asc" },
  });
  if (folderError) throw folderError;
  const items: PrivateMediaItem[] = [];
  for (const folder of folders ?? []) {
    if (!folder.name) continue;
    const prefix = `${userId}/${folder.name}`;
    const { data, error } = await supabase!.storage.from(BUCKET).list(prefix, {
      limit: 100,
      sortBy: { column: "created_at", order: "desc" },
    });
    if (error) throw error;
    for (const item of data ?? []) {
      if (!item.name || !item.id) continue;
      items.push({
        name: item.name,
        path: `${prefix}/${item.name}`,
        size: Number(item.metadata?.size ?? 0),
        createdAt: item.created_at ?? null,
        contentType: typeof item.metadata?.mimetype === "string" ? item.metadata.mimetype : null,
      });
    }
  }
  return items.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? "")).slice(0, 100);
}

export async function uploadPrivateMedia(file: File, sessionId: string): Promise<void> {
  validatePrivateMediaFile(file);
  const userId = await currentUserId();
  const safeSessionId = safeFileName(sessionId || "general");
  const path = `${userId}/${safeSessionId}/${crypto.randomUUID()}-${safeFileName(file.name)}`;
  const { error } = await supabase!.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    contentType: file.type,
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

export async function deletePrivateMedia(path: string): Promise<void> {
  const userId = await currentUserId();
  if (!validatePrivateMediaPath(path, userId)) throw new Error("Je hebt geen toegang tot dit bestand.");
  const { error } = await supabase!.storage.from(BUCKET).remove([path]);
  if (error) throw error;
}
