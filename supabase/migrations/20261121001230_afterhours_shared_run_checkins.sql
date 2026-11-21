-- Participant check-ins for shared AFTER HOURS runs.
-- Participants may submit one signal for the current step; they cannot alter run state.
begin;

create table if not exists public.afterhours_experience_run_checkins (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.afterhours_experience_runs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  step_index integer not null check (step_index >= 0 and step_index < 40),
  signal text not null check (signal in ('ready', 'pause_requested', 'stop_requested')),
  created_at timestamptz not null default now(),
  unique (run_id, user_id, step_index)
);

create index if not exists afterhours_run_checkins_run_step
  on public.afterhours_experience_run_checkins (run_id, step_index, created_at desc);

alter table public.afterhours_experience_run_checkins enable row level security;
revoke all on public.afterhours_experience_run_checkins from public, anon, authenticated;
grant select, insert, update on public.afterhours_experience_run_checkins to authenticated;

create policy afterhours_run_checkins_read_owner_or_participant
  on public.afterhours_experience_run_checkins
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or exists (
      select 1 from public.afterhours_experience_runs r
      where r.id = afterhours_experience_run_checkins.run_id
        and r.user_id = (select auth.uid())
    )
  );

create policy afterhours_run_checkins_insert_consented_participant
  on public.afterhours_experience_run_checkins
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1
      from public.afterhours_experience_runs r
      join public.afterhours_experience_run_consents c
        on c.run_id = r.id
       and c.user_id = (select auth.uid())
       and c.revoked_at is null
      where r.id = afterhours_experience_run_checkins.run_id
        and r.status in ('active', 'paused')
        and r.current_step = afterhours_experience_run_checkins.step_index
        and r.user_id <> (select auth.uid())
    )
  );

create policy afterhours_run_checkins_update_own_current_step
  on public.afterhours_experience_run_checkins
  for update to authenticated
  using (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.afterhours_experience_runs r
      where r.id = afterhours_experience_run_checkins.run_id
        and r.status in ('active', 'paused')
        and r.current_step = afterhours_experience_run_checkins.step_index
    )
  )
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1
      from public.afterhours_experience_runs r
      join public.afterhours_experience_run_consents c
        on c.run_id = r.id
       and c.user_id = (select auth.uid())
       and c.revoked_at is null
      where r.id = afterhours_experience_run_checkins.run_id
        and r.status in ('active', 'paused')
        and r.current_step = afterhours_experience_run_checkins.step_index
        and r.user_id <> (select auth.uid())
    )
  );

commit;
