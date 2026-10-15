-- AFTER HOURS: server-authoritative mission points.
-- Apply to the configured Supabase project only after reviewing its migration history.
create table if not exists public.mission_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mission_id text not null check (mission_id in (
    'daily-intention','daily-reflection','daily-aftercare',
    'weekly-boundaries','weekly-discovery','weekly-care',
    'special-consent','special-explorer'
  )),
  mission_kind text not null check (mission_kind in ('daily','weekly','special')),
  period_key text not null,
  reward_points integer not null check (reward_points >= 0),
  completed_at timestamptz not null default now(),
  unique (user_id, mission_id, period_key),
  check (
    (mission_id like 'daily-%' and mission_kind = 'daily')
    or (mission_id like 'weekly-%' and mission_kind = 'weekly')
    or (mission_id like 'special-%' and mission_kind = 'special')
  )
);

alter table public.mission_progress enable row level security;
drop policy if exists "mission_progress_read_own" on public.mission_progress;
create policy "mission_progress_read_own"
  on public.mission_progress for select to authenticated
  using (user_id = auth.uid());
revoke all on public.mission_progress from anon, authenticated;
grant select on public.mission_progress to authenticated;
revoke insert, update, delete on public.mission_progress from anon, authenticated;

create or replace function public.get_mission_progress()
returns table (
  mission_id text,
  mission_kind text,
  reward_points integer,
  period_key text,
  completed boolean,
  completed_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $function$
declare
  v_user uuid := auth.uid();
  v_now timestamptz := now();
  v_day text := to_char(v_now at time zone 'UTC', 'YYYY-MM-DD');
  v_week text := to_char(v_now at time zone 'UTC', 'IYYY-"W"IW');
begin
  if v_user is null then raise exception 'Authentication required.' using errcode = '42501'; end if;

  return query
  with catalog(m_id, m_kind, reward, period) as (
    values
      ('daily-intention'::text,'daily'::text,10,v_day),
      ('daily-reflection'::text,'daily'::text,10,v_day),
      ('daily-aftercare'::text,'daily'::text,10,v_day),
      ('weekly-boundaries'::text,'weekly'::text,30,v_week),
      ('weekly-discovery'::text,'weekly'::text,30,v_week),
      ('weekly-care'::text,'weekly'::text,30,v_week),
      ('special-consent'::text,'special'::text,50,'season-1'::text),
      ('special-explorer'::text,'special'::text,50,'season-1'::text)
  )
  select c.m_id, c.m_kind, c.reward, c.period,
         (p.id is not null) as completed, p.completed_at
  from catalog c
  left join public.mission_progress p
    on p.user_id = v_user and p.mission_id = c.m_id and p.period_key = c.period
  order by case c.m_kind when 'daily' then 1 when 'weekly' then 2 else 3 end, c.m_id;
end;
$function$;
revoke all on function public.get_mission_progress() from public, anon;
grant execute on function public.get_mission_progress() to authenticated;

create or replace function public.complete_mission(p_mission_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_user uuid := auth.uid();
  v_now timestamptz := clock_timestamp();
  v_day text := to_char(clock_timestamp() at time zone 'UTC', 'YYYY-MM-DD');
  v_week text := to_char(clock_timestamp() at time zone 'UTC', 'IYYY-"W"IW');
  v_kind text;
  v_reward integer;
  v_period text;
  v_id uuid;
  v_completed timestamptz;
begin
  if v_user is null then raise exception 'Authentication required.' using errcode = '42501'; end if;

  case p_mission_id
    when 'daily-intention' then v_kind := 'daily'; v_reward := 10; v_period := v_day;
    when 'daily-reflection' then v_kind := 'daily'; v_reward := 10; v_period := v_day;
    when 'daily-aftercare' then v_kind := 'daily'; v_reward := 10; v_period := v_day;
    when 'weekly-boundaries' then v_kind := 'weekly'; v_reward := 30; v_period := v_week;
    when 'weekly-discovery' then v_kind := 'weekly'; v_reward := 30; v_period := v_week;
    when 'weekly-care' then v_kind := 'weekly'; v_reward := 30; v_period := v_week;
    when 'special-consent' then v_kind := 'special'; v_reward := 50; v_period := 'season-1';
    when 'special-explorer' then v_kind := 'special'; v_reward := 50; v_period := 'season-1';
    else raise exception 'Unknown mission.' using errcode = '22023';
  end case;

  insert into public.mission_progress(user_id, mission_id, mission_kind, period_key, reward_points, completed_at)
  values(v_user, p_mission_id, v_kind, v_period, v_reward, v_now)
  on conflict (user_id, mission_id, period_key) do nothing
  returning id, public.mission_progress.completed_at into v_id, v_completed;

  if v_id is not null then
    return jsonb_build_object('mission_id', p_mission_id, 'mission_kind', v_kind,
      'reward_points', v_reward, 'period_key', v_period, 'already_completed', false,
      'completed_at', v_completed);
  end if;

  select p.reward_points, p.completed_at into v_reward, v_completed
  from public.mission_progress p
  where p.user_id = v_user and p.mission_id = p_mission_id and p.period_key = v_period;

  return jsonb_build_object('mission_id', p_mission_id, 'mission_kind', v_kind,
    'reward_points', v_reward, 'period_key', v_period, 'already_completed', true,
    'completed_at', v_completed);
end;
$function$;
revoke all on function public.complete_mission(text) from public, anon;
grant execute on function public.complete_mission(text) to authenticated;
