begin;
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create or replace function private.preview_afterhours_experience_invitation_impl(p_token_hash text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_user_id uuid := auth.uid();
  v_invitation public.afterhours_experience_invitations%rowtype;
  v_snapshot jsonb;
  v_run_status text;
begin
  if v_user_id is null then raise exception 'Sign in to preview this invitation.' using errcode='28000'; end if;
  if p_token_hash is null or p_token_hash !~ '^[a-f0-9]{64}$' then raise exception 'This invitation link is invalid.' using errcode='22023'; end if;
  select * into v_invitation from public.afterhours_experience_invitations where token_hash=p_token_hash;
  if not found or v_invitation.status<>'pending' or v_invitation.expires_at<=now() then
    raise exception 'This invitation is no longer available.' using errcode='P0002';
  end if;
  if v_invitation.inviter_user_id=v_user_id then raise exception 'You cannot preview your own invitation.' using errcode='22023'; end if;
  select status,scene_snapshot into v_run_status,v_snapshot from public.afterhours_experience_runs where id=v_invitation.run_id;
  if not found then raise exception 'The experience could not be found.' using errcode='P0002'; end if;
  if v_run_status<>'paused' then raise exception 'The host must keep the experience paused while you review the invitation.' using errcode='P0002'; end if;
  return jsonb_build_object('run_id',v_invitation.run_id,'title',coalesce(v_snapshot->>'title','AFTER HOURS experience'),'description',coalesce(v_snapshot->>'description',''),'steps',coalesce(v_snapshot->'steps','[]'::jsonb),'expires_at',v_invitation.expires_at);
end; $$;

create or replace function private.accept_afterhours_experience_invitation_impl(p_token_hash text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_user_id uuid := auth.uid();
  v_invitation public.afterhours_experience_invitations%rowtype;
  v_run_status text;
  v_locked_run_id uuid;
begin
  if v_user_id is null then raise exception 'Sign in before accepting an invitation.' using errcode='28000'; end if;
  if p_token_hash is null or p_token_hash !~ '^[a-f0-9]{64}$' then raise exception 'This invitation link is invalid.' using errcode='22023'; end if;

  -- Lock order is run then invitation, matching host resume/delete paths.
  select * into v_invitation from public.afterhours_experience_invitations where token_hash=p_token_hash;
  if not found then raise exception 'This invitation link is invalid or has expired.' using errcode='P0002'; end if;
  v_locked_run_id:=v_invitation.run_id;
  select status into v_run_status from public.afterhours_experience_runs where id=v_locked_run_id for update;
  if not found then raise exception 'The experience could not be found.' using errcode='P0002'; end if;

  select * into v_invitation
  from public.afterhours_experience_invitations
  where id=v_invitation.id and token_hash=p_token_hash
  for update;
  if not found then raise exception 'This invitation link is invalid or has expired.' using errcode='P0002'; end if;
  if v_invitation.run_id<>v_locked_run_id then raise exception 'This invitation changed while it was being accepted. Please retry.' using errcode='40001'; end if;
  if v_user_id=v_invitation.inviter_user_id then raise exception 'You cannot accept your own invitation.' using errcode='22023'; end if;
  if v_invitation.status<>'pending' or v_invitation.expires_at<=now() then raise exception 'This invitation is no longer available.' using errcode='P0002'; end if;
  if v_run_status<>'paused' then raise exception 'The host must keep the experience paused until every invited participant has reviewed and accepted.' using errcode='P0002'; end if;

  insert into public.afterhours_experience_run_consents(run_id,user_id,consent_version,consented_at,revoked_at)
  values(v_invitation.run_id,v_user_id,'1.0',now(),null)
  on conflict(run_id,user_id) do update set consent_version=excluded.consent_version,consented_at=excluded.consented_at,revoked_at=null;
  update public.afterhours_experience_invitations set status='accepted',accepted_user_id=v_user_id,accepted_at=now() where id=v_invitation.id;
  return jsonb_build_object('invitation_id',v_invitation.id,'run_id',v_invitation.run_id,'status','accepted','accepted_at',now());
end; $$;

create or replace function private.withdraw_afterhours_experience_consent_impl(p_run_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_user_id uuid := auth.uid();
  v_now timestamptz := clock_timestamp();
  v_consent_id uuid;
begin
  if v_user_id is null then raise exception 'Sign in before withdrawing consent.' using errcode='28000'; end if;
  perform 1 from public.afterhours_experience_runs where id=p_run_id for update;
  if not found then raise exception 'This experience could not be found.' using errcode='P0002'; end if;
  update public.afterhours_experience_run_consents set revoked_at=v_now
  where run_id=p_run_id and user_id=v_user_id and revoked_at is null returning id into v_consent_id;
  if v_consent_id is null then raise exception 'No active consent was found for this account.' using errcode='P0002'; end if;
  update public.afterhours_experience_runs set status='stopped',updated_at=v_now where id=p_run_id and status in ('active','paused');
  return jsonb_build_object('run_id',p_run_id,'status','stopped','revoked_at',v_now);
end; $$;

-- Enforce paused-only invitation creation at the database boundary.
create or replace function private.guard_afterhours_invitation_run_paused()
returns trigger
language plpgsql
security definer
set search_path = ''
as $
declare
  v_run_status text;
begin
  select status into v_run_status
  from public.afterhours_experience_runs
  where id = new.run_id
  for update;
  if not found then raise exception 'The experience could not be found.' using errcode='P0002'; end if;
  if v_run_status <> 'paused' then
    raise exception 'Invitations can only be created while the host experience is paused.' using errcode='42501';
  end if;
  return new;
end;
$;
revoke all on function private.guard_afterhours_invitation_run_paused() from public, anon, authenticated;
drop trigger if exists afterhours_invitation_paused_run_guard on public.afterhours_experience_invitations;
create trigger afterhours_invitation_paused_run_guard
before insert or update of run_id on public.afterhours_experience_invitations
for each row execute function private.guard_afterhours_invitation_run_paused();

-- Do not let the host resume while any invitation is still pending or an
-- accepted participant has withdrawn consent.
create or replace function private.guard_afterhours_experience_run_activation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $
begin
  if new.status = 'active' and old.status is distinct from 'active' then
    if exists (
      select 1 from public.afterhours_experience_invitations i
      where i.run_id = new.id and i.status = 'pending' and i.expires_at > now()
    ) then
      raise exception 'Resolve or revoke pending invitations before resuming this experience.' using errcode='42501';
    end if;
    if not exists (
      select 1 from public.afterhours_experience_run_consents c
      where c.run_id = new.id and c.user_id = new.user_id and c.revoked_at is null
    ) then
      raise exception 'Fresh owner consent is required before this experience can be active.' using errcode='42501';
    end if;
    if exists (
      select 1 from public.afterhours_experience_invitations i
      where i.run_id = new.id and i.status = 'accepted' and i.accepted_user_id is not null
        and not exists (
          select 1 from public.afterhours_experience_run_consents c
          where c.run_id = i.run_id and c.user_id = i.accepted_user_id and c.revoked_at is null
        )
    ) then
      raise exception 'A participant has withdrawn consent. Create a new invitation and obtain fresh consent before restarting.' using errcode='42501';
    end if;
  end if;
  return new;
end;
$;
revoke all on function private.guard_afterhours_experience_run_activation() from public, anon, authenticated;

create or replace function public.preview_afterhours_experience_invitation(p_token_hash text)
returns jsonb language sql security invoker set search_path = '' as $$ select private.preview_afterhours_experience_invitation_impl(p_token_hash); $$;
create or replace function public.accept_afterhours_experience_invitation(p_token_hash text)
returns jsonb language sql security invoker set search_path = '' as $$ select private.accept_afterhours_experience_invitation_impl(p_token_hash); $$;
create or replace function public.withdraw_afterhours_experience_consent(p_run_id uuid)
returns jsonb language sql security invoker set search_path = '' as $$ select private.withdraw_afterhours_experience_consent_impl(p_run_id); $$;

revoke all on function private.preview_afterhours_experience_invitation_impl(text) from public,anon;
revoke all on function private.accept_afterhours_experience_invitation_impl(text) from public,anon;
revoke all on function private.withdraw_afterhours_experience_consent_impl(uuid) from public,anon;
grant execute on function private.preview_afterhours_experience_invitation_impl(text) to authenticated;
grant execute on function private.accept_afterhours_experience_invitation_impl(text) to authenticated;
grant execute on function private.withdraw_afterhours_experience_consent_impl(uuid) to authenticated;
revoke all on function public.preview_afterhours_experience_invitation(text) from public,anon;
revoke all on function public.accept_afterhours_experience_invitation(text) from public,anon;
revoke all on function public.withdraw_afterhours_experience_consent(uuid) from public,anon;
grant execute on function public.preview_afterhours_experience_invitation(text) to authenticated;
grant execute on function public.accept_afterhours_experience_invitation(text) to authenticated;
grant execute on function public.withdraw_afterhours_experience_consent(uuid) to authenticated;
commit;
