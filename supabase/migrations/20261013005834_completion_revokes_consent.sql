-- End consent atomically when a session is completed.
-- Also repair completed sessions whose latest consent event remained active.

insert into public.consent_records(session_id,status,revoked_at,created_at)
select s.id, 'revoked', stamp.event_time, stamp.event_time
from public.sessions s
join lateral (
  select c.status, c.created_at
  from public.consent_records c
  where c.session_id = s.id
  order by c.created_at desc, c.id desc
  limit 1
) latest on latest.status = 'active'
cross join lateral (
  select greatest(clock_timestamp(), latest.created_at + interval '1 microsecond') as event_time
) stamp
where s.status = 'completed';

create or replace function public.complete_session(p_session_id uuid, p_rounds integer)
returns jsonb
language plpgsql
security definer
set search_path = public
as $func$
declare
  v_session public.sessions%rowtype;
  v_xp integer := 120;
  v_completed_at timestamptz;
  v_consent_status text;
begin
  if auth.uid() is null then raise exception 'Niet ingelogd.'; end if;
  if p_rounds <> 3 then raise exception 'Ongeldige sessiegrootte.'; end if;
  select * into v_session from public.sessions where id=p_session_id and profile_id=auth.uid() for update;
  if not found then raise exception 'Sessie niet gevonden.'; end if;
  v_completed_at := clock_timestamp();
  if v_session.status='completed' then
    return jsonb_build_object('xp_earned',0,'already_completed',true);
  end if;
  if v_session.status not in ('active','paused') or v_session.round <> 2 then raise exception 'Sessie kan nog niet worden afgerond.'; end if;
  if v_session.status='active' and v_session.active_started_at is not null then
    v_session.active_seconds:=v_session.active_seconds+greatest(0,floor(extract(epoch from(v_completed_at-v_session.active_started_at)))::integer);
  end if;
  if v_session.active_seconds < 3600 then
    raise exception 'De sessie moet minimaal 60 minuten actieve speeltijd hebben.';
  end if;
  select c.status into v_consent_status
  from public.consent_records c
  where c.session_id = v_session.id
  order by c.created_at desc, c.id desc
  limit 1;
  if v_consent_status is distinct from 'active' then
    raise exception 'Actieve consent ontbreekt.';
  end if;
  update public.sessions set status='completed',round=0,started_at=null,active_started_at=null,active_seconds=v_session.active_seconds,updated_at=v_completed_at where id=v_session.id;
  -- Completion ends the consent grant in the same transaction as the session.
  insert into public.consent_records(session_id,status,revoked_at,created_at)
  values(v_session.id,'revoked',v_completed_at,v_completed_at);
  insert into public.session_history(profile_id,completed_at,xp_earned,rounds) values(auth.uid(),v_completed_at,v_xp,p_rounds);
  update public.profiles set xp=xp+v_xp,level=floor((xp+v_xp)/200)+1,sessions=sessions+1 where id=auth.uid();
  return jsonb_build_object('xp_earned',v_xp,'already_completed',false);
end;
$func$;


revoke all on function public.complete_session(uuid,integer) from public;
grant execute on function public.complete_session(uuid,integer) to authenticated;


-- Completed sessions are immutable: never allow a fresh consent grant on one.
create or replace function public.set_consent_state(
  p_session_id uuid,
  p_status text,
  p_confirmed_at timestamptz,
  p_revoked_at timestamptz
)
returns public.consent_records
language plpgsql
security definer
set search_path = public
as $func$
declare
  v_session public.sessions%rowtype;
  v_result public.consent_records%rowtype;
  v_now timestamptz;
begin
  if auth.uid() is null then raise exception 'Niet ingelogd.'; end if;
  if p_status not in ('active','revoked') then raise exception 'Ongeldige consentstatus.'; end if;
  select * into v_session
  from public.sessions
  where id=p_session_id and profile_id=auth.uid()
  for update;
  if not found then raise exception 'Sessie niet gevonden.'; end if;
  if p_status='active' and v_session.status='completed' then
    raise exception 'Een afgeronde sessie kan niet opnieuw worden geactiveerd.';
  end if;

  -- Timestamp the event after acquiring the session lock so concurrent consent changes
  -- remain ordered by actual processing time, not transaction start time.
  v_now := clock_timestamp();

  if p_status='active' then
    if p_confirmed_at is null or p_revoked_at is not null then
      raise exception 'Ongeldige actieve consent.';
    end if;

    select c.* into v_result
    from public.consent_records c
    where c.session_id=v_session.id
    order by c.created_at desc, c.id desc
    limit 1;

    if found and v_result.status='active' then return v_result; end if;

    insert into public.consent_records(session_id,status,confirmed_at,created_at)
    values(v_session.id,'active',v_now,v_now)
    returning * into v_result;
  else
    if p_revoked_at is null or p_confirmed_at is not null then
      raise exception 'Ongeldige ingetrokken consent.';
    end if;

    select c.* into v_result
    from public.consent_records c
    where c.session_id=v_session.id
    order by c.created_at desc, c.id desc
    limit 1;

    if found and v_result.status='revoked' then
      -- Repair legacy/inconsistent state too: a repeated revoke must never leave a session running.
      update public.sessions
      set status='stopped',
          started_at=null,
          active_seconds=case
            when status='active' and active_started_at is not null
              then active_seconds+greatest(0,floor(extract(epoch from(v_now-active_started_at)))::integer)
            else active_seconds
          end,
          active_started_at=null,
          updated_at=v_now
      where id=v_session.id and status in ('active','paused');
      return v_result;
    end if;
    if not found or v_result.status <> 'active' then
      raise exception 'Actieve consent ontbreekt.';
    end if;

    insert into public.consent_records(session_id,status,revoked_at,created_at)
    values(v_session.id,'revoked',v_now,v_now)
    returning * into v_result;

    -- Revocation is authoritative: stop a running or paused session in the same transaction.
    update public.sessions
    set status='stopped',
        started_at=null,
        active_seconds=case
          when status='active' and active_started_at is not null
            then active_seconds+greatest(0,floor(extract(epoch from(v_now-active_started_at)))::integer)
          else active_seconds
        end,
        active_started_at=null,
        updated_at=v_now
    where id=v_session.id and status in ('active','paused');
  end if;

  return v_result;
end;
$func$;


revoke all on function public.set_consent_state(uuid,text,timestamptz,timestamptz) from public;
grant execute on function public.set_consent_state(uuid,text,timestamptz,timestamptz) to authenticated;
