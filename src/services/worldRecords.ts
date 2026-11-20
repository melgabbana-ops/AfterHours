import { supabase, supabaseConfigured } from "./supabase";

export type WorldModule = "director" | "vault" | "dominion" | "sensory" | "invitation" | "ritual" | "club";
export type WorldRecord<T = Record<string, unknown>> = {
  id: string;
  record_key: string;
  payload: T;
  created_at: string;
  updated_at: string;
};
export type ExperienceRunStatus = "active" | "paused" | "completed" | "stopped";
export type ExperienceRun = {
  id: string;
  scene_key: string;
  scene_snapshot: Record<string, unknown>;
  status: ExperienceRunStatus;
  current_step: number;
  total_steps: number;
  created_at: string;
  updated_at: string;
  started_at: string | null;
  completed_at: string | null;
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
    .select("id,scene_key,scene_snapshot,status,current_step,total_steps,created_at,updated_at,started_at,completed_at")
    .eq("user_id", expectedUserId)
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
  status: ExperienceRunStatus;
  currentStep: number;
  completed?: boolean;
}): Promise<void> {
  await assertWorldAccount(args.expectedUserId);
  const now = new Date().toISOString();
  const { data, error } = await supabase!
    .from("afterhours_experience_runs")
    .update({
      status: args.status,
      current_step: args.currentStep,
      updated_at: now,
      ...(args.completed ? { completed_at: now } : {}),
    })
    .eq("id", args.runId)
    .eq("user_id", args.expectedUserId)
    .select("id")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("This experience run no longer belongs to the signed-in account.");
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
