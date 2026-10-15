-- AFTER HOURS: keep consent revocation atomic with server-side session completion.
-- This is a forward-only repair because the earlier XP-ledger migration replaced
-- complete_session after the original completion-consent migration had run.
begin;

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
  v_processing_time timestamptz;
  v_latest_consent_created_at timestamptz;
  v_consent_status text;
  v_ledger_id uuid;
begin
  if auth.uid() is null then raise exception 'Niet ingelogd.' using errcode = '42501'; end if;
  if p_rounds <> 3 then raise exception 'Ongeldige sessiegrootte.' using errcode = '22023'; end if;

  select * into v_session
  from public.sessions
  where id = p_session_id and profile_id = auth.uid()
  for update;
  if not found then raise exception 'Sessie niet gevonden.' using errcode = 'P0002'; end if;

  -- Capture actual processing time after acquiring the row lock. The audit
  -- event timestamp is adjusted separately to remain newer than the latest
  -- consent event, even if that row contains a future timestamp.
  v_processing_time := clock_timestamp();

  if v_session.status = 'completed' then
    select c.status, c.created_at
      into v_consent_status, v_latest_consent_created_at
    from public.consent_records c
    where c.session_id = v_session.id
    order by c.created_at desc, c.id desc
    limit 1;

    -- Repair a legacy completed session whose latest consent record is active.
    if v_consent_status = 'active' then
      v_completed_at := greatest(v_processing_time, v_latest_consent_created_at + interval '1 microsecond');
      insert into public.consent_records(session_id, status, revoked_at, created_at)
      values (v_session.id, 'revoked', v_completed_at, v_completed_at);
    end if;

    return jsonb_build_object('xp_earned', 0, 'already_completed', true);
  end if;

  if v_session.status not in ('active','paused') or v_session.round <> 2 then
    raise exception 'Sessie kan nog niet worden afgerond.';
  end if;

  if v_session.status = 'active' and v_session.active_started_at is not null then
    v_session.active_seconds := v_session.active_seconds
      + greatest(0, floor(extract(epoch from (v_processing_time - v_session.active_started_at)))::integer);
  end if;
  if v_session.active_seconds < 3600 then
    raise exception 'De sessie moet minimaal 60 minuten actieve speeltijd hebben.';
  end if;

  select c.status, c.created_at
    into v_consent_status, v_latest_consent_created_at
  from public.consent_records c
  where c.session_id = v_session.id
  order by c.created_at desc, c.id desc
  limit 1;
  if v_consent_status is distinct from 'active' then
    raise exception 'Actieve consent ontbreekt.';
  end if;
  v_completed_at := greatest(v_processing_time, v_latest_consent_created_at + interval '1 microsecond');

  -- The unique ledger insert and all following writes share this transaction.
  insert into public.xp_event_ledger(
    profile_id, event_key, event_type, source_session_id, xp_earned, metadata, created_at
  ) values (
    auth.uid(),
    'session-completion:' || v_session.id::text,
    'session_completion',
    v_session.id,
    v_xp,
    jsonb_build_object('rounds', p_rounds, 'active_seconds', v_session.active_seconds),
    v_completed_at
  )
  on conflict (profile_id, event_key) do nothing
  returning id into v_ledger_id;

  if v_ledger_id is null then
    raise exception 'XP voor deze sessie is al geregistreerd; status blijft ongewijzigd.';
  end if;

  update public.sessions
  set status = 'completed',
      round = 0,
      started_at = null,
      active_started_at = null,
      active_seconds = v_session.active_seconds,
      updated_at = v_completed_at
  where id = v_session.id;

  -- Completion revokes consent in the same transaction as the XP award.
  insert into public.consent_records(session_id, status, revoked_at, created_at)
  values (v_session.id, 'revoked', v_completed_at, v_completed_at);

  insert into public.session_history(profile_id, completed_at, xp_earned, rounds)
  values (auth.uid(), v_completed_at, v_xp, p_rounds);

  update public.profiles
  set xp = xp + v_xp,
      level = floor((xp + v_xp) / 200) + 1,
      sessions = sessions + 1
  where id = auth.uid();

  return jsonb_build_object('xp_earned', v_xp, 'already_completed', false);
end;
$func$;

revoke all on function public.complete_session(uuid,integer) from public, anon;
grant execute on function public.complete_session(uuid,integer) to authenticated;

commit;
