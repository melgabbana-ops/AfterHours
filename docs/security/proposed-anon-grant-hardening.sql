-- PROPOSAL ONLY: NOT an applied production migration.
-- Keep this SQL outside supabase/migrations until the live Supabase migration
-- ledger and the repository baseline can be reconciled through an approved
-- migration workflow. Validate in an authorized non-production database before
-- promoting this file to a versioned migration.
--
-- Goal: prevent unauthenticated access to user-owned consent/profile/session
-- tables; preserve public SELECT on experience_rounds; remove broad privileges
-- that bypass RLS (TRUNCATE) or allow unnecessary trigger/FK operations.
-- Existing RLS policies and required authenticated read/write grants stay put.

REVOKE ALL PRIVILEGES ON TABLE
  public.consent_records,
  public.profiles,
  public.session_history,
  public.sessions
FROM anon;

-- Table-level REVOKE does not remove separately granted column privileges.
REVOKE ALL PRIVILEGES (
  id, session_id, status, confirmed_at, revoked_at, created_at
) ON TABLE public.consent_records FROM anon;

REVOKE ALL PRIVILEGES (
  id, display_name, username, avatar_style, level, xp, sessions, created_at, updated_at
) ON TABLE public.profiles FROM anon;

REVOKE ALL PRIVILEGES (
  id, profile_id, completed_at, xp_earned, rounds, created_at
) ON TABLE public.session_history FROM anon;

REVOKE ALL PRIVILEGES (
  id, profile_id, status, round, started_at, updated_at, active_seconds, active_started_at
) ON TABLE public.sessions FROM anon;

-- These roles do not need TRUNCATE, REFERENCES or TRIGGER on app tables.
-- TRUNCATE bypasses row-level security, so remove it from authenticated too.
REVOKE TRUNCATE, REFERENCES, TRIGGER ON TABLE
  public.consent_records,
  public.profiles,
  public.session_history,
  public.sessions,
  public.experience_rounds
FROM anon, authenticated;

-- Revoke separately granted column-level REFERENCES privileges as well.
REVOKE REFERENCES (
  id, session_id, status, confirmed_at, revoked_at, created_at
) ON TABLE public.consent_records FROM anon, authenticated;

REVOKE REFERENCES (
  id, display_name, username, avatar_style, level, xp, sessions, created_at, updated_at
) ON TABLE public.profiles FROM anon, authenticated;

REVOKE REFERENCES (
  id, profile_id, completed_at, xp_earned, rounds, created_at
) ON TABLE public.session_history FROM anon, authenticated;

REVOKE REFERENCES (
  id, profile_id, status, round, started_at, updated_at, active_seconds, active_started_at
) ON TABLE public.sessions FROM anon, authenticated;

-- Experience rounds are intentionally readable by the public app. Preserve
-- SELECT while removing anonymous writes and all column-level FK grants.
REVOKE INSERT, UPDATE, DELETE ON TABLE public.experience_rounds FROM anon;

REVOKE REFERENCES (
  id, slug, title, body, title_nl, body_nl, title_en, body_en,
  duration_seconds, sort_order, active, created_at
) ON TABLE public.experience_rounds FROM anon, authenticated;
