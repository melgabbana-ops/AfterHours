import { supabase, supabaseConfigured } from "./supabase";
import { KINK_TEST_REWARD_XP, KINK_TEST_VERSION } from "../kinkTest";

export interface KinkTestReward {
  xpEarned: number;
  alreadyAwarded: boolean;
  totalXp: number | null;
}

type KinkTestRewardPayload = { xp_earned: number; already_awarded: boolean; total_xp: number | null };\n\nexport function isKinkTestRewardPayload(value: unknown): value is KinkTestRewardPayload {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const row = value as Record<string, unknown>;
  return typeof row.xp_earned === "number"
    && Number.isInteger(row.xp_earned)
    && row.xp_earned >= 0
    && row.xp_earned <= KINK_TEST_REWARD_XP
    && typeof row.already_awarded === "boolean"
    && (row.total_xp === null || (typeof row.total_xp === "number" && Number.isInteger(row.total_xp) && row.total_xp >= 0));
}

export async function awardKinkTestCompletion(): Promise<KinkTestReward> {
  if (!supabaseConfigured || !supabase) throw new Error("Account-XP is niet geconfigureerd.");
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!auth.user) throw new Error("Log in om Kink Test XP aan je account toe te voegen.");
  const { data, error } = await supabase.rpc("award_afterhours_kink_test_completion", {
    p_test_version: KINK_TEST_VERSION,
  });
  if (error) throw error;
  if (!isKinkTestRewardPayload(data)) throw new Error("De server heeft geen geldige Kink Test-beloning bevestigd.");
  return {
    xpEarned: data.xp_earned,
    alreadyAwarded: data.already_awarded,
    totalXp: data.total_xp,
  };
}
