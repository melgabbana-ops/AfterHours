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
    v_session.active_seconds:=v_session.active_seconds+greatest(0,floor(extract(epoch from(now()-v_session.active_started_at)))::integer);
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
