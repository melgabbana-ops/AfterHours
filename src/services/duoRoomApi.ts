import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import { createDuoInvitationToken, hashDuoInvitationToken } from "./duoRoomInvitations";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type DuoClient = SupabaseClient;

export interface DuoInvitation {
  invitationId: string;
  token: string;
  expiresAt: string;
}

export interface DuoInvitationPreview {
  runId: string;
  title: string;
  description: string;
  steps: unknown[];
  expiresAt: string;
}

export interface AcceptedDuoInvitation {
  invitationId: string;
  runId: string;
  status: "accepted";
  acceptedAt: string;
}

function getClient(client?: DuoClient | null): DuoClient {
  const activeClient = client ?? supabase;
  if (!activeClient) throw new Error("Online Duo is niet beschikbaar. Configureer eerst de AFTER HOURS-backend.");
  return activeClient;
}

function requireUuid(value: string, label: string): string {
  if (!UUID_PATTERN.test(value)) throw new Error(label + " is ongeldig.");
  return value;
}

async function requireUser(client: DuoClient): Promise<string> {
  const { data, error } = await client.auth.getUser();
  if (error) throw new Error("Accountstatus kon niet worden gecontroleerd: " + error.message);
  if (!data.user) throw new Error("Log eerst in met je AFTER HOURS-account om Duo-uitnodigingen te gebruiken.");
  return data.user.id;
}

/**
 * Create a one-time invite for an existing shared experience.
 * The host must pause the run first; the database re-checks this on preview and acceptance.
 * Only the SHA-256 token hash is persisted. The raw token is returned once for the invite URL.
 */
export async function createDuoInvitation(runId: string, client?: DuoClient | null): Promise<DuoInvitation> {
  const activeClient = getClient(client);
  const safeRunId = requireUuid(runId, "Ervarings-ID");
  const userId = await requireUser(activeClient);

  const { data: run, error: runError } = await activeClient
    .from("afterhours_experience_runs")
    .select("status")
    .eq("id", safeRunId)
    .maybeSingle();
  if (runError) throw new Error("De Duo-ervaring kon niet worden gecontroleerd: " + runError.message);
  if (!run) throw new Error("Deze ervaring bestaat niet of is niet toegankelijk voor dit account.");
  if (run.status !== "paused") {
    throw new Error("Pauzeer de ervaring eerst. Je partner kan de uitnodiging pas bekijken en accepteren wanneer de ervaring gepauzeerd is.");
  }

  const { token, tokenHash } = await createDuoInvitationToken();
  const { data, error } = await activeClient
    .from("afterhours_experience_invitations")
    .insert({ run_id: safeRunId, inviter_user_id: userId, token_hash: tokenHash })
    .select("id, expires_at")
    .single();
  if (error) throw new Error("Duo-uitnodiging kon niet worden aangemaakt: " + error.message);
  if (!data?.id || !data?.expires_at) throw new Error("De server gaf geen geldige Duo-uitnodiging terug.");

  return { invitationId: data.id, token, expiresAt: data.expires_at };
}

/** Preview the exact shared scene without accepting it or granting consent. */
export async function previewDuoInvitation(token: string, client?: DuoClient | null): Promise<DuoInvitationPreview> {
  const activeClient = getClient(client);
  await requireUser(activeClient);
  const tokenHash = await hashDuoInvitationToken(token);
  const { data, error } = await activeClient.rpc("preview_afterhours_experience_invitation", {
    p_token_hash: tokenHash
  });
  if (error) throw new Error("Duo-uitnodiging kon niet worden geopend: " + error.message);
  if (!data || typeof data !== "object") throw new Error("De uitnodiging bevat geen geldige ervaringsgegevens.");

  const preview = data as Record<string, unknown>;
  if (typeof preview.run_id !== "string" || typeof preview.title !== "string" ||
      typeof preview.description !== "string" || !Array.isArray(preview.steps) ||
      typeof preview.expires_at !== "string") {
    throw new Error("De uitnodiging bevat onvolledige ervaringsgegevens.");
  }
  return {
    runId: preview.run_id,
    title: preview.title,
    description: preview.description,
    steps: preview.steps,
    expiresAt: preview.expires_at
  };
}

/** Accepting an invite records the participant's consent on the server. */
export async function acceptDuoInvitation(token: string, client?: DuoClient | null): Promise<AcceptedDuoInvitation> {
  const activeClient = getClient(client);
  await requireUser(activeClient);
  const tokenHash = await hashDuoInvitationToken(token);
  const { data, error } = await activeClient.rpc("accept_afterhours_experience_invitation", {
    p_token_hash: tokenHash
  });
  if (error) throw new Error("Duo-uitnodiging kon niet worden geaccepteerd: " + error.message);
  if (!data || typeof data !== "object") throw new Error("De server bevestigde de Duo-deelname niet.");

  const accepted = data as Record<string, unknown>;
  if (typeof accepted.invitation_id !== "string" || typeof accepted.run_id !== "string" ||
      accepted.status !== "accepted" || typeof accepted.accepted_at !== "string") {
    throw new Error("De server gaf geen geldige bevestiging van Duo-deelname terug.");
  }
  return {
    invitationId: accepted.invitation_id,
    runId: accepted.run_id,
    status: "accepted",
    acceptedAt: accepted.accepted_at
  };
}

/** Revoke an unused invitation owned by the signed-in host. */
export async function revokeDuoInvitation(invitationId: string, client?: DuoClient | null): Promise<void> {
  const activeClient = getClient(client);
  const safeInvitationId = requireUuid(invitationId, "Uitnodigings-ID");
  const userId = await requireUser(activeClient);
  const { data, error } = await activeClient
    .from("afterhours_experience_invitations")
    .update({ status: "revoked" })
    .eq("id", safeInvitationId)
    .eq("inviter_user_id", userId)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();
  if (error) throw new Error("Duo-uitnodiging kon niet worden ingetrokken: " + error.message);
  if (!data) throw new Error("Deze uitnodiging is al gebruikt, verlopen of niet van dit account.");
}
