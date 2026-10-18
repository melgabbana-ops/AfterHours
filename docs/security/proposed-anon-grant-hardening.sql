-- PROPOSAL ONLY: NOT an applied production migration.
-- Keep this SQL outside supabase/migrations until the live Supabase migration
-- ledger and repository baseline are reconciled through the approved workflow.
-- Validate in an authorized disposable/non-production database first.
--
-- Scope: remove anonymous and inherited PUBLIC privileges on user-owned records
-- and experience content. Preserve authenticated grants and existing RLS policies
-- unchanged. The base migration grants experience_rounds SELECT to authenticated
-- only; do not introduce anonymous/public access as part of this hardening change.

REVOKE ALL PRIVILEGES ON TABLE
  public.consent_records,
  public.profiles,
  public.session_history,
  public.sessions
FROM anon, PUBLIC;

-- Table-level REVOKE does not remove separately granted column privileges.
-- Clear PUBLIC column grants too because anon inherits privileges granted to PUBLIC.
REVOKE ALL PRIVILEGES (
  id, session_id, status, confirmed_at, revoked_at, created_at
) ON TABLE public.consent_records FROM anon, PUBLIC;

REVOKE ALL PRIVILEGES (
  id, display_name, username, avatar_style, level, xp, sessions, created_at, updated_at
) ON TABLE public.profiles FROM anon, PUBLIC;

REVOKE ALL PRIVILEGES (
  id, profile_id, completed_at, xp_earned, rounds, created_at
) ON TABLE public.session_history FROM anon, PUBLIC;

REVOKE ALL PRIVILEGES (
  id, profile_id, status, round, started_at, updated_at, active_seconds, active_started_at
) ON TABLE public.sessions FROM anon, PUBLIC;

-- Experience rounds remain available to authenticated users under the existing
-- RLS policy (active rounds or app admins). Anonymous clients get no access.
REVOKE ALL PRIVILEGES ON TABLE public.experience_rounds FROM anon, PUBLIC;

REVOKE ALL PRIVILEGES (
  id, slug, title, body, title_nl, body_nl, title_en, body_en,
  duration_seconds, sort_order, active, created_at
) ON TABLE public.experience_rounds FROM anon, PUBLIC;
