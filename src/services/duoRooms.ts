import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase, supabaseConfigured } from "./supabase";
import { createDuoInvitationToken, hashDuoInvitationToken } from "./duoRoomInvitations";

export const SECURE_DUO_BACKEND_ENABLED = false; // Enable only after the proposal is deployed and two-account checks pass.

const ROOM_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface SecureDuoRoom {
  roomId: string;
  expiresAt: string;
}

export interface SecureDuoRoomSnapshot {
  roomId: string;
  status: "lobby" | "active" | "paused" | "stopped";
  expiresAt: string;
  members: Array<{ role: "host" | "guest"; isSelf: boolean; consented: boolean }>;
  session: { step: number; revision: number; updatedBySelf: boolean };
}

/** Fetch the authoritative, member-scoped lobby state from the database. */
export async function getSecureDuoRoomState(roomId: string): Promise<SecureDuoRoomSnapshot> {
  const client = requireClient();
  await requireUserId();
  const { data, error } = await client.rpc("get_afterhours_duo_room_state", {
    p_room_id: requireRoomId(roomId),
  });
  if (error) throw error;
  const value = data as {
    room_id?: unknown;
    status?: unknown;
    expires_at?: unknown;
    members?: unknown;
    session?: unknown;
  } | null;
  if (!value || typeof value.room_id !== "string" || typeof value.expires_at !== "string"
    || !["lobby", "active", "paused", "stopped"].includes(String(value.status))
    || !Array.isArray(value.members) || !value.session || typeof value.session !== "object") {
    throw new Error("The Duo server returned an invalid room snapshot.");
  }
  const members = value.members.map((member: unknown) => {
    const item = member as { role?: unknown; is_self?: unknown; consented?: unknown };
    if ((item.role !== "host" && item.role !== "guest")
      || typeof item.is_self !== "boolean" || typeof item.consented !== "boolean") {
      throw new Error("The Duo server returned invalid participant status.");
    }
    return { role: item.role as "host" | "guest", isSelf: item.is_self, consented: item.consented };
  });
  if (members.length > 2 || members.filter(member => member.isSelf).length !== 1) {
    throw new Error("The Duo server returned an unexpected participant count.");
  }
  const session = value.session as { current_step?: unknown; revision?: unknown; updated_by_self?: unknown };
  if (!Number.isInteger(session.current_step) || Number(session.current_step) < 0 || Number(session.current_step) > 4
    || !Number.isSafeInteger(session.revision) || Number(session.revision) < 0
    || typeof session.updated_by_self !== "boolean") {
    throw new Error("The Duo server returned invalid shared session progress.");
  }
  return {
    roomId: requireRoomId(value.room_id),
    status: value.status as SecureDuoRoomSnapshot["status"],
    expiresAt: value.expires_at,
    members,
    session: { step: Number(session.current_step), revision: Number(session.revision), updatedBySelf: session.updated_by_self },
  };
}

function requireClient() {
  if (!SECURE_DUO_BACKEND_ENABLED) throw new Error("Online Duo is not enabled yet. Private invitations are waiting for the reviewed database rollout.");
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

/** Accepting joins the lobby only; the participant must opt in separately through the consent RPC. */
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

/** Move the shared prompt cursor. A revision conflict requires a fresh server snapshot. */
export async function advanceSecureDuoSession(
  roomId: string,
  direction: "next" | "previous",
  expectedRevision: number,
): Promise<{ step: number; revision: number }> {
  if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 0) {
    throw new Error("The Duo session revision is invalid.");
  }
  const client = requireClient();
  await requireUserId();
  const { data, error } = await client.rpc("advance_afterhours_duo_session", {
    p_room_id: requireRoomId(roomId),
    p_direction: direction,
    p_expected_revision: expectedRevision,
  });
  if (error) throw error;
  const value = data as { current_step?: unknown; revision?: unknown } | null;
  if (!value || !Number.isInteger(value.current_step) || Number(value.current_step) < 0
    || Number(value.current_step) > 4 || !Number.isSafeInteger(value.revision)
    || Number(value.revision) < 1) {
    throw new Error("The Duo server returned invalid shared session progress.");
  }
  return { step: Number(value.current_step), revision: Number(value.revision) };
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
