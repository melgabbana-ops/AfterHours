# AFTER HOURS — Verified Project Audit
**Audit date:** 2026-10-14  
**Scope:** Read-only inspection of the existing GitHub repository, Vercel production deployment metadata, and Supabase project/advisors/migration history.  
**Rule:** This document records only observations made during this audit. A repository file, schema object, or deployment state is not proof that an end-user feature works end-to-end.

## Executive status

- **Repository:** `melgabbana-ops/AfterHours`; default branch `main`; repository is public; connected GitHub access reports pull/push/admin permissions.
- **Stack verified in package.json:** React 18, TypeScript, Vite, Supabase JS, Vitest. Available scripts are `dev`, `build` (`tsc -b && vite build`), `preview`, and `test` (`vitest run`).
- **Vercel:** project `after-hours`, framework Vite. Deployment queried on 2026-10-14 reports production target `READY`, branch `main`, commit `075a4d1e455e42a69c6ec16a58299ec140629d1f`, message `Design: unify safety, legal and social studio screens`. Aliases include https://after-hours-hazel-eight.vercel.app. This confirms deployment metadata only, not manual device acceptance.
- **Supabase:** project ref `yniocgfghcowjilqaock`, region `eu-central-1`, status `ACTIVE_HEALTHY`, PostgreSQL 17.
- **Roadmap PR:** [#15](https://github.com/melgabbana-ops/AfterHours/pull/15) remains open and draft, base `main`, head `docs/complete-build-roadmap`; it is documentation-only and must not be mistaken for merged application implementation.
- **Current build/test result:** NOT RUN as part of this read-only connector audit. Do not infer passing CI from deployment READY.
- **Production writes:** none performed during this audit. No database migration, payment activation, or production-code change was made.

## Verified repository and infrastructure inventory

### Source and branches
Observed branches include `main`, `docs/complete-build-roadmap`, `release/after-hours-master-spec`, `feature/assignment-camera-overlay`, `feature/missions-updates-maintenance`, `fix/account-scoped-achievements`, `fix/admin-audit-fk-indexes-2026-10-13`, `fix/brand-consistent-app-icons`, `fix/release-readiness-2026-10-13`, `fix/session-sync-ownership-errors`, `perf/lazy-load-feature-screens`, `perf/optimize-rls-policy-plans`, and `perf/split-production-bundles`. Branch existence does not imply merge, passing checks, or production deployment.

### Application scripts and dependencies
The root `package.json` confirms React 18.3, React DOM 18.3, TypeScript 5.7, Vite 5.4, Vitest 2.1, and `@supabase/supabase-js` 2.57. There is no separate lint or typecheck script in the inspected package manifest; typechecking is part of `npm run build`.

### Database migration history
The connected Supabase migration listing includes:
- `production_schema_base`
- `profile_update_privilege_hardening`
- `allow_renewed_consent`
- `consent_event_ordering`
- `completed_session_immutable`
- `consent_revocation_stops_session`
- `private_media_bucket`
- `session_activation_consent_guard`
- `completion_revokes_consent`
- `mission_progress`
- `private_video_capture`
- `xp_event_ledger`
- `session_mood_history`
- `revoke_anon_session_rpc`
- `rls_policy_performance`
- `merge_experience_rounds_read_policies`

Migration history confirms applied migration records; it does not alone verify every live policy or behavior.

### Edge Functions
The Supabase Edge Function listing returned no functions. This is a verified connector result at audit time. It does not rule out other backend mechanisms such as SQL RPCs or Vercel functions.

## Security review findings

### P0 — Review nine SECURITY DEFINER RPCs before expanding dependent functionality
The Supabase Security Advisor reported nine functions executable by the `authenticated` role while marked `SECURITY DEFINER`:
- `admin_dashboard_metrics()`
- `complete_mission(text)`
- `complete_session(uuid, integer)`
- `get_mission_progress()`
- `get_session_mood_history(integer)`
- `is_app_admin()`
- `record_session_mood(uuid, text, text)`
- `set_consent_state(uuid, text, timestamptz, timestamptz)`
- `set_session_state(uuid, text, integer, timestamptz, timestamptz)`

A function being callable is not by itself proof of an exploitable vulnerability. Read-only definition review observed owner `postgres`, `search_path=public`, and explicit authenticated EXECUTE grants. Several functions perform useful identity/ownership checks (for example, session functions compare `profile_id` to `auth.uid()`; mission and mood functions derive the user from `auth.uid()`; admin metrics calls `is_app_admin()`). These checks still require test coverage against forged IDs, invalid transitions, cross-user access, anonymous calls, role changes, and function privilege semantics.

**Next safe action:** review each function's intended client caller, grants, ownership check, row locks, input validation, search-path safety, and result exposure. Change one function family at a time in a reviewed migration on a development branch. Do not blindly revoke all authenticated execution: that could break consent, session, and progression flows.

Advisor reference: https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable

### P1 — Performance advisor
The performance advisor returned 13 informational `unused_index` findings, including indexes on sessions, session history, consent records, experience rounds, XP ledger, mood events, and admin audit logs. Do not drop indexes solely because they have not yet been used; first consider workload age, expected query patterns, constraints, and query plans. The earlier roadmap also calls out duplicate permissive SELECT policies and missing admin-audit foreign-key indexes for targeted validation. Reconcile those claims against the current database before editing.

## Feature status discipline

| Area | Audit status | Evidence / next step |
|---|---|---|
| React/TypeScript/Vite foundation | Verified present | Root package manifest |
| Vitest test command | Verified configured; execution unverified | Run `npm test` in CI/working tree and record output |
| Production deployment | Verified READY metadata | Manual iPhone/Android route checks remain |
| Supabase project | Verified ACTIVE_HEALTHY | Live policy/behavior checks remain |
| Session/consent/XP database foundations | Migration records verified | End-to-end and adversarial tests required |
| AI Domme / OpenAI server integration | Not verified | Inspect server-side integration and secrets configuration; do not expose credentials |
| Payment provider / checkout | Not verified; roadmap says intentionally absent | Keep disabled until merchant/provider/legal setup and webhook tests pass |
| Camera overlay on real iPhone | Not verified | Device test required |
| Push delivery | Not verified | Require a deployed opt-in delivery path and provider confirmation |
| Full 300-card reviewed library | Not verified | Inventory published structured content and human-review status |
| Full feature matrix and release gates | Partially documented | Maintain the master roadmap and update only with evidence |

## Prioritized backlog

### P0 — Security and release integrity
1. Obtain a repeatable baseline: run existing tests and production build against the audited `main` commit; record exact SHA, commands, counts, and failures.
2. Review all nine SECURITY DEFINER functions and grants; write adversarial tests for cross-user access, anonymous access, forged state, retries, and consent revocation.
3. Inspect live RLS policies and storage policies for profiles, sessions/history, consent, mood, XP ledger, admin records, and private media. Test denial as well as authorized access.
4. Reconcile repository, Vercel project, and Supabase project identity/configuration without printing secret values.
5. Confirm which open fix/performance branches have merged and whether the deployed SHA contains them.

### P1 — Core user experience
6. Audit routes/screens and shared components against the master feature matrix; classify each as implemented, partial, documented-only, missing, or blocked.
7. Verify PAUSE/PASS/STOP, consent revocation, interruption recovery, aftercare, and server-authoritative session completion end-to-end.
8. Reconcile the legacy XP/level calculation with the approved seven-rank ladder using a migration/reconciliation plan that preserves earned progress.
9. Verify design tokens, official logo usage, language handling, reduced motion, touch targets, and responsive behavior on real target devices.

### P2 — Approved product expansion
10. Build KINK DNA as user-controlled structured preferences, unknown states, explicit boundaries, preview, and explainable recommendations.
11. Implement content metadata, review/publish workflow, versioning, and a measured human-reviewed library before expanding content volume.
12. Implement AI, media, notifications, partner features, and monetization only behind verified server-side authorization, explicit opt-in, policy/legal checks, and tested fallbacks.

## Working rules and release gates
- Continue the existing React/TypeScript/Vite/Supabase/Vercel project. Do not use Lovable.
- Use a feature branch and PR for changes; preserve production data and existing working functionality.
- No pricing choice is implied by this audit. Keep product prices configurable until the owner decides.
- Payments remain disabled unless a compliant provider and merchant setup are verified.
- Do not claim a feature is complete until UI, backend, permissions, states, tests, accessibility, documentation, and deployment checks meet the definition of done.
- Do not claim background execution or independent push notifications unless an actual running mechanism is configured.
- Keep secrets out of source, reports, screenshots, and client bundles.

## Audit trail
- Repository metadata, root `package.json`, roadmap branch file, PR #15 metadata, branch names, Vercel deployment metadata, Supabase project status, migration list, Edge Function list, and Security/Performance Advisor results were queried on 2026-10-14.
- SQL inspection read the definitions and grants of the nine flagged RPCs. No SQL mutation was executed.
- No application tests or build were run during this audit.
