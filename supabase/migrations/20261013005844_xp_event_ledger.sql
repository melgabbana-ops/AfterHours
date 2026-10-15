-- AFTER HOURS: auditable, idempotent XP event ledger.
-- The browser cannot write awards; only the trusted session-completion RPC may insert.
begin;

create table if not exists public.xp_event_ledger (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  event_key text not null,
  event_type text not null check (event_type in (
    'session_completion','command_completion','daily_mission','weekly_mission',
    'special_mission','achievement','streak','first_session'
  )),
  source_session_id uuid references public.sessions(id) on delete set null,
  xp_earned integer not null check (xp_earned > 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(profile_id, event_key)
);

create index if not exists xp_event_ledger_profile_created_idx
  on public.xp_event_ledger(profile_id, created_at desc);
create index if not exists xp_event_ledger_source_session_idx
  on public.xp_event_ledger(source_session_id);

alter table public.xp_event_ledger enable row level security;
drop policy if exists "xp_ledger_read_own" on public.xp_event_ledger;
create policy "xp_ledger_read_own"
  on public.xp_event_ledger for select to authenticated
  using (profile_id = auth.uid());
revoke all on public.xp_event_ledger from public, anon, authenticated;
grant select on public.xp_event_ledger to authenticated;

create or replace function public.complete_session(p_session_id uuid, p_rounds integer)
returns jsonb
language plpgsql
security definer
set search_path = public
as $func$
declare
  v_session public.sessions%rowtype;
  v_xp integer := 120;
  v_completed_at timestamptz := now();
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
  if v_session.status = 'completed' then
    return jsonb_build_object('xp_earned', 0, 'already_completed', true);
  end if;
  if v_session.status not in ('active','paused') or v_session.round <> 2 then
    raise exception 'Sessie kan nog niet worden afgerond.';
  end if;

  if v_session.status = 'active' and v_session.active_started_at is not null then
    v_session.active_seconds := v_session.active_seconds
      + greatest(0, floor(extract(epoch from (now() - v_session.active_started_at)))::integer);
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

  -- Insert the unique award first. Any following failure rolls back the ledger
  -- insert and all session/profile changes in the same database transaction.
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
