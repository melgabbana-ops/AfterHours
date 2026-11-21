-- PROPOSAL ONLY: NOT an applied production migration.
-- Validate in an authorized disposable/non-production database first.
-- Keep this file outside supabase/migrations until the grant tests below pass
-- and the target migration workflow / ledger are reconciled.
--
-- Security intent:
--   * Remove direct and inherited PUBLIC privileges from anon on the five
--     reviewed app tables.
--   * Keep authenticated grants, including existing structural grants,
--     exactly as they are. This proposal does not alter authenticated ACLs.
--   * Keep all current RLS policies and authenticated flows unchanged.
--   * Prevent postgres-created public tables in the future from inheriting
--     broad anon privileges. This does not change existing table privileges.

REVOKE ALL PRIVILEGES ON TABLE
  public.consent_records,
  public.profiles,
  public.session_history,
  public.sessions,
  public.experience_rounds
FROM anon, PUBLIC;

-- Table-level REVOKE does not remove separately granted column privileges.
-- Remove direct / inherited column privileges from anon only.
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

REVOKE ALL PRIVILEGES (
  id, slug, title, body, title_nl, body_nl, title_en, body_en,
  duration_seconds, sort_order, active, created_at
) ON TABLE public.experience_rounds FROM anon, PUBLIC;

-- Future-proofing: postgres is the role used to create the current production
-- application tables. Newly created public tables must opt into anonymous
-- access explicitly instead of inheriting it by default. Authenticated and
-- service_role defaults are intentionally not changed here.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL PRIVILEGES ON TABLES FROM anon, PUBLIC;

-- No functions are changed by this proposal. Existing SECURITY DEFINER app
-- RPCs are intentionally reviewed separately and must not be mass-revoked.
