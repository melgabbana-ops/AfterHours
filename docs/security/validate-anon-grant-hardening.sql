-- AFTER HOURS grant hardening: post-migration verification
-- Run ONLY against a disposable/non-production Supabase database after applying
-- a reviewed migration. This file is read-only and makes no changes.
-- It verifies catalog grants and RLS/policy shape, not complete app behavior.
-- Separately test anonymous API access and authenticated session/consent flows.

DO $verify$
DECLARE
  t text;
  p text;
BEGIN
  -- Anonymous roles must have no table-level access to user-owned records.
  FOREACH t IN ARRAY ARRAY[
    'public.consent_records',
    'public.profiles',
    'public.session_history',
    'public.sessions'
  ] LOOP
    FOREACH p IN ARRAY ARRAY[
      'SELECT', 'INSERT', 'UPDATE', 'DELETE',
      'TRUNCATE', 'REFERENCES', 'TRIGGER'
    ] LOOP
      IF has_table_privilege('anon', t, p) THEN
        RAISE EXCEPTION 'Unexpected anon table privilege % on %', p, t;
      END IF;
    END LOOP;
  END LOOP;

  -- No residual column-level grants should remain on user-owned tables.
  IF EXISTS (
    SELECT 1
    FROM information_schema.column_privileges
    WHERE table_schema = 'public'
      AND table_name IN ('consent_records', 'profiles', 'session_history', 'sessions')
      AND grantee = 'anon'
  ) THEN
    RAISE EXCEPTION 'Unexpected anon column-level grant remains on a protected table';
  END IF;

  -- Public experience content remains readable but not writable by anon.
  IF NOT has_table_privilege('anon', 'public.experience_rounds', 'SELECT') THEN
    RAISE EXCEPTION 'Expected anon SELECT grant on experience_rounds is missing';
  END IF;

  FOREACH p IN ARRAY ARRAY['INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER'] LOOP
    IF has_table_privilege('anon', 'public.experience_rounds', p) THEN
      RAISE EXCEPTION 'Unexpected anon privilege % on experience_rounds', p;
    END IF;
  END LOOP;

  IF EXISTS (
    SELECT 1
    FROM information_schema.column_privileges
    WHERE table_schema = 'public'
      AND table_name = 'experience_rounds'
      AND grantee = 'anon'
      AND privilege_type <> 'SELECT'
  ) THEN
    RAISE EXCEPTION 'Unexpected non-SELECT anon column grant remains on experience_rounds';
  END IF;

  -- Verify the explicit active-only public policy is present.
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'experience_rounds'
      AND policyname = 'experience_rounds_anon_active_read'
      AND cmd = 'SELECT'
      AND 'anon' = ANY (roles::text[])
  ) THEN
    RAISE EXCEPTION 'Expected active-only anon SELECT policy is missing';
  END IF;

  -- RLS must remain enabled on all user-owned tables and experience content.
  IF EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname IN ('consent_records', 'profiles', 'session_history', 'sessions', 'experience_rounds')
      AND c.relrowsecurity IS NOT TRUE
  ) THEN
    RAISE EXCEPTION 'RLS must remain enabled on all reviewed app tables';
  END IF;
END;
$verify$;

SELECT 'PASS: anon grants are least-privilege; RLS remains enabled' AS verification_result;
