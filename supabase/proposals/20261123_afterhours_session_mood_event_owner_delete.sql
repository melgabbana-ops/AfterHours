-- PROPOSAL ONLY: owner-scoped deletion for one private mood-history event.
-- This file is intentionally outside supabase/migrations/.
-- Review against the live schema and migration ledger before applying.
-- No production database change is made by committing this proposal.

begin;

create function public.delete_session_mood_event(p_event_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user uuid := auth.uid();
  v_deleted integer := 0;
begin
  if v_user is null then
    raise exception 'Authentication required.' using errcode = '42501';
  end if;

  if p_event_id is null then
    raise exception 'Mood event id is required.' using errcode = '22023';
  end if;

  -- Never trust a caller-supplied profile id. The authenticated identity
  -- is the only ownership source, and a missing/foreign row is indistinguishable.
  delete from public.session_mood_events as mood_event
  where mood_event.id = p_event_id
    and mood_event.profile_id = v_user;

  get diagnostics v_deleted = row_count;
  return v_deleted = 1;
end;
$function$;

-- Keep the table append-only for browser clients. Deletion is exposed only
-- through the narrowly scoped, authenticated, owner-filtered RPC above.
revoke all on function public.delete_session_mood_event(uuid) from public, anon;
grant execute on function public.delete_session_mood_event(uuid) to authenticated;

commit;
