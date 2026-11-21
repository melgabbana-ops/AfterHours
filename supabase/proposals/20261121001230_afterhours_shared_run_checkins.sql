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

-- One owner plus at most one accepted invitee: this is a couples experience, not a group room.
create unique index if not exists afterhours_experience_invitations_one_accepted_participant_per_run
  on public.afterhours_experience_invitations (run_id)
  where status = 'accepted' and accepted_user_id is not null;

alter table public.afterhours_experience_run_checkins enable row level security;
revoke all on public.afterhours_experience_run_checkins from public, anon, authenticated;
grant select, insert on public.afterhours_experience_run_checkins to authenticated;
-- PostgREST upsert updates every supplied column; RLS constrains both the
-- existing row and proposed row to the signed-in participant's consented run.
grant update (run_id, user_id, step_index, signal) on public.afterhours_experience_run_checkins to authenticated;

-- Upsert needs column-level UPDATE privileges, but identity must remain immutable.
create or replace function public.afterhours_guard_run_checkin_identity()
returns trigger
language plpgsql
set search_path = pg_catalog
as $
begin
  if new.run_id is distinct from old.run_id
    or new.user_id is distinct from old.user_id
    or new.step_index is distinct from old.step_index then
    raise exception 'Check-in identity fields are immutable.';
  end if;
  return new;
end;
$;

drop trigger if exists afterhours_run_checkins_identity_guard on public.afterhours_experience_run_checkins;
create trigger afterhours_run_checkins_identity_guard
  before update on public.afterhours_experience_run_checkins
  for each row execute function public.afterhours_guard_run_checkin_identity();
revoke all on function public.afterhours_guard_run_checkin_identity() from public, anon, authenticated;

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
        and r.user_id <> (select auth.uid())
        and exists (
          select 1 from public.afterhours_experience_run_consents c
          where c.run_id = r.id and c.user_id = (select auth.uid()) and c.revoked_at is null
        )
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


-- A paused accepted participant can review the still-paused run and explicitly renew consent.
create or replace function private.afterhours_is_accepted_run_participant(p_run_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select p_user_id = auth.uid()
    and exists (
      select 1
      from public.afterhours_experience_invitations i
      where i.run_id = p_run_id
        and i.accepted_user_id = p_user_id
        and i.status = 'accepted'
    );
$function$;

revoke all on function private.afterhours_is_accepted_run_participant(uuid, uuid) from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.afterhours_is_accepted_run_participant(uuid, uuid) to authenticated;

drop policy if exists afterhours_experience_runs_select_owner_or_consented
  on public.afterhours_experience_runs;
create policy afterhours_experience_runs_select_owner_or_consented
  on public.afterhours_experience_runs
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or exists (
      select 1
      from public.afterhours_experience_run_consents c
      where c.run_id = afterhours_experience_runs.id
        and c.user_id = (select auth.uid())
        and c.revoked_at is null
    )
    or (
      status = 'paused'
      and (select private.afterhours_is_accepted_run_participant(id, (select auth.uid())))
    )
  );

create or replace function private.renew_afterhours_experience_consent_impl(p_run_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_consent_version text;
  v_now timestamptz := clock_timestamp();
begin
  if v_user_id is null then
    raise exception 'Sign in before renewing consent.' using errcode = '28000';
  end if;

  select r.consent_version
    into v_consent_version
  from public.afterhours_experience_runs r
  join public.afterhours_experience_invitations i
    on i.run_id = r.id
   and i.inviter_user_id = r.user_id
   and i.accepted_user_id = v_user_id
   and i.status = 'accepted'
  where r.id = p_run_id
    and r.status = 'paused'
    and r.user_id <> v_user_id
  order by i.accepted_at desc
  limit 1
  for update of r;

  if v_consent_version is null then
    raise exception 'This paused experience is not available for renewed consent.' using errcode = 'P0002';
  end if;

  insert into public.afterhours_experience_run_consents (
    run_id, user_id, consent_version, consented_at, revoked_at
  )
  values (p_run_id, v_user_id, v_consent_version, v_now, null)
  on conflict (run_id, user_id) do update
    set consent_version = excluded.consent_version,
        consented_at = excluded.consented_at,
        revoked_at = null;

  return jsonb_build_object(
    'run_id', p_run_id,
    'consent_version', v_consent_version,
    'consented_at', v_now
  );
end;
$function$;

revoke all on function private.renew_afterhours_experience_consent_impl(uuid) from public, anon, authenticated;
grant execute on function private.renew_afterhours_experience_consent_impl(uuid) to authenticated;

create or replace function public.renew_afterhours_experience_consent(p_run_id uuid)
returns jsonb
language sql
security invoker
set search_path = ''
as $function$
  select private.renew_afterhours_experience_consent_impl(p_run_id);
$function$;

revoke all on function public.renew_afterhours_experience_consent(uuid) from public, anon;
grant execute on function public.renew_afterhours_experience_consent(uuid) to authenticated;

commit;
