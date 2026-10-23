# Protected-table grant hardening: non-production test plan

Status: preparation only. This plan does not authorize production SQL or creation of a paid Supabase branch.

## Preconditions
- Use an explicitly authorized disposable/non-production PostgreSQL database with the AFTER HOURS schema and no production data.
- Confirm the database is not the production project before running any SQL.
- Record the database/PostgreSQL version and current migration ledger.
- Review `proposed-anon-grant-hardening.sql` and `validate-anon-grant-hardening.sql` against the actual schema and grants.
- Do not run this proposal in production, and do not create a billable Supabase branch until the cost has been disclosed and approved.

## Test sequence
1. Capture a baseline of table privileges, column privileges, RLS enablement, policies, and the migration ledger for the five tables in scope.
2. Apply the reviewed proposal only in the disposable database. Record the SQL result and any warnings/errors.
3. Run `validate-anon-grant-hardening.sql`. It must complete without raising an exception and return its PASS row.
4. Verify that `anon` has no effective table or column privileges on `consent_records`, `profiles`, `session_history`, `sessions`, or `experience_rounds`.
5. Verify that `authenticated` has no `TRUNCATE`, `REFERENCES`, `TRIGGER`, or `MAINTAIN` privilege on those tables, including column-level `REFERENCES` grants. Preserve existing SELECT/INSERT/UPDATE/DELETE grants and RLS policies.
6. Confirm RLS remains enabled and existing authenticated policies have not changed.
7. Using the public/anon client key with no user session, verify requests against the five protected tables are denied. Check both reads and writes; do not rely on UI hiding alone.
8. Using a test authenticated account, verify profile identity operations, session creation/read, consent activation/revocation, session completion/history, mission progress, mood history, and admin authorization behave as before.
9. Confirm non-admin authenticated accounts cannot invoke admin-only behavior; confirm an admin test account still can.
10. Review all results and any changed grants/policies. Do not proceed if any authenticated flow regresses or any anonymous request succeeds unexpectedly.

## Release gate after tests
- Reconcile the production migration ledger, repository guard script, and `supabase/README.md` in the same reviewed change.
- Create a versioned migration only after the approved migration workflow determines the correct version.
- Run CI, security advisors, and the complete regression suite again.
- Keep this PR in draft until SQL and application behavior have both been validated.

## Evidence to attach to the PR
- PostgreSQL version and non-production environment identifier (no secrets).
- Pre/post table and column grant comparison.
- Verifier output.
- Anonymous-denial test results and authenticated-flow regression results.
- CI and security-advisor outcomes.
