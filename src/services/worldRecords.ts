import { supabase, supabaseConfigured } from "./supabase";

export type WorldModule = "director" | "vault" | "dominion" | "sensory" | "invitation" | "ritual" | "club";
export type WorldRecord<T = Record<string, unknown>> = {
  id: string;
  record_key: string;
  payload: T;
  created_at: string;
  updated_at: string;
};
export type ExperienceRunStatus = "ready" | "active" | "paused" | "completed" | "stopped";
export type ExperienceRun = {
  id: string;
  user_id: string;
  scene_key: string;
  scene_snapshot: Record<string, unknown>;
  status: ExperienceRunStatus;
  current_step: number;
  total_steps: number;
  created_at: string;
  updated_at: string;
  started_at: string | null;
  completed_at: string | null;
  interaction_log: Array<{ stepIndex: number; choice: string; at: string }>;
};

async function assertWorldAccount(expectedUserId: string) {
  if (!supabaseConfigured || !supabase) throw new Error("AFTER HOURS account storage is unavailable.");
  if (!expectedUserId) throw new Error("Sign in before saving private AFTER HOURS data.");
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw new Error(error.message);
  if (!user || user.id !== expectedUserId) throw new Error("The signed-in account changed. Reload AFTER HOURS before continuing.");
  return user;
}

export async function loadWorldRecords<T = Record<string, unknown>>(
  module: WorldModule,
  expectedUserId: string,
): Promise<WorldRecord<T>[]> {
  await assertWorldAccount(expectedUserId);
  const { data, error } = await supabase!
    .from("afterhours_world_records")
    .select("id,record_key,payload,created_at,updated_at")
    .eq("user_id", expectedUserId)
    .eq("module", module)
    .order("updated_at", { ascending: false })
    .limit(100);
  if (error) throw new Error(error.message);
  return (data ?? []) as WorldRecord<T>[];
}

export async function saveWorldRecord<T extends Record<string, unknown>>(
  module: WorldModule,
  recordKey: string,
  payload: T,
  expectedUserId: string,
): Promise<WorldRecord<T>> {
  await assertWorldAccount(expectedUserId);
  if (!recordKey.trim() || recordKey.length > 120) throw new Error("Invalid AFTER HOURS record key.");
  const { data, error } = await supabase!
    .from("afterhours_world_records")
    .upsert({
      user_id: expectedUserId,
      module,
      record_key: recordKey,
      payload,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id,module,record_key" })
    .select("id,record_key,payload,created_at,updated_at")
    .single();
  if (error) throw new Error(error.message);
  return data as WorldRecord<T>;
}

export async function deleteWorldRecord(
  module: WorldModule,
  recordKey: string,
  expectedUserId: string,
): Promise<void> {
  await assertWorldAccount(expectedUserId);
  const { error } = await supabase!
    .from("afterhours_world_records")
    .delete()
    .eq("user_id", expectedUserId)
    .eq("module", module)
    .eq("record_key", recordKey);
  if (error) throw new Error(error.message);
}

export async function loadExperienceRuns(expectedUserId: string): Promise<ExperienceRun[]> {
  await assertWorldAccount(expectedUserId);
  const { data, error } = await supabase!
    .from("afterhours_experience_runs")
    .select("id,user_id,scene_key,scene_snapshot,status,current_step,total_steps,created_at,updated_at,started_at,completed_at,interaction_log")
    .order("updated_at", { ascending: false })
    .limit(50);
  if (error) throw new Error(error.message);
  return (data ?? []) as ExperienceRun[];
}

export async function createExperienceRun(args: {
  sceneKey: string;
  sceneSnapshot: Record<string, unknown>;
  totalSteps: number;
  expectedUserId: string;
}): Promise<string> {
  const user = await assertWorldAccount(args.expectedUserId);
  if (!args.sceneKey.trim() || args.totalSteps < 1 || args.totalSteps > 40) throw new Error("Invalid experience scene.");
  const now = new Date().toISOString();
  const { data: run, error } = await supabase!
    .from("afterhours_experience_runs")
    .insert({
      user_id: user.id,
      scene_key: args.sceneKey,
      scene_snapshot: args.sceneSnapshot,
      status: "active",
      current_step: 0,
      total_steps: args.totalSteps,
      interaction_log: [],
      consent_version: "1.0",
      started_at: now,
      updated_at: now,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  const { error: consentError } = await supabase!
    .from("afterhours_experience_run_consents")
    .insert({ run_id: run.id, user_id: user.id, consent_version: "1.0", consented_at: now });
  if (consentError) {
    await supabase!.from("afterhours_experience_runs").delete().eq("id", run.id).eq("user_id", user.id);
    throw new Error("The consent record could not be saved. The scene was not started. " + consentError.message);
  }
  return run.id as string;
}

export async function updateExperienceRun(args: {
  runId: string;
  expectedUserId: string;
  status: Exclude<ExperienceRunStatus, "ready">;
  currentStep: number;
  completed?: boolean;
  interactionLog?: Array<{ stepIndex: number; choice: string; at: string }>;
}): Promise<void> {
  const allowedStatuses: readonly ExperienceRunStatus[] = ["active", "paused", "completed", "stopped"];
  if (!allowedStatuses.includes(args.status)) throw new Error("Invalid experience run status.");

  const isStop = args.status === "stopped";
  if (!isStop) {
    const isCompletion = args.status === "completed";
    const minimumStep = isCompletion ? 1 : 0;
    const maximumStep = isCompletion ? 40 : 39;
    if (!Number.isInteger(args.currentStep) || args.currentStep < minimumStep || args.currentStep > maximumStep) {
      throw new Error("Invalid experience step.");
    }
  }

  await assertWorldAccount(args.expectedUserId);
  const now = new Date().toISOString();
  let updateQuery = supabase!
    .from("afterhours_experience_runs")
    .update({
      status: args.status,
      // STOP must never be blocked by a stale or malformed local progress cursor.
      // Preserve the server's last known step instead of trusting the client.
      ...(!isStop ? { current_step: args.currentStep } : {}),
      updated_at: now,
      ...(args.completed ? { completed_at: now } : {}),
      ...(args.interactionLog ? { interaction_log: args.interactionLog } : {}),
    })
    .eq("id", args.runId)
    .eq("user_id", args.expectedUserId);

  // Enforce the persisted run's actual step count in the same conditional UPDATE.
  // Completion uses the terminal cursor (total_steps); ordinary progress stays below it.
  if (!isStop) {
    updateQuery = args.status === "completed"
      ? updateQuery.eq("total_steps", args.currentStep)
      : updateQuery.gt("total_steps", args.currentStep);
  }

  // Only an active run may advance, pause, or complete. STOP is allowed
  // from active or paused so it can still win after a check-in pause, but a
  // completed or already-stopped run can never be overwritten by a stale tab.
  if (args.status === "stopped") {
    updateQuery = updateQuery.in("status", ["active", "paused"]);
  } else {
    updateQuery = updateQuery.eq("status", "active");
  }
  const { data, error } = await updateQuery.select("id").maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("This experience run changed state or no longer belongs to the signed-in account.");
  if (args.status !== "active") {
    const { error: consentError } = await supabase!
      .from("afterhours_experience_run_consents")
      .update({ revoked_at: now })
      .eq("run_id", args.runId)
      .eq("user_id", args.expectedUserId)
      .is("revoked_at", null);
    if (consentError) throw new Error("The stop was saved, but consent revocation could not be confirmed: " + consentError.message);
  }
}

export async function resumeExperienceRun(args: {
  runId: string;
  expectedUserId: string;
  currentStep: number;
}): Promise<void> {
  // Experience steps are zero-based and scenes are capped at 40 steps.
  // Reject malformed indexes before renewing consent or making any database write.
  if (!Number.isInteger(args.currentStep) || args.currentStep < 0 || args.currentStep >= 40) {
    throw new Error("Invalid experience step.");
  }
  await assertWorldAccount(args.expectedUserId);
  const now = new Date().toISOString();
  const { data: consent, error: consentError } = await supabase!
    .from("afterhours_experience_run_consents")
    .update({ consented_at: now, revoked_at: null })
    .eq("run_id", args.runId)
    .eq("user_id", args.expectedUserId)
    .select("id")
    .maybeSingle();
  if (consentError) throw new Error(consentError.message);
  if (!consent) throw new Error("Fresh consent could not be confirmed. This scene remains paused.");
  const { data, error } = await supabase!
    .from("afterhours_experience_runs")
    .update({ status: "active", current_step: args.currentStep, updated_at: now })
    .eq("id", args.runId)
    .eq("user_id", args.expectedUserId)
    // A fresh consent record must never revive a completed or stopped run.
    .eq("status", "paused")
    // A paused run can resume only before its persisted terminal cursor.
    .gt("total_steps", args.currentStep)
    .select("id")
    .maybeSingle();
  if (error || !data) {
    await supabase!
      .from("afterhours_experience_run_consents")
      .update({ revoked_at: now })
      .eq("run_id", args.runId)
      .eq("user_id", args.expectedUserId);
    throw new Error(error?.message ?? "This experience run could not be resumed.");
  }
}

export async function deleteExperienceRun(runId: string, expectedUserId: string): Promise<void> {
  await assertWorldAccount(expectedUserId);
  const { error } = await supabase!
    .from("afterhours_experience_runs")
    .delete()
    .eq("id", runId)
    .eq("user_id", expectedUserId);
  if (error) throw new Error(error.message);
}


export type ExperienceInvitation = {
  id: string;
  run_id: string;
  token_hash: string;
  status: "pending" | "accepted" | "revoked" | "expired";
  accepted_at: string | null;
  expires_at: string;
  created_at: string;
};

export async function loadExperienceInvitations(expectedUserId: string): Promise<ExperienceInvitation[]> {
  await assertWorldAccount(expectedUserId);
  const { data, error } = await supabase!
    .from("afterhours_experience_invitations")
    .select("id,run_id,token_hash,status,accepted_at,expires_at,created_at")
    .eq("inviter_user_id", expectedUserId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw new Error(error.message);
  return (data ?? []) as ExperienceInvitation[];
}

export async function createExperienceInvitation(args: {
  runId: string;
  tokenHash: string;
  expectedUserId: string;
}): Promise<ExperienceInvitation> {
  await assertWorldAccount(args.expectedUserId);
  if (!/^[a-f0-9]{64}$/.test(args.tokenHash)) throw new Error("Invalid invitation token hash.");
  const { data, error } = await supabase!
    .from("afterhours_experience_invitations")
    .insert({
      run_id: args.runId,
      inviter_user_id: args.expectedUserId,
      token_hash: args.tokenHash,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    })
    .select("id,run_id,token_hash,status,accepted_at,expires_at,created_at")
    .single();
  if (error) throw new Error(error.message);
  return data as ExperienceInvitation;
}

export async function revokeExperienceInvitation(invitationId: string, expectedUserId: string): Promise<void> {
  await assertWorldAccount(expectedUserId);
  const { data, error } = await supabase!
    .from("afterhours_experience_invitations")
    .update({ status: "revoked" })
    .eq("id", invitationId)
    .eq("inviter_user_id", expectedUserId)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("This invitation is no longer pending or does not belong to this account.");
}

export async function acceptExperienceInvitation(tokenHash: string, expectedUserId: string): Promise<{ invitation_id: string; run_id: string; status: string; accepted_at: string }> {
  await assertWorldAccount(expectedUserId);
  if (!/^[a-f0-9]{64}$/.test(tokenHash)) throw new Error("This invitation link is invalid.");
  const { data, error } = await supabase!.rpc("accept_afterhours_experience_invitation", { p_token_hash: tokenHash });
  if (error) throw new Error(error.message);
  return data as { invitation_id: string; run_id: string; status: string; accepted_at: string };
}


export async function withdrawExperienceConsent(runId: string, expectedUserId: string): Promise<void> {
  await assertWorldAccount(expectedUserId);
  const { error } = await supabase!.rpc("withdraw_afterhours_experience_consent", { p_run_id: runId });
  if (error) throw new Error(error.message);
}


export type ExperienceInvitationPreview = {
  run_id: string;
  title: string;
  description: string;
  steps: string[];
  expires_at: string;
};

export async function previewExperienceInvitation(tokenHash: string, expectedUserId: string): Promise<ExperienceInvitationPreview> {
  await assertWorldAccount(expectedUserId);
  if (!/^[a-f0-9]{64}$/.test(tokenHash)) throw new Error("This invitation link is invalid.");
  const { data, error } = await supabase!.rpc("preview_afterhours_experience_invitation", { p_token_hash: tokenHash });
  if (error) throw new Error(error.message);
  return data as ExperienceInvitationPreview;
}
