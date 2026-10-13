import { supabase, supabaseConfigured } from "./supabase";

export type MissionKind = "daily" | "weekly" | "special";
export interface RemoteMissionProgress {
  mission_id: string;
  mission_kind: MissionKind;
  reward_points: number;
  period_key: string;
  completed: boolean;
  completed_at: string | null;
}

export interface MissionCompletion {
  mission_id: string;
  mission_kind: MissionKind;
  reward_points: number;
  period_key: string;
  already_completed: boolean;
  completed_at: string | null;
}

export async function loadMissionProgress(): Promise<RemoteMissionProgress[] | null> {
  if (!supabaseConfigured || !supabase) return null;
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!auth.user) return [];
  const { data, error } = await supabase.rpc("get_mission_progress");
  if (error) throw error;
  if (!Array.isArray(data)) throw new Error("Ongeldig antwoord van missieopslag.");
  return data.filter((row: unknown): row is RemoteMissionProgress => {
    if (!row || typeof row !== "object") return false;
    const item = row as Record<string, unknown>;
    return typeof item.mission_id === "string"
      && (item.mission_kind === "daily" || item.mission_kind === "weekly" || item.mission_kind === "special")
      && Number.isInteger(item.reward_points)
      && typeof item.period_key === "string"
      && typeof item.completed === "boolean"
      && (item.completed_at === null || typeof item.completed_at === "string");
  });
}

export async function loadDailyRitualDates(): Promise<string[] | null> {
  if (!supabaseConfigured || !supabase) return null;
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!auth.user) return null;
  // RLS limits these rows to the signed-in owner. The UTC period key matches
  // the server's complete_mission() clock, so streaks are consistent across devices.
  const { data, error } = await supabase
    .from("mission_progress")
    .select("period_key")
    .eq("mission_id", "daily-intention")
    .order("completed_at", { ascending: false })
    .limit(120);
  if (error) throw error;
  return (data ?? [])
    .map((row) => row.period_key)
    .filter((value): value is string => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

export async function completeMissionRemote(missionId: string): Promise<MissionCompletion> {
  if (!supabaseConfigured || !supabase) throw new Error("Serveropslag voor missies is niet geconfigureerd.");
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!auth.user) throw new Error("Log in om missies aan je account te koppelen.");
  const allowed = new Set([
    "daily-intention","daily-reflection","daily-aftercare",
    "weekly-boundaries","weekly-discovery","weekly-care",
    "special-consent","special-explorer"
  ]);
  if (!allowed.has(missionId)) throw new Error("Onbekende missie.");
  const { data, error } = await supabase.rpc("complete_mission", { p_mission_id: missionId });
  if (error) throw error;
  const row = data as Partial<MissionCompletion> | null;
  if (!row || row.mission_id !== missionId || !Number.isInteger(row.reward_points) || typeof row.period_key !== "string") {
    throw new Error("Missie kon niet veilig worden bevestigd op de server.");
  }
  return row as MissionCompletion;
}
