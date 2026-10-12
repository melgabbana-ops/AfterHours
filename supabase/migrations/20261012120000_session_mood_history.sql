-- AFTER HOURS: private, append-only mood event history.
begin;

create table if not exists public.session_mood_events (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  session_id uuid not null references public.sessions(id) on delete cascade,
  phase text not null check (phase in ('before','during','after')),
  mood text not null check (
    (phase = 'before' and mood in ('KINKY','EXCITED','CURIOUS','CALM','PLAYFUL','CONFIDENT','UNSURE'))
    or (phase = 'during' and mood in ('INTO IT','MORE','GOOD','NEUTRAL','NEED A PAUSE','OVERWHELMED','STOP'))
    or (phase = 'after' and mood in ('RELAXED','SATISFIED','ENERGIZED','TIRED','EMOTIONAL','OVERSTIMULATED','NEUTRAL','UNSURE'))
  ),
  created_at timestamptz not null default now()
);
create index if not exists session_mood_events_profile_created_idx
  on public.session_mood_events(profile_id, created_at desc);
create index if not exists session_mood_events_session_idx
  on public.session_mood_events(session_id, created_at desc);
alter table public.session_mood_events enable row level security;

drop policy if exists "session_moods_read_own" on public.session_mood_events;
create policy "session_moods_read_own"
  on public.session_mood_events for select to authenticated
  using (profile_id = auth.uid());
revoke all on public.session_mood_events from public, anon, authenticated;
grant select on public.session_mood_events to authenticated;

create or replace function public.record_session_mood(p_session_id uuid, p_phase text, p_mood text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $func$
declare
  v_user uuid := auth.uid();
  v_id uuid;
  v_created timestamptz := clock_timestamp();
begin
  if v_user is null then raise exception 'Authentication required.' using errcode = '42501'; end if;
  if p_phase not in ('before','during','after') then raise exception 'Invalid mood phase.' using errcode = '22023'; end if;
  if not (
    (p_phase = 'before' and p_mood in ('KINKY','EXCITED','CURIOUS','CALM','PLAYFUL','CONFIDENT','UNSURE'))
    or (p_phase = 'during' and p_mood in ('INTO IT','MORE','GOOD','NEUTRAL','NEED A PAUSE','OVERWHELMED','STOP'))
    or (p_phase = 'after' and p_mood in ('RELAXED','SATISFIED','ENERGIZED','TIRED','EMOTIONAL','OVERSTIMULATED','NEUTRAL','UNSURE'))
  ) then raise exception 'Invalid mood for phase.' using errcode = '22023'; end if;
  if not exists(select 1 from public.sessions s where s.id = p_session_id and s.profile_id = v_user) then
    raise exception 'Session not found.' using errcode = 'P0002';
  end if;
  insert into public.session_mood_events(profile_id,session_id,phase,mood,created_at)
  values(v_user,p_session_id,p_phase,p_mood,v_created)
  returning id into v_id;
  return jsonb_build_object('id',v_id,'session_id',p_session_id,'phase',p_phase,'mood',p_mood,'created_at',v_created);
end;
$func$;
revoke all on function public.record_session_mood(uuid,text,text) from public, anon;
grant execute on function public.record_session_mood(uuid,text,text) to authenticated;

create or replace function public.get_session_mood_history(p_limit integer default 40)
returns table(id uuid, session_id uuid, phase text, mood text, created_at timestamptz)
language plpgsql
stable
security definer
set search_path = public
as $func$
declare v_user uuid := auth.uid();
begin
  if v_user is null then raise exception 'Authentication required.' using errcode = '42501'; end if;
  return query
  select e.id,e.session_id,e.phase,e.mood,e.created_at
  from public.session_mood_events e
  where e.profile_id = v_user
  order by e.created_at desc
  limit greatest(1, least(coalesce(p_limit,40),100));
end;
$func$;
revoke all on function public.get_session_mood_history(integer) from public, anon;
grant execute on function public.get_session_mood_history(integer) to authenticated;

commit;
