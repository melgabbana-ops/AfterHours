-- AFTER HOURS: enforce terminal-only deletion even if another permissive DELETE policy exists.
-- Proposal only. Review against the deployed migration ledger before applying.
begin;

-- PostgreSQL combines permissive policies with OR. A second permissive policy
-- could therefore bypass a narrowed owner policy. This restrictive guard is
-- ANDed with every applicable permissive policy and keeps active/paused runs
-- undeletable for authenticated clients.
drop policy if exists afterhours_experience_runs_terminal_delete_guard
  on public.afterhours_experience_runs;

create policy afterhours_experience_runs_terminal_delete_guard
  on public.afterhours_experience_runs
  as restrictive
  for delete
  to authenticated
  using (
    user_id = (select auth.uid())
    and status in ('ready', 'completed', 'stopped')
  );

commit;
