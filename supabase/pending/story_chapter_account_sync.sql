-- AFTER HOURS: account-synced Story Mode chapter completion.
-- Chapter completion is idempotent and tied to auth.uid(); clients cannot forge another user's progress.
begin;

create table if not exists public.story_chapter_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  chapter_id text not null check (chapter_id in (
    'arrival','test','control','challenge','boundary','night','after-hours'
  )),
  completed_at timestamptz not null default now(),
  unique (user_id, chapter_id)
);

alter table public.story_chapter_progress enable row level security;
drop policy if exists "story_chapter_progress_read_own" on public.story_chapter_progress;
create policy "story_chapter_progress_read_own"
  on public.story_chapter_progress for select to authenticated
  using (user_id = auth.uid());
revoke all on public.story_chapter_progress from public, anon, authenticated;
grant select on public.story_chapter_progress to authenticated;

create or replace function public.get_story_chapter_progress()
returns table (chapter_id text, completed_at timestamptz)
language plpgsql
stable
security definer
set search_path = public
as $function$
begin
  if auth.uid() is null then
    raise exception 'Authentication required.' using errcode = '42501';
  end if;
  return query
    select p.chapter_id, p.completed_at
    from public.story_chapter_progress p
    where p.user_id = auth.uid()
    order by p.completed_at asc, p.chapter_id asc;
end;
$function$;
revoke all on function public.get_story_chapter_progress() from public, anon;
grant execute on function public.get_story_chapter_progress() to authenticated;

create or replace function public.complete_story_chapter(p_chapter_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_completed_at timestamptz;
  v_already_completed boolean := false;
begin
  if auth.uid() is null then
    raise exception 'Authentication required.' using errcode = '42501';
  end if;
  if p_chapter_id is null or p_chapter_id not in ('arrival','test','control','challenge','boundary','night','after-hours') then
    raise exception 'Unknown Story Mode chapter.' using errcode = '22023';
  end if;

  insert into public.story_chapter_progress(user_id, chapter_id)
  values (auth.uid(), p_chapter_id)
  on conflict (user_id, chapter_id) do nothing
  returning completed_at into v_completed_at;

  if v_completed_at is null then
    v_already_completed := true;
    select p.completed_at into v_completed_at
    from public.story_chapter_progress p
    where p.user_id = auth.uid() and p.chapter_id = p_chapter_id;
  end if;

  return jsonb_build_object(
    'chapter_id', p_chapter_id,
    'completed_at', v_completed_at,
    'already_completed', v_already_completed
  );
end;
$function$;
revoke all on function public.complete_story_chapter(text) from public, anon;
grant execute on function public.complete_story_chapter(text) to authenticated;

commit;
