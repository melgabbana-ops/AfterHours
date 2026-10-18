-- PROPOSAL ONLY: NOT an applied production migration.
-- Keep this SQL outside supabase/migrations until the live Supabase migration
-- ledger and the repository baseline can be reconciled through an approved
-- migration workflow. Validate column names and effective grants in a safe,
-- authorized non-production database before promoting to a migration.
--
-- Intended effect: remove anonymous table and column privileges on user-owned
-- consent/profile/session tables while preserving authenticated grants and RLS.
-- Preserve public SELECT on experience_rounds while removing anon write,
-- truncate, references, and trigger privileges.

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

-- Experience rounds are intentionally readable by the public app. Preserve
-- anonymous SELECT, but remove dangerous or unnecessary table/column grants.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON TABLE public.experience_rounds FROM anon;

REVOKE REFERENCES (
  id, slug, title, body, title_nl, body_nl, title_en, body_en,
  duration_seconds, sort_order, active, created_at
) ON TABLE public.experience_rounds FROM anon;
