import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const directory = join(dirname(fileURLToPath(import.meta.url)), "..", "supabase", "migrations");
const expectedApplied = [
  "20261013005814_production_schema_base.sql",
  "20261013005819_profile_update_privilege_hardening.sql",
  "20261013005821_allow_renewed_consent.sql",
  "20261013005823_consent_event_ordering.sql",
  "20261013005825_completed_session_immutable.sql",
  "20261013005827_consent_revocation_stops_session.sql",
  "20261013005829_private_media_bucket.sql",
  "20261013005832_session_activation_consent_guard.sql",
  "20261013005834_completion_revokes_consent.sql",
  "20261013005837_mission_progress.sql",
  "20261013005839_private_video_capture.sql",
  "20261013005844_xp_event_ledger.sql",
  "20261013005848_session_mood_history.sql",
  "20261013005913_revoke_anon_session_rpc.sql",
  "20261013110933_rls_policy_performance.sql",
  "20261013110946_merge_experience_rounds_read_policies.sql",
  "20261015114512_restore_atomic_completion_consent.sql",
  "20261118205045_story_chapter_account_sync.sql",
  "20261120234051_afterhours_world_modules.sql",
  "20261120234949_afterhours_experience_interaction_log.sql",
  "20261120235944_afterhours_shared_experience_invitations.sql",
  "20261121000055_afterhours_participant_consent_withdrawal.sql",
  "20261121000106_afterhours_shared_run_consent_guard.sql",
  "20261121000215_afterhours_revoke_shared_consents_on_pause_or_end.sql",
  "20261121000315_afterhours_invitation_accepted_user_index.sql",
  "20261121000345_afterhours_experience_invitation_preview.sql",
  "20261121000429_afterhours_invite_requires_paused_run.sql",
  "20261121001151_afterhours_consent_rls_recursion_guard.sql"
];
const expectedPending = ["20261121032837_boss_mode_xp_rewards.sql"];
const actual = readdirSync(directory).filter((name) => name.endsWith(".sql")).sort();
const pendingSet = new Set(expectedPending);
const actualApplied = actual.filter((name) => !pendingSet.has(name));
const missingApplied = expectedApplied.filter((name) => !actualApplied.includes(name));
const unexpectedApplied = actualApplied.filter((name) => !expectedApplied.includes(name));
const missingPending = expectedPending.filter((name) => !actual.includes(name));
const unexpected = actual.filter((name) => !expectedApplied.includes(name) && !pendingSet.has(name));
const versions = actual.map((name) => {
  const separator = name.indexOf("_");
  const version = separator < 0 ? "" : name.slice(0, separator);
  return /^[0-9]{14}$/.test(version) ? version : null;
}).filter(Boolean);
const duplicates = versions.filter((version, index) => versions.indexOf(version) !== index);

if (missingApplied.length || unexpectedApplied.length || missingPending.length || unexpected.length || duplicates.length || versions.length !== actual.length) {
  console.error("Supabase migration inventory mismatch.");
  if (missingApplied.length) console.error("Missing applied-baseline files:", missingApplied.join(", "));
  if (unexpectedApplied.length) console.error("Files not recorded in the applied baseline:", unexpectedApplied.join(", "));
  if (missingPending.length) console.error("Missing reviewed pending migrations:", missingPending.join(", "));
  if (unexpected.length) console.error("Unreviewed migration files:", unexpected.join(", "));
  if (duplicates.length) console.error("Duplicate migration versions:", [...new Set(duplicates)].join(", "));
  if (versions.length !== actual.length) console.error("Every migration must use the 14-digit version_name.sql format.");
  console.error("Move a pending migration into the applied baseline only after its deployment is explicitly authorized and verified.");
  process.exit(1);
}

console.log(`Supabase migration inventory verified: ${expectedApplied.length} applied production-baseline files + ${expectedPending.length} reviewed pending migration(s) not deployed.`);
