# Protected-table grant hardening: non-production test plan

Status: preparation only. This plan does not authorize production SQL or creation of a paid Supabase branch.

## Scope and safety boundaries
- Remove direct and inherited `PUBLIC` table/column privileges for `anon` on five reviewed tables: `consent_records`, `profiles`, `session_history`, `sessions`, and `experience_rounds`.
- Prevent future tables created by the `postgres` role in `public` from inheriting default privileges for `anon` / `PUBLIC`.
- Do not change direct grants for `authenticated` or `service_role`.
- Do not remove `TRUNCATE`, `REFERENCES`, `TRIGGER`, or `MAINTAIN` privileges from `authenticated` in this proposal.
- Do not alter RLS policies or any SECURITY DEFINER function. Existing authenticated RPC functions must remain callable for their intended application flows.
- The live `experience_rounds` policy is authenticated-only. Do not introduce anonymous read access based on older migration comments that conflict with the current policy.

## Preconditions
- Use an explicitly authorized disposable/non-production PostgreSQL database with the AFTER HOURS schema and no production data.
- Confirm the database is not the production project before running any SQL.
- Record the database/PostgreSQL version and current migration ledger.
- Verify that `postgres` is the role that creates the production application tables before testing the default-privilege statement.
- Review `proposed-anon-grant-hardening.sql` and `validate-anon-grant-hardening.sql` against the actual schema and effective grants.
- Do not run this proposal in production, and do not create a billable Supabase branch until the cost has been disclosed and approved.

## Test sequence
1. Capture baseline table privileges, column privileges, default table privileges, RLS enablement, policies, and the migration ledger for the five tables in scope.
2. Apply the reviewed proposal only in the disposable database. Record SQL results and any warnings/errors.
3. Run `validate-anon-grant-hardening.sql`. It must complete without raising an exception and return its PASS row.
4. Verify anonymous table and column access is denied for all five tables, including inherited `PUBLIC` grants.
5. Verify new tables created by `postgres` in `public` do not inherit privileges for `anon` or `PUBLIC`.
6. Compare authenticated grants before and after. They must be identical. In particular, this proposal must not remove authenticated structural privileges.
7. Confirm all existing RLS policies remain identical and RLS stays enabled.
8. Using the public/anon client key with no user session, verify requests against the five reviewed tables are denied. Test reads and writes; do not rely on UI hiding alone.
9. Using a test authenticated account, verify profile read/insert/update, session creation/read/state RPCs, consent activation/revocation, session completion/history, mission progress, mood history, and Story Mode chapter progress behave as before.
10. Confirm non-admin authenticated accounts cannot invoke admin-only behavior, while a separate authorized admin test account still can.
11. Confirm `experience_rounds` remains available to authenticated clients under the existing active/admin RLS policy and is not exposed to anon.
12. Do not proceed if any authenticated flow regresses, any authenticated grants change, or any anonymous request succeeds unexpectedly.

## Release gate after tests
- Reconcile the production migration ledger, repository guard script, and `supabase/README.md` in the same reviewed change.
- Create a versioned migration only after the approved migration workflow determines the correct version.
- Run CI, Supabase security advisors, and the complete regression suite again.
- Keep the PR in draft until SQL and application behavior have both been validated.

## Evidence to attach to the PR
- PostgreSQL version and non-production environment identifier (no secrets).
- Pre/post table, column, and default-grant comparison.
- Verifier output.
- Anonymous-denial test results and authenticated-flow regression results.
- CI and security-advisor outcomes.
