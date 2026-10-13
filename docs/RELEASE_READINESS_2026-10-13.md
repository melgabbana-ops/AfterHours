# AFTER HOURS release-readiness audit (2026-10-13)

## Guardrails
- Do not apply migrations or alter production schema/data as part of this audit.
- Do not enable real checkout or purchase anything.
- Keep release changes in a reviewable branch until CI and manual checks pass.

## Production baseline
- GitHub `main`: `e37841f1bab73b8fdbfbcf9da1a9501c775ef296`
- Vercel production deployment for that commit: `READY`.
- GitHub reports Vercel status success. The commit-specific Actions helper returned no PR-triggered runs; this is not evidence of failure. Inspect workflow runs directly if build status is needed.

## Supabase migration reconciliation
The live migration ledger contains 14 migrations. The repository has 14 migration files. Their names differ, but the versions are in the same chronological order and the names map as follows:

| Live migration name | Repository migration file |
|---|---|
| `production_schema_base` | `20261007_initial_schema.sql` |
| `profile_update_privilege_hardening` | `20261008_profile_update_privilege_hardening.sql` |
| `allow_renewed_consent` | `20261009090000_allow_renewed_consent.sql` |
| `consent_event_ordering` | `20261009090100_consent_event_ordering.sql` |
| `completed_session_immutable` | `20261009090200_completed_session_immutable.sql` |
| `consent_revocation_stops_session` | `20261009090300_consent_revocation_stops_session.sql` |
| `private_media_bucket` | `20261009090400_private_media_bucket.sql` |
| `session_activation_consent_guard` | `20261009090500_session_activation_consent_guard.sql` |
| `completion_revokes_consent` | `20261009090600_completion_revokes_consent.sql` |
| `mission_progress` | `20261012090000_mission_progress.sql` |
| `private_video_capture` | `20261012100000_private_video_capture.sql` |
| `xp_event_ledger` | `20261012110000_xp_event_ledger.sql` |
| `session_mood_history` | `20261012120000_session_mood_history.sql` |
| `revoke_anon_session_rpc` | `20261013010000_revoke_anon_session_rpc.sql` |

This looks like a ledger naming/version convention difference rather than a count mismatch. **Do not replay or rename live migrations.** Before any future migration, verify each pair's contents and compare the live schema with the expected schema; resolve only through a reviewed, non-destructive reconciliation plan.

## Security-definer RPC review
A read-only catalog query confirmed for the nine flagged public functions:
- `anon` cannot execute them.
- `authenticated` can execute them, as expected for client RPCs.
- Every function has a fixed `search_path=public`.
- The inspected functions check authentication and/or scope work to `auth.uid()`; `admin_dashboard_metrics()` checks `is_app_admin()` before returning counts.

The Supabase linter warning is therefore a generic warning about authenticated execution, not proof of an anonymous-access vulnerability. Keep the RPCs owner-scoped, and add automated tests for cross-account session IDs, mission ownership, mood history ownership, and non-admin access to admin metrics before production release.

## Remaining Supabase performance advisories
Read-only advisors currently report:
- 11 RLS policies where auth helpers are re-evaluated per row. A future reviewed performance migration may wrap `auth.uid()` / helper calls as `(select auth.uid())` / `(select public.is_app_admin())` without changing policy intent.
- Two missing FK indexes on `public.admin_audit_log(actor_id)` and `public.admin_audit_log(target_session_id)`.

These are performance recommendations, not emergency authorization failures. No database changes were made during this audit.

## Release blockers still requiring verification
1. Installed-app icons: create true 192×192 and 512×512 PNG exports from the approved master artwork, verify Android maskable safe zones, and test iOS home-screen behavior. SVG favicon switching alone does not update installed icons.
2. Assignment camera PR #10: branch `feature/assignment-camera-overlay` is behind `main`. Rebase/synchronize in a dedicated branch, rerun tests, and test permission denial, retake/discard, audio/video sync, upload failure, and cross-account private media access on physical iOS/Android devices before merge.
3. Payments: remain disabled until provider approval, server-side checkout/webhook verification, and required business/legal setup are confirmed.
4. Moodboard and responsive UI: build success is not visual acceptance. Review the key flows at small iPhone widths, tablet widths, safe-area insets, and reduced-motion settings.

## Validation commands
Run on the release branch:
- `npm ci`
- `npm test -- --run` (or the repository's configured test command)
- `npm run build`

Do not mark the release ready until CI passes and the manual device/security checks above are recorded.
