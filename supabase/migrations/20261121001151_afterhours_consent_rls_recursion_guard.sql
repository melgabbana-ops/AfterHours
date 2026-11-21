-- Avoid recursive RLS evaluation when consent policies verify run ownership.
-- The helper runs as its owner and validates the caller identity explicitly.
create or replace function private.afterhours_is_run_owner(p_run_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select p_user_id = auth.uid()
    and exists (
      select 1
      from public.afterhours_experience_runs r
      where r.id = p_run_id
        and r.user_id = p_user_id
    );
$function$;

revoke all on function private.afterhours_is_run_owner(uuid, uuid) from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.afterhours_is_run_owner(uuid, uuid) to authenticated;

drop policy if exists afterhours_run_consents_insert_own
  on public.afterhours_experience_run_consents;
create policy afterhours_run_consents_insert_own
  on public.afterhours_experience_run_consents
  for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and (select private.afterhours_is_run_owner(run_id, user_id))
  );

drop policy if exists afterhours_run_consents_update_own
  on public.afterhours_experience_run_consents;
create policy afterhours_run_consents_update_own
  on public.afterhours_experience_run_consents
  for update
  to authenticated
  using (
    user_id = (select auth.uid())
    and (select private.afterhours_is_run_owner(run_id, user_id))
  )
  with check (
    user_id = (select auth.uid())
    and (select private.afterhours_is_run_owner(run_id, user_id))
  );
