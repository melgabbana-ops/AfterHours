-- AFTER HOURS: new experience runs must be inactive drafts until owner consent is recorded.
-- Keep this proposal unapplied until its version is approved and reconciled with the live migration ledger.
begin;

create schema if not exists private;

create or replace function private.require_afterhours_experience_run_draft_on_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status is distinct from 'ready'
    or new.current_step is distinct from 0
    or new.started_at is not null then
    raise exception 'New experiences must start as a ready draft at step zero without a start timestamp. Record consent before activation.'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

revoke all on function private.require_afterhours_experience_run_draft_on_insert() from public, anon, authenticated;

drop trigger if exists afterhours_experience_run_insert_consent_guard on public.afterhours_experience_runs;
create trigger afterhours_experience_run_insert_consent_guard
before insert on public.afterhours_experience_runs
for each row execute function private.require_afterhours_experience_run_draft_on_insert();

drop policy if exists afterhours_experience_runs_insert_own on public.afterhours_experience_runs;
create policy afterhours_experience_runs_insert_own
on public.afterhours_experience_runs
for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and status = 'ready'
  and current_step = 0
  and started_at is null
);

commit;
