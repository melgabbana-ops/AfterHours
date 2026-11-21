-- AFTER HOURS: server-authoritative Boss Mode rewards.
-- One reward set is available per authenticated session. PASS never calls this RPC.
-- The privileged implementation stays in the non-exposed private schema; the public
-- RPC is SECURITY INVOKER and only delegates after explicit grants.
begin;

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

alter table public.xp_event_ledger drop constraint if exists xp_event_ledger_event_type_check;
alter table public.xp_event_ledger add constraint xp_event_ledger_event_type_check
  check (event_type in (
    'session_completion','command_completion','daily_mission','weekly_mission',
    'special_mission','achievement','streak','first_session',
    'boss_step_completion','boss_run_completion'
  ));

create or replace function private.complete_boss_mode_step_impl(p_session_id uuid, p_step_index integer)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog
as $func$
declare
  v_session public.sessions%rowtype;
  v_consent_status text;
  v_step_event_id uuid;
  v_bonus_event_id uuid;
  v_step_xp integer := 25;
  v_bonus_xp integer := 0;
  v_total_xp integer := 0;
  v_completed_steps integer := 0;
  v_profile_xp integer;
  v_profile_level integer;
begin
  if auth.uid() is null then
    raise exception 'Niet ingelogd.' using errcode = '42501';
  end if;
  if p_session_id is null or p_step_index is null or p_step_index not between 0 and 4 then
    raise exception 'Ongeldige BOSS MODE-stap.' using errcode = '22023';
  end if;

  -- Lock the owning session first so pause/STOP and XP completion serialize.
  select * into v_session
  from public.sessions
  where id = p_session_id and profile_id = auth.uid()
  for update;
  if not found then
    raise exception 'Sessie niet gevonden voor dit account.' using errcode = 'P0002';
  end if;
  if v_session.status is distinct from 'active' then
    raise exception 'BOSS MODE-XP vereist een actieve sessie.' using errcode = '42501';
  end if;

  select c.status into v_consent_status
  from public.consent_records c
  where c.session_id = v_session.id
  order by c.created_at desc, c.id desc
  limit 1;
  if v_consent_status is distinct from 'active' then
    raise exception 'Actieve consent ontbreekt; er wordt geen XP toegekend.' using errcode = '42501';
  end if;

  insert into public.xp_event_ledger(
    profile_id,event_key,event_type,source_session_id,xp_earned,metadata,created_at
  ) values (
    auth.uid(),
    'boss-step:' || v_session.id::text || ':' || p_step_index::text,
    'boss_step_completion',
    v_session.id,
    v_step_xp,
    jsonb_build_object('step_index',p_step_index,'step_count',5,'completion','explicit'),
    clock_timestamp()
  )
  on conflict (profile_id,event_key) do nothing
  returning id into v_step_event_id;

  if v_step_event_id is null then
    select count(*)::integer into v_completed_steps
    from public.xp_event_ledger e
    where e.profile_id = auth.uid()
      and e.source_session_id = v_session.id
      and e.event_type = 'boss_step_completion';
    return jsonb_build_object(
      'xp_earned',0,'step_xp',0,'completion_bonus_xp',0,
      'already_awarded',true,'full_completion',v_completed_steps=5,
      'profile_xp',null,'profile_level',null
    );
  end if;

  v_total_xp := v_step_xp;
  select count(*)::integer into v_completed_steps
  from public.xp_event_ledger e
  where e.profile_id = auth.uid()
    and e.source_session_id = v_session.id
    and e.event_type = 'boss_step_completion';

  if v_completed_steps = 5 then
    insert into public.xp_event_ledger(
      profile_id,event_key,event_type,source_session_id,xp_earned,metadata,created_at
    ) values (
      auth.uid(),
      'boss-run-completion:' || v_session.id::text,
      'boss_run_completion',
      v_session.id,
      75,
      jsonb_build_object('step_count',5,'completion','all_steps_explicitly_completed'),
      clock_timestamp()
    )
    on conflict (profile_id,event_key) do nothing
    returning id into v_bonus_event_id;
    if v_bonus_event_id is not null then
      v_bonus_xp := 75;
      v_total_xp := v_total_xp + v_bonus_xp;
    end if;
  end if;

  update public.profiles
  set xp = xp + v_total_xp,
      level = floor((xp + v_total_xp)::numeric / 200)::integer + 1
  where id = auth.uid()
  returning xp,level into v_profile_xp,v_profile_level;
  if not found then
    raise exception 'Profiel niet gevonden; XP-transactie teruggedraaid.' using errcode = 'P0002';
  end if;

  return jsonb_build_object(
    'xp_earned',v_total_xp,'step_xp',v_step_xp,'completion_bonus_xp',v_bonus_xp,
    'already_awarded',false,'full_completion',v_completed_steps=5,
    'profile_xp',v_profile_xp,'profile_level',v_profile_level
  );
end;
$func$;

create or replace function public.complete_boss_mode_step(p_session_id uuid, p_step_index integer)
returns jsonb
language sql
security invoker
set search_path = pg_catalog
as $func$
  select private.complete_boss_mode_step_impl(p_session_id, p_step_index);
$func$;

revoke all on function private.complete_boss_mode_step_impl(uuid,integer) from public, anon;
grant execute on function private.complete_boss_mode_step_impl(uuid,integer) to authenticated;
revoke all on function public.complete_boss_mode_step(uuid,integer) from public, anon;
grant execute on function public.complete_boss_mode_step(uuid,integer) to authenticated;

commit;
