# AFTER HOURS production backend

AFTER HOURS uses Supabase/PostgreSQL for account-scoped progress, session safety, consent evidence and private media.

## Migration history

The version prefix in each file under `supabase/migrations/` must match the version recorded in the connected production project's Supabase migration ledger. The current production ledger has 17 entries. The file names below have been aligned to that ledger without changing SQL contents or applying any database change.

| Production ledger version | Migration file |
|---|---|
| `20261013005814` | `20261013005814_production_schema_base.sql` |
| `20261013005819` | `20261013005819_profile_update_privilege_hardening.sql` |
| `20261013005821` | `20261013005821_allow_renewed_consent.sql` |
| `20261013005823` | `20261013005823_consent_event_ordering.sql` |
| `20261013005825` | `20261013005825_completed_session_immutable.sql` |
| `20261013005827` | `20261013005827_consent_revocation_stops_session.sql` |
| `20261013005829` | `20261013005829_private_media_bucket.sql` |
| `20261013005832` | `20261013005832_session_activation_consent_guard.sql` |
| `20261013005834` | `20261013005834_completion_revokes_consent.sql` |
| `20261013005837` | `20261013005837_mission_progress.sql` |
| `20261013005839` | `20261013005839_private_video_capture.sql` |
| `20261013005844` | `20261013005844_xp_event_ledger.sql` |
| `20261013005848` | `20261013005848_session_mood_history.sql` |
| `20261013005913` | `20261013005913_revoke_anon_session_rpc.sql` |
| `20261013110933` | `20261013110933_rls_policy_performance.sql` |
| `20261013110946` | `20261013110946_merge_experience_rounds_read_policies.sql` |
| `20261015114512` | `20261015114512_restore_atomic_completion_consent.sql` |

Run `npm run check:migrations` to verify that the checked-in file list still matches this deployed baseline. When adding a migration, use the version that was actually recorded by the reviewed migration workflow, then update the guard and this table in the same change. Never rename or replay an already-applied production migration casually.

For a new Supabase project, review and apply migrations in version order before enabling remote persistence. If a database was originally created by manually applying SQL, inspect its live schema and migration registry and reconcile/baseline history deliberately before using `supabase db push`. Do not blindly replay a base schema against an existing database.

## Security model

- The browser may use the public Supabase client key, but must never receive a service-role or secret key.
- Row Level Security (RLS) scopes normal users to their own profiles, sessions, consent, mission progress, mood history and private-media paths.
- Browser writes to XP, level, session counters, consent state and session completion must remain server-authoritative through reviewed RPCs.
- Admin operations require the explicit `public.app_admins` allowlist, a server-side role check and audit logging. Never allow users to grant themselves admin access.
- A `SECURITY DEFINER` finding is not an instruction to mass-revoke RPC permissions. Review each function's authorization/ownership checks and intended client use before changing grants.

## Runtime configuration

Configure:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

The Supabase adapter is wired into the client. Local storage remains available for UI continuity, but it is not authoritative for XP, history, consent or session completion.

## Consent and session safety

Consent is session-scoped and auditable. Revocation must stop an active or paused session in the same database transaction. Session completion must revoke consent atomically with the XP award and completion state. Regression checks and live migration state must be reviewed before release.

## Private media storage

The `after-hours-private-media` bucket must remain private. Object paths use `<auth.uid()>/<session-id>/<filename>`; storage policies must scope access to the first folder and enforce upload limits. Use authenticated storage operations or short-lived signed URLs. Never make this bucket public.
