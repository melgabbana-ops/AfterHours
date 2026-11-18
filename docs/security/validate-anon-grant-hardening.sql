-- AFTER HOURS grant hardening: post-change verification
-- Run ONLY against a disposable/non-production Supabase database after applying
-- the reviewed proposal. This file is read-only and makes no changes.
-- It verifies grants, RLS, and policy shape; separately run API-level behavior
-- tests with anonymous and authenticated test clients.

DO $verify$
DECLARE
  t text;
  p text;
BEGIN
  -- Anonymous clients must have no effective table privilege on the five
  -- reviewed tables. has_table_privilege also includes inherited PUBLIC grants.
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

  -- No direct anon or PUBLIC table grants should remain in the information
  -- schema view. The effective-privilege check above catches inheritance too.
  IF EXISTS (
    SELECT 1
    FROM information_schema.table_privileges
    WHERE table_schema = 'public'
      AND table_name IN ('consent_records', 'profiles', 'session_history', 'sessions', 'experience_rounds')
      AND grantee IN ('anon', 'PUBLIC')
  ) THEN
    RAISE EXCEPTION 'Unexpected anon/PUBLIC table-level grant remains';
  END IF;

  -- No residual anon/PUBLIC column-level grants should remain.
  IF EXISTS (
    SELECT 1
    FROM information_schema.column_privileges
    WHERE table_schema = 'public'
      AND table_name IN ('consent_records', 'profiles', 'session_history', 'sessions', 'experience_rounds')
      AND grantee IN ('anon', 'PUBLIC')
  ) THEN
    RAISE EXCEPTION 'Unexpected anon/PUBLIC column-level grant remains';
  END IF;

  -- Future postgres-created public tables should not automatically expose
  -- privileges to anon or PUBLIC.
  IF EXISTS (
    SELECT 1
    FROM pg_default_acl d
    JOIN pg_namespace n ON n.oid = d.defaclnamespace
    CROSS JOIN LATERAL aclexplode(d.defaclacl) a
    WHERE n.nspname = 'public'
      AND d.defaclrole = 'postgres'::regrole
      AND d.defaclobjtype = 'r'
      AND (a.grantee = 'anon'::regrole OR a.grantee = 0)
  ) THEN
    RAISE EXCEPTION 'Unexpected anon/PUBLIC default table privilege remains for postgres';
  END IF;

  -- RLS must remain enabled on every reviewed table.
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

  -- Do not widen experience-round access. Active content remains governed by
  -- the existing authenticated-only SELECT policy; anon/PUBLIC policies are
  -- not added by this change.
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
    RAISE EXCEPTION 'Unexpected anon/PUBLIC SELECT-capable policy on experience_rounds';
  END IF;
END;
$verify$;

SELECT 'PASS: anon table/column access removed; postgres defaults hardened; RLS remains enabled' AS verification_result;

-- Authenticated behavior is intentionally not inferred from ACL snapshots.
-- Run the authenticated API regression sequence documented in
-- anon-grant-hardening-test-plan.md before considering the proposal release-ready.
