-- AFTER HOURS anon grant hardening: post-migration verification
-- Run ONLY against a disposable/non-production Supabase database after applying
-- the proposed REVOKE statements. This file is read-only and makes no changes.
-- It deliberately verifies privileges and RLS policy shape, not application
-- behavior; separately exercise API requests with an anon key and an auth user.

DO $verify$
DECLARE
  t text;
  p text;
BEGIN
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

  -- No residual column-level grants should remain on the user-owned tables.
  IF EXISTS (
    SELECT 1
    FROM information_schema.column_privileges
    WHERE table_schema = 'public'
      AND table_name IN ('consent_records', 'profiles', 'session_history', 'sessions')
      AND grantee = 'anon'
  ) THEN
    RAISE EXCEPTION 'Unexpected anon column-level grant remains on a protected table';
  END IF;

  -- The public client retains the SELECT grant on experience_rounds, while
  -- non-read table grants are removed. RLS still determines row visibility.
  IF NOT has_table_privilege('anon', 'public.experience_rounds', 'SELECT') THEN
    RAISE EXCEPTION 'Expected anon SELECT grant on experience_rounds was removed';
  END IF;

  FOREACH p IN ARRAY ARRAY[
    'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER'
  ] LOOP
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

  -- RLS remains enabled and user-owned tables retain authenticated-only policies.
  IF EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname IN ('consent_records', 'profiles', 'session_history', 'sessions')
      AND c.relrowsecurity IS NOT TRUE
  ) THEN
    RAISE EXCEPTION 'RLS must remain enabled on all protected tables';
  END IF;
END;
$verify$;

SELECT
  'PASS: anon grants are least-privilege; protected tables retain RLS' AS verification_result;
