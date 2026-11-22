# AFTER HOURS production backend

AFTER HOURS uses Supabase/PostgreSQL for account-scoped progress, session safety, consent evidence and private media.

## Migration history

The version prefix in each file under `supabase/migrations/` must match the version recorded in the connected production project's Supabase migration ledger. The current production ledger has 28 entries. The file names below have been aligned to that ledger without changing SQL contents or applying any database change.

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
| `20261118205045` | `20261118205045_story_chapter_account_sync.sql` |
| `20261120234051` | `20261120234051_afterhours_world_modules.sql` |
| `20261120234949` | `20261120234949_afterhours_experience_interaction_log.sql` |
| `20261120235944` | `20261120235944_afterhours_shared_experience_invitations.sql` |
| `20261121000055` | `20261121000055_afterhours_participant_consent_withdrawal.sql` |
| `20261121000106` | `20261121000106_afterhours_shared_run_consent_guard.sql` |
| `20261121000215` | `20261121000215_afterhours_revoke_shared_consents_on_pause_or_end.sql` |
| `20261121000315` | `20261121000315_afterhours_invitation_accepted_user_index.sql` |
| `20261121000345` | `20261121000345_afterhours_experience_invitation_preview.sql` |
| `20261121000429` | `20261121000429_afterhours_invite_requires_paused_run.sql` |
| `20261121001151` | `20261121001151_afterhours_consent_rls_recursion_guard.sql` |

Run `npm run check:migrations` to verify that the checked-in file list still matches this deployed baseline. When adding a migration, use the version that was actually recorded by the reviewed migration workflow, then update the guard and this table in the same change. Never rename or replay an already-applied production migration casually.

For a new Supabase project, review and apply migrations in version order before enabling remote persistence. If a database was originally created by manually applying SQL, inspect its live schema and migration registry and reconcile/baseline history deliberately before using `supabase db push`. Do not blindly replay a base schema against an existing database.

## Story Mode account sync

`20261118205045_story_chapter_account_sync.sql` is recorded in the connected production migration ledger and has been applied successfully. Chapter completion is account-owned, authenticated through `auth.uid()`, limited to the seven approved chapter IDs, and idempotent. Local progress remains available when no account is signed in.

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

## Experience-run activation and owner consent

New experience runs must be inserted as `ready` drafts at step zero. The owner consent record is persisted before the guarded `ready` → `active` transition, and `started_at` is written only when that activation succeeds. If consent persistence or activation fails, the client attempts to remove the inactive draft and reports when that cleanup cannot be confirmed.

The matching database insert trigger and RLS restriction are documented in `supabase/proposals/20261123_afterhours_experience_run_insert_consent_guard.sql`. This is a proposal only, not a production migration. Until it is reviewed and applied through the approved migration workflow, a direct authenticated API insert could still bypass the client sequence; keep the rollout gated and do not claim the server-side insert restriction is live.

## Private media storage

The `after-hours-private-media` bucket must remain private. Object paths use `<auth.uid()>/<session-id>/<filename>`; storage policies must scope access to the first folder and enforce upload limits. Use authenticated storage operations or short-lived signed URLs. Never make this bucket public.

## Shared experience invitations and participant consent

The shared-experience migrations add one-time invitation links for an existing paused experience. The host must pause first and keep the experience paused while the recipient reviews and accepts. Only a SHA-256 token hash is stored; raw invitation tokens exist only in the sender's browser and shared link. The recipient must sign in with their own account, preview the exact scene title, description and steps, and explicitly accept. Acceptance records a separate consent row for that account.

Participants can withdraw their consent. The withdrawal RPC revokes their consent and stops the shared run in the same database transaction. A database activation guard prevents the owner from reactivating a run after any accepted participant has withdrawn; fresh consent must be obtained through a new invitation. Invitation rows are visible only to their inviter, while accepted participants can read the run under the consent-based RLS policy. The participant-facing UI is read-only for the host's run and includes an explicit withdraw-and-stop action. Pausing, completing, or stopping a run revokes every participant's consent. Resuming requires the owner to reconfirm and every invited participant to accept a fresh invitation.

The consent RLS policies use a narrowly scoped helper in the non-exposed `private` schema to verify run ownership without recursively evaluating the run and consent policies. The helper checks the authenticated identity against the run owner and is executable only by authenticated clients through the policy path. A live two-account database test covers invitation preview, acceptance, participant read-only access, owner resume, and participant withdrawal.
