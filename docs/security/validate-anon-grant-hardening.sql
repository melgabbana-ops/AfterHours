-- AFTER HOURS grant hardening: post-change verification
-- Run ONLY against a disposable/non-production Supabase database after applying
-- a reviewed proposal. This file is read-only and makes no changes.
-- It verifies catalog grants and RLS/policy shape, not complete app behavior.
-- Separately test anonymous API denial and authenticated session/consent flows.

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
    'public.sessions',
    'public.experience_rounds'
  ] LOOP
    FOREACH p IN ARRAY ARRAY[
      'SELECT', 'INSERT', 'UPDATE', 'DELETE',
      'TRUNCATE', 'REFERENCES', 'TRIGGER', 'MAINTAIN'
    ] LOOP
      IF has_table_privilege('anon', t, p) THEN
        RAISE EXCEPTION 'Unexpected anon table privilege % on %', p, t;
      END IF;
    END LOOP;
  END LOOP;

  -- Authenticated users retain row-level app operations, but must not have
  -- structural table privileges on these API-exposed application tables.
  FOREACH t IN ARRAY ARRAY[
    'public.consent_records',
    'public.profiles',
    'public.session_history',
    'public.sessions',
    'public.experience_rounds'
  ] LOOP
    FOREACH p IN ARRAY ARRAY[
      'TRUNCATE', 'REFERENCES', 'TRIGGER', 'MAINTAIN'
    ] LOOP
      IF has_table_privilege('authenticated', t, p) THEN
        RAISE EXCEPTION 'Unexpected authenticated structural privilege % on %', p, t;
      END IF;
    END LOOP;
  END LOOP;

  -- No residual column-level grants to anon or PUBLIC should remain on the
  -- protected tables; PUBLIC grants would also be inherited by anon.
  IF EXISTS (
    SELECT 1
    FROM information_schema.column_privileges
    WHERE table_schema = 'public'
      AND table_name IN ('consent_records', 'profiles', 'session_history', 'sessions')
      AND grantee IN ('anon', 'PUBLIC')
  ) THEN
    RAISE EXCEPTION 'Unexpected anon/PUBLIC column-level grant remains on a protected table';
  END IF;

  -- No column-level REFERENCES grant should remain for API roles.
  IF EXISTS (
    SELECT 1
    FROM information_schema.column_privileges
    WHERE table_schema = 'public'
      AND table_name IN ('consent_records', 'profiles', 'session_history', 'sessions', 'experience_rounds')
      AND grantee IN ('anon', 'authenticated', 'PUBLIC')
      AND privilege_type = 'REFERENCES'
  ) THEN
    RAISE EXCEPTION 'Unexpected anon/authenticated/PUBLIC column REFERENCES grant remains';
  END IF;

  -- No residual anon/PUBLIC column-level grants should remain on experience content.
  IF EXISTS (
    SELECT 1
    FROM information_schema.column_privileges
    WHERE table_schema = 'public'
      AND table_name = 'experience_rounds'
      AND grantee IN ('anon', 'PUBLIC')
  ) THEN
    RAISE EXCEPTION 'Unexpected anon/PUBLIC column-level grant remains on experience_rounds';
  END IF;

  -- Check SELECT and ALL policies for both anon and PUBLIC. PUBLIC policies
  -- apply to anon even when anon is not named explicitly in the policy roles.
  IF EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'experience_rounds'
      AND cmd IN ('SELECT', 'ALL')
      AND (
        'anon' = ANY (roles::text[])
        OR 'public' = ANY (roles::text[])
      )
  ) THEN
    RAISE EXCEPTION 'Unexpected anon/PUBLIC SELECT-capable policy exists on experience_rounds';
  END IF;

  -- RLS must remain enabled on all reviewed app tables and experience content.
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

SELECT 'PASS: anon has no grants; authenticated has no structural grants; RLS remains enabled' AS verification_result;
