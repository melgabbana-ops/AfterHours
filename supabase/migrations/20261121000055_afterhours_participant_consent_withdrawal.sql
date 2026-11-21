-- AFTER HOURS: participants can withdraw consent; withdrawal stops the shared run atomically.
begin;
drop policy if exists afterhours_run_consents_select_participant_or_owner on public.afterhours_experience_run_consents;
create policy afterhours_run_consents_select_self on public.afterhours_experience_run_consents for select to authenticated using (user_id = (select auth.uid()));
create or replace function public.withdraw_afterhours_experience_consent(p_run_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_user_id uuid := auth.uid();
  v_now timestamptz := clock_timestamp();
  v_consent_id uuid;
begin
  if v_user_id is null then raise exception 'Sign in before withdrawing consent.' using errcode = '28000'; end if;
  perform 1 from public.afterhours_experience_runs where id = p_run_id for update;
  if not found then raise exception 'This experience could not be found.' using errcode = 'P0002'; end if;
  update public.afterhours_experience_run_consents set revoked_at = v_now
  where run_id = p_run_id and user_id = v_user_id and revoked_at is null
  returning id into v_consent_id;
  if v_consent_id is null then raise exception 'No active consent was found for this account.' using errcode = 'P0002'; end if;
  update public.afterhours_experience_runs set status = 'stopped', updated_at = v_now
  where id = p_run_id and status in ('active','paused');
  return jsonb_build_object('run_id', p_run_id, 'status', 'stopped', 'revoked_at', v_now);
end;
$$;
revoke all on function public.withdraw_afterhours_experience_consent(uuid) from public, anon;
grant execute on function public.withdraw_afterhours_experience_consent(uuid) to authenticated;
alter table public.afterhours_experience_invitations drop constraint if exists afterhours_experience_invitations_accepted_user_id_fkey;
alter table public.afterhours_experience_invitations add constraint afterhours_experience_invitations_accepted_user_id_fkey
  foreign key (accepted_user_id) references auth.users(id) on delete cascade;
commit;
