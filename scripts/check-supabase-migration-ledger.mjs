import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const directory = join(dirname(fileURLToPath(import.meta.url)), "..", "supabase", "migrations");
const expected = [
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
  "20261015114512_restore_atomic_completion_consent.sql"
];
const actual = readdirSync(directory).filter((name) => name.endsWith(".sql")).sort();
const baseline = [...expected].sort();
const missing = baseline.filter((name) => !actual.includes(name));
const unexpected = actual.filter((name) => !baseline.includes(name));
const versions = actual.map((name) => { const separator = name.indexOf("_"); const version = separator < 0 ? "" : name.slice(0, separator); return /^[0-9]{14}$/.test(version) ? version : null; }).filter(Boolean);
const duplicates = versions.filter((version, index) => versions.indexOf(version) !== index);

if (missing.length || unexpected.length || duplicates.length || versions.length !== actual.length) {
  console.error("Supabase migration ledger baseline mismatch.");
  if (missing.length) console.error("Missing migration files:", missing.join(", "));
  if (unexpected.length) console.error("Unreviewed migration files:", unexpected.join(", "));
  if (duplicates.length) console.error("Duplicate migration versions:", [...new Set(duplicates)].join(", "));
  if (versions.length !== actual.length) console.error("Every migration must use the 14-digit version_name.sql format.");
  console.error("When adding/reconciling a migration, verify the live Supabase migration ledger and update this baseline plus supabase/README.md in the same reviewed change.");
  process.exit(1);
}

console.log(`Supabase migration filenames match the production ledger baseline (${actual.length} migrations).`);
