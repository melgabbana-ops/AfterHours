-- PROPOSAL ONLY: NOT an applied production migration.
-- Keep this SQL outside supabase/migrations until the live Supabase migration
-- ledger and repository baseline are reconciled through the approved workflow.
-- Validate in an authorized disposable/non-production database first.
--
-- Scope: remove anonymous privileges on user-owned records and anonymous
-- write/structural privileges on public experience content. Preserve all
-- authenticated grants and existing RLS policies except the explicitly
-- documented experience_rounds public-active read policy below.

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

-- experience_rounds is public content: retain SELECT but remove anonymous
-- writes and structural privileges. Do not change authenticated grants.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON TABLE public.experience_rounds FROM anon;

REVOKE REFERENCES (
  id, slug, title, body, title_nl, body_nl, title_en, body_en,
  duration_seconds, sort_order, active, created_at
) ON TABLE public.experience_rounds FROM anon;

-- Catalog audit found the live read policy targets authenticated only, while
-- app documentation describes active rounds as public. Add an explicit anon
-- policy only if this public-read behavior is confirmed as intended in testing.
DROP POLICY IF EXISTS experience_rounds_anon_active_read ON public.experience_rounds;
CREATE POLICY experience_rounds_anon_active_read
  ON public.experience_rounds FOR SELECT TO anon
  USING (active = true);
