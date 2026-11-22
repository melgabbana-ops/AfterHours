-- AFTER HOURS: prevent authenticated clients from deleting live or paused experience runs.
-- Proposal only. Review against the deployed migration ledger before applying.
begin;

drop policy if exists afterhours_experience_runs_delete_own
  on public.afterhours_experience_runs;

create policy afterhours_experience_runs_delete_own
  on public.afterhours_experience_runs
  for delete
  to authenticated
  using (
    user_id = (select auth.uid())
    and status in ('ready', 'completed', 'stopped')
  );

commit;
