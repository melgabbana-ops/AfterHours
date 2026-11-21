import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase, supabaseConfigured } from "./supabase";
import { createDuoInvitationToken, hashDuoInvitationToken } from "./duoRoomInvitations";

const ROOM_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface SecureDuoRoom {
  roomId: string;
  expiresAt: string;
}

function requireClient() {
  if (!supabaseConfigured || !supabase) throw new Error("Online Duo is not configured yet.");
  return supabase;
}

async function requireUserId(): Promise<string> {
  const client = requireClient();
  const { data, error } = await client.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error("Log in before using online Duo.");
  return data.user.id;
}

function requireRoomId(value: string): string {
  if (!ROOM_ID_PATTERN.test(value)) throw new Error("This Duo room is invalid.");
  return value;
}

function requireRpcRoom(data: unknown): SecureDuoRoom {
  const value = data as { room_id?: unknown; expires_at?: unknown } | null;
  if (!value || typeof value.room_id !== "string" || typeof value.expires_at !== "string") {
    throw new Error("The Duo server returned an invalid room response.");
  }
  return { roomId: requireRoomId(value.room_id), expiresAt: value.expires_at };
}

/** Create a server-owned room; the raw one-time token is returned only to this browser. */
export async function createSecureDuoRoom(): Promise<SecureDuoRoom & { invitationToken: string }> {
  await requireUserId();
  const client = requireClient();
  const { token, tokenHash } = await createDuoInvitationToken();
  const { data, error } = await client.rpc("create_afterhours_duo_room", {
    p_invitation_token_hash: tokenHash,
  });
  if (error) throw error;
  return { ...requireRpcRoom(data), invitationToken: token };
}

/** Preview an invitation without accepting it or recording consent. */
export async function previewSecureDuoInvitation(token: string): Promise<{ roomId: string; status: "lobby" | "paused"; expiresAt: string }> {
  await requireUserId();
  const client = requireClient();
  const tokenHash = await hashDuoInvitationToken(token);
  const { data, error } = await client.rpc("preview_afterhours_duo_invitation", {
    p_token_hash: tokenHash,
  });
  if (error) throw error;
  const value = data as { room_id?: unknown; status?: unknown; expires_at?: unknown } | null;
  if (!value || typeof value.room_id !== "string" || typeof value.expires_at !== "string"
    || (value.status !== "lobby" && value.status !== "paused")) {
    throw new Error("The Duo server returned an invalid invitation preview.");
  }
  return { roomId: requireRoomId(value.room_id), status: value.status, expiresAt: value.expires_at };
}

/** Accepting is the participant's explicit consent action in the invitation review screen. */
export async function acceptSecureDuoInvitation(token: string): Promise<string> {
  await requireUserId();
  const client = requireClient();
  const tokenHash = await hashDuoInvitationToken(token);
  const { data, error } = await client.rpc("accept_afterhours_duo_invitation", {
    p_token_hash: tokenHash,
  });
  if (error) throw error;
  const value = data as { room_id?: unknown } | null;
  if (!value || typeof value.room_id !== "string") throw new Error("The Duo server returned an invalid acceptance response.");
  return requireRoomId(value.room_id);
}

export async function setSecureDuoConsent(roomId: string, consent: boolean): Promise<void> {
  const client = requireClient();
  await requireUserId();
  const { error } = await client.rpc("set_afterhours_duo_consent", {
    p_room_id: requireRoomId(roomId),
    p_consent: consent,
  });
  if (error) throw error;
}

export async function setSecureDuoRoomState(roomId: string, status: "active" | "paused" | "stopped"): Promise<void> {
  const client = requireClient();
  await requireUserId();
  const { error } = await client.rpc("set_afterhours_duo_room_state", {
    p_room_id: requireRoomId(roomId),
    p_status: status,
  });
  if (error) throw error;
}

export async function revokeSecureDuoInvitation(roomId: string): Promise<void> {
  const client = requireClient();
  await requireUserId();
  const { error } = await client.rpc("revoke_afterhours_duo_invitation", {
    p_room_id: requireRoomId(roomId),
  });
  if (error) throw error;
}

/** Private topic only: the matching RLS policies are required before this can subscribe. */
export async function createSecureDuoChannel(roomId: string): Promise<{ channel: RealtimeChannel; userId: string }> {
  const client = requireClient();
  const userId = await requireUserId();
  const channel = client.channel(`afterhours-duo:${requireRoomId(roomId)}`, {
    config: {
      private: true,
      presence: { key: userId },
      broadcast: { self: false },
    },
  });
  return { channel, userId };
}
