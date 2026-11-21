-- AFTER HOURS: an accepted participant's withdrawn consent must block run reactivation.
begin;
create schema if not exists private;
create or replace function private.guard_afterhours_experience_run_activation()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.status = 'active' and old.status is distinct from 'active' then
    if not exists (
      select 1 from public.afterhours_experience_run_consents c
      where c.run_id = new.id and c.user_id = new.user_id and c.revoked_at is null
    ) then
      raise exception 'Fresh owner consent is required before this experience can be active.';
    end if;
    if exists (
      select 1 from public.afterhours_experience_invitations i
      where i.run_id = new.id and i.status = 'accepted' and i.accepted_user_id is not null
        and not exists (
          select 1 from public.afterhours_experience_run_consents c
          where c.run_id = i.run_id and c.user_id = i.accepted_user_id and c.revoked_at is null
        )
    ) then
      raise exception 'A participant has withdrawn consent. Create a new invitation and obtain fresh consent before restarting.';
    end if;
  end if;
  return new;
end;
$$;
revoke all on function private.guard_afterhours_experience_run_activation() from public, anon, authenticated;
drop trigger if exists afterhours_experience_run_activation_guard on public.afterhours_experience_runs;
create trigger afterhours_experience_run_activation_guard before update of status on public.afterhours_experience_runs
for each row execute function private.guard_afterhours_experience_run_activation();
commit;
