import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import { createDuoInvitationToken, hashDuoInvitationToken } from "./duoRoomInvitations";

type DuoClient = SupabaseClient;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export type SecureDuoRoomStatus = "lobby" | "active" | "paused" | "stopped";

export interface SecureDuoRoomInvitation {
  roomId: string;
  token: string;
  expiresAt: string;
}
export interface SecureDuoRoomPreview {
  roomId: string;
  status: "lobby" | "paused";
  expiresAt: string;
}

function getClient(client?: DuoClient | null): DuoClient {
  const active = client ?? supabase;
  if (!active) throw new Error("Online Duo is niet beschikbaar. Configureer eerst de AFTER HOURS-backend.");
  return active;
}
function requireRoomId(roomId: string): string {
  if (!UUID_PATTERN.test(roomId)) throw new Error("Duo-kamer-ID is ongeldig.");
  return roomId;
}
async function requireUser(client: DuoClient): Promise<string> {
  const { data, error } = await client.auth.getUser();
  if (error) throw new Error("Accountstatus kon niet worden gecontroleerd: " + error.message);
  if (!data.user) throw new Error("Log eerst in met je AFTER HOURS-account om een privé-Duo-kamer te gebruiken.");
  return data.user.id;
}
function record(value: unknown, message: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(message);
  return value as Record<string, unknown>;
}

/** Create a private room. Only a SHA-256 digest is sent to or stored by Postgres. */
export async function createSecureDuoRoom(client?: DuoClient | null): Promise<SecureDuoRoomInvitation> {
  const active = getClient(client);
  await requireUser(active);
  const { token, tokenHash } = await createDuoInvitationToken();
  const { data, error } = await active.rpc("create_afterhours_duo_room", { p_invitation_token_hash: tokenHash });
  if (error) throw new Error("Privé-Duo-kamer kon niet worden aangemaakt: " + error.message);
  const result = record(data, "De server gaf geen geldige privé-Duo-kamer terug.");
  if (typeof result.room_id !== "string" || !UUID_PATTERN.test(result.room_id) || typeof result.expires_at !== "string") {
    throw new Error("De server gaf onvolledige privé-Duo-kamergegevens terug.");
  }
  return { roomId: result.room_id, token, expiresAt: result.expires_at };
}

/** Preview does not join the room and never grants consent. */
export async function previewSecureDuoRoom(token: string, client?: DuoClient | null): Promise<SecureDuoRoomPreview> {
  const active = getClient(client);
  await requireUser(active);
  const tokenHash = await hashDuoInvitationToken(token);
  const { data, error } = await active.rpc("preview_afterhours_duo_invitation", { p_token_hash: tokenHash });
  if (error) throw new Error("Privé-Duo-uitnodiging kon niet worden geopend: " + error.message);
  const result = record(data, "De server gaf geen geldige uitnodigingspreview terug.");
  if (typeof result.room_id !== "string" || !UUID_PATTERN.test(result.room_id) ||
      (result.status !== "lobby" && result.status !== "paused") || typeof result.expires_at !== "string") {
    throw new Error("De privé-Duo-uitnodiging bevat onvolledige gegevens.");
  }
  return { roomId: result.room_id, status: result.status, expiresAt: result.expires_at };
}

/** Explicit acceptance joins the guest account; the server records the acceptance consent. */
export async function acceptSecureDuoRoom(token: string, client?: DuoClient | null): Promise<{ roomId: string; status: "accepted" }> {
  const active = getClient(client);
  await requireUser(active);
  const tokenHash = await hashDuoInvitationToken(token);
  const { data, error } = await active.rpc("accept_afterhours_duo_invitation", { p_token_hash: tokenHash });
  if (error) throw new Error("Privé-Duo-uitnodiging kon niet worden geaccepteerd: " + error.message);
  const result = record(data, "De server bevestigde de deelname niet.");
  if (typeof result.room_id !== "string" || !UUID_PATTERN.test(result.room_id) || result.status !== "accepted") {
    throw new Error("De server gaf geen geldige bevestiging van Duo-deelname terug.");
  }
  return { roomId: result.room_id, status: "accepted" };
}

/** Consent changes are per authenticated member; withdrawal pauses and revokes both members. */
export async function setSecureDuoConsent(roomId: string, consent: boolean, client?: DuoClient | null): Promise<void> {
  const active = getClient(client);
  await requireUser(active);
  const { error } = await active.rpc("set_afterhours_duo_consent", { p_room_id: requireRoomId(roomId), p_consent: consent });
  if (error) throw new Error("Duo-toestemming kon niet worden bijgewerkt: " + error.message);
}

/** Only the host may activate/resume; the database requires two current consents. */
export async function setSecureDuoRoomState(roomId: string, status: Exclude<SecureDuoRoomStatus, "lobby">, client?: DuoClient | null): Promise<void> {
  const active = getClient(client);
  await requireUser(active);
  const { error } = await active.rpc("set_afterhours_duo_room_state", { p_room_id: requireRoomId(roomId), p_status: status });
  if (error) throw new Error("Duo-kamerstatus kon niet worden bijgewerkt: " + error.message);
}

/** Host-only stop/revoke action. */
export async function revokeSecureDuoRoom(roomId: string, client?: DuoClient | null): Promise<void> {
  const active = getClient(client);
  await requireUser(active);
  const { error } = await active.rpc("revoke_afterhours_duo_invitation", { p_room_id: requireRoomId(roomId) });
  if (error) throw new Error("Privé-Duo-kamer kon niet worden gestopt: " + error.message);
}
