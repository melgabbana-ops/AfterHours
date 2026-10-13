# AFTER HOURS release-readiness audit (2026-10-13)

## Guardrails
- Do not apply migrations or alter production schema/data as part of this audit.
- Do not enable real checkout or purchase anything.
- Keep release changes in a reviewable branch until CI and manual checks pass.

## Current deployment baseline
- Current GitHub `main`: `3fc264f326231f6e5b99cff46dd69257a51d9854`.
- Current Vercel production deployment for that commit: `READY` at `https://after-hours-4bbs1rw05-mel-gabbana-6739.vercel.app`.
- The two open draft branches have current READY previews:
  - Camera assignment capture, head `78ed32b3cfa059bcb0650f4b16439c48c9e83149`: `https://after-hours-pih74z4m8-mel-gabbana-6739.vercel.app`.
  - Release readiness and seasonal icons, head `e6aeecfeeb713aeaffe171b2318c908c49e5a17e`: `https://after-hours-iw67wzdo8-mel-gabbana-6739.vercel.app`.
- GitHub Actions unit tests and production build passed for both current draft heads. Preview readiness and green CI do not replace physical-device and visual acceptance tests.

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

The repository's current `main` includes `20261013110933_rls_policy_performance.sql`, which optimizes 11 RLS policies by wrapping auth/helper calls in scalar selects and adds indexes on `public.admin_audit_log(actor_id)` and `public.admin_audit_log(target_session_id)`. This file is present in Git; this audit did **not** apply it to the live Supabase database. Reconcile the migration ledger before any future apply; do not replay, rename, or manually mark migrations applied without a reviewed plan.

## Security-definer RPC review
The Supabase security advisor currently reports nine authenticated-execution warnings for `admin_dashboard_metrics`, `complete_mission`, `complete_session`, `get_mission_progress`, `get_session_mood_history`, `is_app_admin`, `record_session_mood`, `set_consent_state`, and `set_session_state`.

Read-only catalog/function-definition review confirms:
- The earlier audit found `anon` cannot execute these RPCs; `authenticated` can.
- Functions use a fixed `search_path=public`.
- The inspected implementations include authentication checks and owner-scoped session/mood/mission access; `admin_dashboard_metrics()` checks `is_app_admin()`.
- These findings do not prove an anonymous-access vulnerability, but authenticated-execution warnings still deserve verification.

Before production release, add/run negative tests for cross-account session IDs, mission ownership, mood-history ownership, consent/session-state changes by non-owners, and non-admin access to admin metrics. Do not change live grants or function definitions based on a generic lint warning alone.

## Remaining Supabase performance advisories
The latest performance advisor reports 13 INFO-level unused-index findings, including the two audit-log indexes now present in the migration file. An unused-index notice is not a security issue and may reflect a young/low-traffic database. Do not drop indexes blindly. Recheck after representative traffic and compare query plans before considering index removal.

## Release blockers still requiring verification
1. **Installed-app icons:** seasonal SVG paths referenced in the favicon script exist in the PR branch. The browser favicon is date-switched, but installed iOS/Android icons remain the existing PNGs. Create raster exports from the approved master artwork, verify Android maskable safe zones, and test installation on devices. The current SVG master is first-pass brand-inspired artwork, not yet confirmed as the exact approved logo.
2. **Assignment camera PR #10:** branch `feature/assignment-camera-overlay` is synchronized with current `main` (0 commits behind). The current preview is READY and CI passes. Still test camera permission denial, audio/video sync, retake/discard, upload failures, and private storage ownership on physical iOS/Android devices before merge.
3. **Payments:** remain disabled until provider approval, server-side checkout/webhook verification, and required business/legal setup are confirmed.
4. **Moodboard and responsive UI:** build success is not visual acceptance. Review key flows at small iPhone widths, tablet widths, safe-area insets, and reduced-motion settings.
5. **Migration application:** the RLS/index optimization migration is in Git but was not applied to the live database during this audit. Confirm migration-ledger/schema alignment before any deployment that applies database migrations.

## Validation commands
Run on each release branch:
- `npm ci`
- `npm test -- --run` (or the repository's configured test command)
- `npm run build`

Do not mark the release ready until CI passes and the manual device/security checks above are recorded.
