-- AFTER HOURS: a new run is an inactive draft until owner consent is recorded.
-- Review-only proposal. Do not apply to production without explicit approval.
begin;

create schema if not exists private;

create or replace function private.require_afterhours_experience_run_draft_on_insert()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status is distinct from 'ready' or new.current_step <> 0 then
    raise exception 'New experiences must start as a ready draft at step zero. Record consent before activation.'
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
);

commit;
