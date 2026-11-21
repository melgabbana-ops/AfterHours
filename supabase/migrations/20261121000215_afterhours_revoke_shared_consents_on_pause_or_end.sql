-- AFTER HOURS: pause and end revoke every participant's consent, requiring fresh agreement on resume.
begin;
create or replace function private.revoke_afterhours_participant_consents_on_pause_or_end()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.status in ('paused','completed','stopped') and old.status is distinct from new.status then
    update public.afterhours_experience_run_consents
    set revoked_at = coalesce(revoked_at, clock_timestamp())
    where run_id = new.id and revoked_at is null;
  end if;
  return new;
end;
$$;
revoke all on function private.revoke_afterhours_participant_consents_on_pause_or_end() from public, anon, authenticated;
drop trigger if exists afterhours_revoke_consents_on_pause_or_end on public.afterhours_experience_runs;
create trigger afterhours_revoke_consents_on_pause_or_end
after update of status on public.afterhours_experience_runs
for each row execute function private.revoke_afterhours_participant_consents_on_pause_or_end();
commit;
