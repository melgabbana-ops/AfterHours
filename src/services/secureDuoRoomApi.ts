import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import { createDuoInvitationToken, hashDuoInvitationToken } from "./duoRoomInvitations";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
type DuoClient = SupabaseClient;
type RoomStatus = "lobby" | "active" | "paused" | "stopped";

export interface SecureDuoRoom {
  roomId: string;
  token: string;
  expiresAt: string;
}
export interface SecureDuoInvitationPreview {
  roomId: string;
  status: "lobby" | "paused";
  expiresAt: string;
}
export interface SecureDuoRoomResult {
  roomId: string;
  status: RoomStatus;
}

function getClient(client?: DuoClient | null): DuoClient {
  const activeClient = client ?? supabase;
  if (!activeClient) throw new Error("Online Duo is niet beschikbaar. Configureer eerst de AFTER HOURS-backend.");
  return activeClient;
}
function requireUuid(value: string): string {
  if (!UUID_PATTERN.test(value)) throw new Error("Duo-kamer-ID is ongeldig.");
  return value;
}
async function requireUser(client: DuoClient): Promise<string> {
  const { data, error } = await client.auth.getUser();
  if (error) throw new Error("Accountstatus kon niet worden gecontroleerd: " + error.message);
  if (!data.user) throw new Error("Log eerst in met je AFTER HOURS-account om een online Duo-kamer te gebruiken.");
  return data.user.id;
}
function objectPayload(value: unknown, message: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(message);
  return value as Record<string, unknown>;
}

/** Creates a private room; only the token hash is sent to the server. */
export async function createSecureDuoRoom(client?: DuoClient | null): Promise<SecureDuoRoom> {
  const activeClient = getClient(client);
  await requireUser(activeClient);
  const { token, tokenHash } = await createDuoInvitationToken();
  const { data, error } = await activeClient.rpc("create_afterhours_duo_room", {
    p_invitation_token_hash: tokenHash,
  });
  if (error) throw new Error("Online Duo-kamer kon niet worden aangemaakt: " + error.message);
  const payload = objectPayload(data, "De server gaf geen geldige Duo-kamer terug.");
  if (typeof payload.room_id !== "string" || !UUID_PATTERN.test(payload.room_id) || typeof payload.expires_at !== "string") {
    throw new Error("De server gaf onvolledige Duo-kamergegevens terug.");
  }
  return { roomId: payload.room_id, token, expiresAt: payload.expires_at };
}

/** Preview is read-only and never grants membership or consent. */
export async function previewSecureDuoInvitation(token: string, client?: DuoClient | null): Promise<SecureDuoInvitationPreview> {
  const activeClient = getClient(client);
  await requireUser(activeClient);
  const tokenHash = await hashDuoInvitationToken(token);
  const { data, error } = await activeClient.rpc("preview_afterhours_duo_invitation", { p_token_hash: tokenHash });
  if (error) throw new Error("Duo-uitnodiging kon niet worden geopend: " + error.message);
  const payload = objectPayload(data, "De server gaf geen geldige uitnodigingspreview terug.");
  if (typeof payload.room_id !== "string" || !UUID_PATTERN.test(payload.room_id)
    || (payload.status !== "lobby" && payload.status !== "paused")
    || typeof payload.expires_at !== "string") {
    throw new Error("De uitnodigingspreview is onvolledig of ongeldig.");
  }
  return { roomId: payload.room_id, status: payload.status, expiresAt: payload.expires_at };
}

/** Accepting is a deliberate action; the SQL RPC binds the guest account to the room. */
export async function acceptSecureDuoInvitation(token: string, client?: DuoClient | null): Promise<SecureDuoInvitationAccepted> {
  const activeClient = getClient(client);
  await requireUser(activeClient);
  const tokenHash = await hashDuoInvitationToken(token);
  const { data, error } = await activeClient.rpc("accept_afterhours_duo_invitation", { p_token_hash: tokenHash });
  if (error) throw new Error("Duo-uitnodiging kon niet worden geaccepteerd: " + error.message);
  const payload = objectPayload(data, "De server bevestigde de Duo-deelname niet.");
  if (typeof payload.room_id !== "string" || !UUID_PATTERN.test(payload.room_id) || payload.status !== "accepted") {
    throw new Error("De server gaf geen geldige Duo-deelnamebevestiging terug.");
  }
  return { roomId: payload.room_id, accepted: true };
}

/** Each participant controls their own consent. Revoking either side pauses the room server-side. */
export async function setSecureDuoConsent(roomId: string, consent: boolean, client?: DuoClient | null): Promise<{ roomId: string; consent: boolean; status: RoomStatus }> {
  const activeClient = getClient(client);
  await requireUser(activeClient);
  const { data, error } = await activeClient.rpc("set_afterhours_duo_consent", {
    p_room_id: requireUuid(roomId), p_consent: consent,
  });
  if (error) throw new Error("Duo-toestemming kon niet worden bijgewerkt: " + error.message);
  const payload = objectPayload(data, "De server bevestigde de Duo-toestemming niet.");
  if (payload.room_id !== roomId || payload.consent !== consent
    || !["lobby","active","paused","stopped"].includes(String(payload.status))) {
    throw new Error("De server gaf geen geldige Duo-toestemmingsstatus terug.");
  }
  return { roomId, consent, status: payload.status as RoomStatus };
}

export async function setSecureDuoRoomState(roomId: string, status: "active" | "paused" | "stopped", client?: DuoClient | null): Promise<SecureDuoRoomResult> {
  const activeClient = getClient(client);
  await requireUser(activeClient);
  const { data, error } = await activeClient.rpc("set_afterhours_duo_room_state", {
    p_room_id: requireUuid(roomId), p_status: status,
  });
  if (error) throw new Error("Duo-kamerstatus kon niet worden bijgewerkt: " + error.message);
  const payload = objectPayload(data, "De server bevestigde de Duo-kamerstatus niet.");
  if (payload.room_id !== roomId || payload.status !== status) throw new Error("De server gaf geen geldige Duo-kamerstatus terug.");
  return { roomId, status };
}

/** Host-only server RPC revokes the pending invitation and closes the room. */
export async function revokeSecureDuoInvitation(roomId: string, client?: DuoClient | null): Promise<void> {
  const activeClient = getClient(client);
  await requireUser(activeClient);
  const { data, error } = await activeClient.rpc("revoke_afterhours_duo_invitation", { p_room_id: requireUuid(roomId) });
  if (error) throw new Error("Duo-uitnodiging kon niet worden ingetrokken: " + error.message);
  const payload = objectPayload(data, "De server bevestigde het intrekken van de Duo-uitnodiging niet.");
  if (payload.room_id !== roomId || payload.status !== "stopped") throw new Error("De server gaf geen geldige intrekkingsbevestiging terug.");
}


export interface SecureDuoLiveState {
  round: number;
  status: RoomStatus;
  updatedAt: string;
}
export interface SecureDuoRealtimeHandlers {
  onState?: (state: SecureDuoLiveState) => void;
  onPresence?: (presence: Record<string, unknown[]>) => void;
}

/** Reject arbitrary payloads: private Realtime carries no answers, media or profile details. */
export function isSecureDuoLiveState(value: unknown): value is SecureDuoLiveState {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const payload = value as Record<string, unknown>;
  const keys = Object.keys(payload).sort();
  return keys.length === 3
    && keys[0] === "round" && keys[1] === "status" && keys[2] === "updatedAt"
    && Number.isInteger(payload.round) && Number(payload.round) >= 0 && Number(payload.round) <= 4
    && ["lobby", "active", "paused", "stopped"].includes(String(payload.status))
    && typeof payload.updatedAt === "string"
    && Number.isFinite(Date.parse(payload.updatedAt));
}

/**
 * Join only the UUID-derived private topic. State changes go through the
 * authorization RPC first; Broadcast is a UI synchronization hint, not authority.
 */
export async function joinSecureDuoRealtime(
  roomId: string,
  handlers: SecureDuoRealtimeHandlers = {},
  client?: DuoClient | null,
): Promise<{
  presence: () => Record<string, unknown[]>;
  setRoomState: (status: "active" | "paused" | "stopped", round: number) => Promise<void>;
  leave: () => Promise<void>;
}> {
  const activeClient = getClient(client);
  const safeRoomId = requireUuid(roomId);
  const userId = await requireUser(activeClient);
  const channel = activeClient.channel("afterhours-duo:" + safeRoomId, {
    config: { private: true, presence: { key: userId }, broadcast: { self: false, ack: true } },
  });

  channel.on("broadcast", { event: "duo-state" }, ({ payload }) => {
    if (isSecureDuoLiveState(payload)) handlers.onState?.(payload);
  });
  channel.on("presence", { event: "sync" }, () => {
    handlers.onPresence?.(channel.presenceState() as Record<string, unknown[]>);
  });

  await new Promise<void>((resolve, reject) => {
    channel.subscribe((status, error) => {
      if (status === "SUBSCRIBED") resolve();
      else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
        reject(new Error(error?.message || "De beveiligde Duo-verbinding kon niet worden geopend."));
      }
    });
  });

  const tracked = await channel.track({ online: true, seenAt: new Date().toISOString() });
  if (tracked !== "ok") {
    await activeClient.removeChannel(channel);
    throw new Error("Je aanwezigheid kon niet veilig in de Duo-kamer worden bevestigd.");
  }

  return {
    presence: () => channel.presenceState() as Record<string, unknown[]>,
    setRoomState: async (status, round) => {
      if (!Number.isInteger(round) || round < 0 || round > 4) throw new Error("Ongeldige Duo-ronde.");
      // The server checks membership, host permissions and both live consents.
      await setSecureDuoRoomState(safeRoomId, status, activeClient);
      const state: SecureDuoLiveState = { status, round, updatedAt: new Date().toISOString() };
      if (!isSecureDuoLiveState(state)) throw new Error("Ongeldige Duo-status.");
      const response = await channel.send({ type: "broadcast", event: "duo-state", payload: state });
      if (response !== "ok") throw new Error("De Duo-status is opgeslagen, maar kon niet live worden gedeeld.");
    },
    leave: async () => {
      await channel.untrack();
      await activeClient.removeChannel(channel);
    },
  };
}
