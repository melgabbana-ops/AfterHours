-- AFTER HOURS grant hardening: post-migration verification
-- Run ONLY against a disposable/non-production Supabase database after applying
-- the reviewed migration. This file is read-only and makes no changes.
-- It verifies grants and RLS shape, not complete app behavior; separately test
-- API requests with an anon key and an authenticated test account.

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

  -- RLS-bypassing / schema-affecting grants must not remain on API roles.
  FOREACH t IN ARRAY ARRAY[
    'public.consent_records',
    'public.profiles',
    'public.session_history',
    'public.sessions',
    'public.experience_rounds'
  ] LOOP
    FOREACH p IN ARRAY ARRAY['TRUNCATE', 'REFERENCES', 'TRIGGER'] LOOP
      IF has_table_privilege('anon', t, p) THEN
        RAISE EXCEPTION 'Unexpected anon privilege % on %', p, t;
      END IF;
      IF has_table_privilege('authenticated', t, p) THEN
        RAISE EXCEPTION 'Unexpected authenticated privilege % on %', p, t;
      END IF;
    END LOOP;
  END LOOP;

  -- No residual column-level REFERENCES grants on API roles.
  IF EXISTS (
    SELECT 1
    FROM information_schema.column_privileges
    WHERE table_schema = 'public'
      AND table_name IN ('consent_records', 'profiles', 'session_history', 'sessions', 'experience_rounds')
      AND grantee IN ('anon', 'authenticated')
      AND privilege_type = 'REFERENCES'
  ) THEN
    RAISE EXCEPTION 'Unexpected column-level REFERENCES grant remains on an app table';
  END IF;

  -- The public client retains SELECT on experience_rounds; RLS controls row visibility.
  IF NOT has_table_privilege('anon', 'public.experience_rounds', 'SELECT') THEN
    RAISE EXCEPTION 'Expected anon SELECT grant on experience_rounds was removed';
  END IF;

  FOREACH p IN ARRAY ARRAY['INSERT', 'UPDATE', 'DELETE'] LOOP
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

  -- RLS must remain enabled on all user-owned tables.
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

SELECT 'PASS: grants are least-privilege; protected tables retain RLS' AS verification_result;
