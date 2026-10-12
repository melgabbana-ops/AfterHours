-- Account-owned daily ritual history, separate from mission points and rank XP.
create table if not exists public.daily_ritual_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  ritual_date date not null default ((now() at time zone 'UTC')::date),
  completed_at timestamptz not null default now(),
  unique(user_id, ritual_date)
);

alter table public.daily_ritual_completions enable row level security;
drop policy if exists "daily_ritual_read_own" on public.daily_ritual_completions;
create policy "daily_ritual_read_own"
  on public.daily_ritual_completions for select to authenticated
  using(user_id = auth.uid());
revoke all on public.daily_ritual_completions from anon, authenticated;
grant select on public.daily_ritual_completions to authenticated;
revoke insert, update, delete on public.daily_ritual_completions from anon, authenticated;

create or replace function public.get_daily_ritual_history()
returns table(ritual_date date)
language plpgsql
stable
security definer
set search_path = public
as $function$
declare v_user uuid := auth.uid();
begin
  if v_user is null then raise exception 'Authentication required.' using errcode = '42501'; end if;
  return query
    select d.ritual_date
    from public.daily_ritual_completions d
    where d.user_id = v_user
      and d.ritual_date >= ((now() at time zone 'UTC')::date - 119)
    order by d.ritual_date;
end;
$function$;
revoke all on function public.get_daily_ritual_history() from public, anon;
grant execute on function public.get_daily_ritual_history() to authenticated;

create or replace function public.complete_daily_ritual()
returns jsonb
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_user uuid := auth.uid();
  v_day date := (now() at time zone 'UTC')::date;
  v_completed timestamptz;
  v_inserted boolean := false;
begin
  if v_user is null then raise exception 'Authentication required.' using errcode = '42501'; end if;
  insert into public.daily_ritual_completions(user_id, ritual_date)
  values(v_user, v_day)
  on conflict(user_id, ritual_date) do nothing
  returning completed_at into v_completed;
  v_inserted := found;
  if not v_inserted then
    select d.completed_at into v_completed
    from public.daily_ritual_completions d
    where d.user_id = v_user and d.ritual_date = v_day;
  end if;
  return jsonb_build_object(
    'ritual_date', v_day,
    'completed_at', v_completed,
    'already_completed', not v_inserted
  );
end;
$function$;
revoke all on function public.complete_daily_ritual() from public, anon;
grant execute on function public.complete_daily_ritual() to authenticated;
