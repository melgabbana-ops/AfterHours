# AFTER HOURS — Live Security Review
**Date:** 2026-10-14  
**Environment:** Supabase project `yniocgfghcowjilqaock` (read-only inspection)  
**Change policy:** Findings only. No production policies, functions, grants, data, or secrets were changed.

## Scope and limits

Inspected current definitions/grants for nine Security Advisor-flagged `SECURITY DEFINER` functions and current RLS policies for core account, session, consent, progression, audit, and private-media tables. This is a configuration review, not a penetration test. Policy definitions alone do not prove that all end-to-end access paths are safe; authenticated test identities and negative tests are still required.

## Observed RLS policy inventory

- `profiles`: self-read, self-insert with `id = auth.uid()`, self-update with identity preserved.
- `sessions`: self-read and self-insert limited to owner, `status='ready'`, and `round=0`. No direct UPDATE policy was listed; state mutation appears intended to go through RPCs.
- `session_history`: owner-only read by `profile_id = auth.uid()`.
- `consent_records`: read through session ownership; writes appear intended through RPC.
- `session_mood_events`: owner-only read by `profile_id = auth.uid()`.
- `mission_progress`: owner-only read by `user_id = auth.uid()`.
- `xp_event_ledger`: owner-only read by `profile_id = auth.uid()`.
- `app_admins`: self-read only; policy does not permit client writes.
- `admin_audit_log`: SELECT requires `is_app_admin()`.
- `experience_rounds`: one SELECT policy named `experience_rounds_read`, allowing active content or an app admin; one admin-only UPDATE policy.
- `storage.objects`: SELECT/INSERT/UPDATE/DELETE policies for bucket `after-hours-private-media` scope objects to the authenticated user's UID as the first storage path segment.

These are the live policy expressions returned by `pg_policies` at audit time. Verify RLS is enabled on each table, check grants outside RLS, inspect storage bucket privacy configuration, and run authenticated negative tests before declaring the controls effective.

## SECURITY DEFINER RPC review

All nine functions are owned by `postgres`, have `search_path=public`, and grant EXECUTE to `authenticated` and `service_role`. Supabase Security Advisor flags authenticated execution of SECURITY DEFINER functions. This is a review signal, not proof each function is exploitable. The public schema search path is explicitly configured, but hardening to a minimal path and schema-qualifying dependencies should be evaluated with tests rather than applied blindly.

### `admin_dashboard_metrics()`
Observed: checks `public.is_app_admin()` before aggregating platform totals, active consents, rounds, and private-media object count.  
Tests needed: normal authenticated user denied; admin permitted; anonymous denied; ensure aggregate output exposes no per-user/private content.

### `is_app_admin()`
Observed: derives identity from `auth.uid()` and checks `app_admins`.  
Tests needed: anonymous returns false; regular user false; authorized admin true; client cannot grant itself admin; review recursion/ownership behavior under RLS.

### `complete_mission(text)`
Observed: derives user from `auth.uid()`; accepts an allowlisted mission ID; inserts progress with conflict protection and returns prior completion when duplicated.  
Tests needed: unknown ID rejected; unauthenticated rejected; replay is idempotent; user cannot submit another user's ID because no user ID is accepted; verify XP award authority and that completion is not awarded for boundary/stop actions.

### `get_mission_progress()`
Observed: derives user from `auth.uid()` and returns a fixed mission catalog joined to that user's progress.  
Tests needed: anonymous denied; no cross-user rows; period boundaries (UTC day and ISO week); returned data limited to intended fields.

### `get_session_mood_history(integer)`
Observed: derives user from `auth.uid()`, filters on `profile_id`, and clamps requested limit to 1–100.  
Tests needed: anonymous denied; forged limit cannot expand output beyond 100; no cross-user mood events.

### `record_session_mood(uuid,text,text)`
Observed: derives user from `auth.uid()`, allowlists phase/mood values, and checks session ownership before insert.  
Tests needed: invalid phase/mood rejected; cross-user session denied; anonymous denied; session status and retention expectations confirmed.

### `set_consent_state(uuid,text,timestamptz,timestamptz)`
Observed: locks an owned session row, accepts active/revoked state, generates authoritative timestamps, and stops active/paused sessions in the same transaction on revocation. Repeated revoke attempts attempt to repair a running/paused session.  
Tests needed: forged timestamps cannot become authoritative; only owner can change state; concurrent revoke/start ordering; revoked consent cannot resume a session; completion cannot be reactivated; STOP remains immediate in the client and is not delayed by animation or network UI.

### `set_session_state(uuid,text,integer,timestamptz,timestamptz)`
Observed: locks an owned session row; allowlists statuses and rounds; checks consent before active state; uses client-supplied update timestamp as a stale-state/version signal; blocks direct completion and requires the completion RPC.  
Tests needed: spoofed/future/stale timestamp behavior; valid/invalid transition matrix; cross-user and anonymous denial; stale activation cannot bypass revoked consent; concurrent transitions; ensure client clock manipulation cannot undermine state consistency.

### `complete_session(uuid,integer)`
Observed: locks an owned session, requires exactly three rounds, requires an allowed current state/round, checks at least 3600 active seconds, requires latest consent active, inserts a unique XP ledger event before changing session/profile/history in the same transaction, and returns zero XP for already-completed sessions.  
Tests needed: the three-round/60-minute rule is consistent with intended product design; pause/stop/pass behavior; replay/idempotency under concurrent requests; no XP after revoked consent; client cannot fake elapsed time or round state; rank thresholds and profile XP cannot diverge from the ledger.

## Prioritized actions

### P0 — Required before expanding session or AI features
1. Add automated RPC authorization/transition tests using at least two distinct authenticated users plus anonymous role.
2. Verify RLS enabled state and table grants for every private table, not just policy expressions.
3. Verify private-media bucket is not public and signed URLs expire as intended; test cross-user list/read/update/delete denial.
4. Review whether the 60-minute minimum in `complete_session` is intended for all experience types; do not remove or weaken it without explicit product approval and a migration/test plan.
5. Reconcile XP event ledger, profile XP and approved seven-rank thresholds in a non-production test environment before any migration.

### P1 — Hardening
6. Evaluate replacing broad `search_path=public` with a minimal safe path (for example, `pg_catalog` plus explicit schema qualification) for each RPC; do not mass-change without regression tests.
7. Review grants for PUBLIC/anon, function overloads, and default privileges. Current output established authenticated/service_role grants for the nine listed signatures but did not prove absence of other overloads or inherited access.
8. Inspect all policies on all tables, including archive/journal, partner sharing, purchases/entitlements, and creator/admin data, as those schemas are introduced.
9. Review audit-log insertion and retention to ensure audit events cannot be forged or altered by clients.

### P2 — Release verification
10. Run the project build and test suite in CI and record the exact commit, commands, result, and environment.
11. Exercise session flows on iPhone Safari and Android, including network loss, browser refresh, reduced motion, and immediate STOP.
12. Re-run Supabase Security and Performance Advisors after reviewed changes and record which warnings remain with justification.

## Explicitly not done

- No SQL migration or production policy/function/grant modification.
- No user or session data was read beyond schema/policy metadata.
- No credentials or secrets were requested or printed.
- No live cross-user penetration test was executed.
- No application tests/build were run as part of this inspection.

## Source links

- [Supabase Database Linter: SECURITY DEFINER function executable by authenticated](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable)
- [AFTER HOURS repository](https://github.com/melgabbana-ops/AfterHours)
- [Verified project audit](./PROJECT_AUDIT_2026-10-14.md)
