-- PROPOSAL ONLY: serialize invitation acceptance per experience and cap each shared run at two accounts.
-- Do not apply until explicitly reviewed and the live migration ledger is reconciled.
begin;

create or replace function public.accept_afterhours_experience_invitation(p_token_hash text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_invitation public.afterhours_experience_invitations%rowtype;
  v_run_status text;
  v_host_user_id uuid;
  v_active_member_count integer;
  v_already_member boolean;
begin
  if v_user_id is null then
    raise exception 'Sign in before accepting an invitation.' using errcode = '28000';
  end if;
  if p_token_hash is null or p_token_hash !~ '^[a-f0-9]{64}$' then
    raise exception 'This invitation link is invalid.' using errcode = '22023';
  end if;

  select * into v_invitation
  from public.afterhours_experience_invitations
  where token_hash = p_token_hash
  for update;

  if not found then
    raise exception 'This invitation link is invalid or has expired.' using errcode = 'P0002';
  end if;
  if v_user_id = v_invitation.inviter_user_id then
    raise exception 'You cannot accept your own invitation.' using errcode = '22023';
  end if;
  if v_invitation.status <> 'pending' or v_invitation.expires_at <= now() then
    if v_invitation.status = 'pending' and v_invitation.expires_at <= now() then
      update public.afterhours_experience_invitations
      set status = 'expired'
      where id = v_invitation.id;
    end if;
    raise exception 'This invitation is no longer available.' using errcode = 'P0002';
  end if;

  -- Lock the parent run so two different invitation tokens cannot race past the cap.
  select r.status, r.user_id
  into v_run_status, v_host_user_id
  from public.afterhours_experience_runs r
  where r.id = v_invitation.run_id
  for update;

  if not found or v_run_status <> 'paused' then
    raise exception 'The host must keep the experience paused until every invited participant has reviewed and accepted.'
      using errcode = 'P0002';
  end if;

  select exists (
    select 1
    from public.afterhours_experience_run_consents c
    where c.run_id = v_invitation.run_id
      and c.user_id = v_user_id
      and c.revoked_at is null
  ) into v_already_member;

  select count(*) into v_active_member_count
  from (
    select c.user_id
    from public.afterhours_experience_run_consents c
    where c.run_id = v_invitation.run_id
      and c.revoked_at is null
    union
    select v_host_user_id
  ) active_members;

  if not v_already_member and v_active_member_count >= 2 then
    raise exception 'This Duo experience already has its maximum of two participants.'
      using errcode = 'P0001';
  end if;

  insert into public.afterhours_experience_run_consents
    (run_id, user_id, consent_version, consented_at, revoked_at)
  values
    (v_invitation.run_id, v_user_id, '1.0', now(), null)
  on conflict (run_id, user_id) do update
    set consent_version = excluded.consent_version,
        consented_at = excluded.consented_at,
        revoked_at = null;

  update public.afterhours_experience_invitations
  set status = 'accepted',
      accepted_user_id = v_user_id,
      accepted_at = now()
  where id = v_invitation.id;

  return jsonb_build_object(
    'invitation_id', v_invitation.id,
    'run_id', v_invitation.run_id,
    'status', 'accepted',
    'accepted_at', now()
  );
end;
$$;

revoke all on function public.accept_afterhours_experience_invitation(text) from public, anon;
grant execute on function public.accept_afterhours_experience_invitation(text) to authenticated;

commit;
