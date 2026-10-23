-- PROPOSAL ONLY: NOT an applied production migration.
-- Keep this SQL outside supabase/migrations until the live Supabase migration
-- ledger and repository baseline are reconciled through the approved workflow.
-- Validate in an authorized disposable/non-production database first.
--
-- Scope:
--   1. Remove anonymous and inherited PUBLIC privileges on user-owned records
--      and experience content.
--   2. Preserve authenticated SELECT/INSERT/UPDATE/DELETE grants and all
--      existing RLS policies, while removing structural privileges that app
--      clients do not need (TRUNCATE, REFERENCES, TRIGGER, MAINTAIN).
--   3. Remove column-level REFERENCES grants too; table-level REVOKE does not
--      remove those independent column grants.

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

-- Runtime clients do not need table-structure privileges. Keep authenticated
-- row-level operations unchanged, but remove these structural capabilities.
REVOKE TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON TABLE
  public.consent_records,
  public.profiles,
  public.session_history,
  public.sessions,
  public.experience_rounds
FROM anon, authenticated, PUBLIC;

-- REFERENCES may be granted per-column, independently of table privileges.
-- Remove such grants on every current column in scope without changing SELECT,
-- INSERT, UPDATE, or DELETE column grants for authenticated.
DO $revoke_column_references$
DECLARE
  col record;
BEGIN
  FOR col IN
    SELECT table_name, column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name IN (
        'consent_records',
        'profiles',
        'session_history',
        'sessions',
        'experience_rounds'
      )
  LOOP
    EXECUTE format(
      'REVOKE REFERENCES (%I) ON TABLE public.%I FROM anon, authenticated, PUBLIC',
      col.column_name,
      col.table_name
    );
  END LOOP;
END;
$revoke_column_references$;
