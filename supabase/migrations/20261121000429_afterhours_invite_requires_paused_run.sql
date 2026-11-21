-- AFTER HOURS: shared invitations can only be previewed and accepted while the host's run is paused.
create or replace function public.accept_afterhours_experience_invitation(p_token_hash text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_user_id uuid := auth.uid();
  v_invitation public.afterhours_experience_invitations%rowtype;
  v_run_status text;
begin
  if v_user_id is null then raise exception 'Sign in before accepting an invitation.' using errcode = '28000'; end if;
  if p_token_hash is null or p_token_hash !~ '^[a-f0-9]{64}$' then raise exception 'This invitation link is invalid.' using errcode = '22023'; end if;
  select * into v_invitation from public.afterhours_experience_invitations where token_hash = p_token_hash for update;
  if not found then raise exception 'This invitation link is invalid or has expired.' using errcode = 'P0002'; end if;
  if v_user_id = v_invitation.inviter_user_id then raise exception 'You cannot accept your own invitation.' using errcode = '22023'; end if;
  if v_invitation.status <> 'pending' or v_invitation.expires_at <= now() then
    if v_invitation.status = 'pending' and v_invitation.expires_at <= now() then update public.afterhours_experience_invitations set status = 'expired' where id = v_invitation.id; end if;
    raise exception 'This invitation is no longer available.' using errcode = 'P0002';
  end if;
  select status into v_run_status from public.afterhours_experience_runs where id = v_invitation.run_id;
  if v_run_status <> 'paused' then raise exception 'The host must keep the experience paused until every invited participant has reviewed and accepted.' using errcode = 'P0002'; end if;
  insert into public.afterhours_experience_run_consents (run_id, user_id, consent_version, consented_at, revoked_at)
  values (v_invitation.run_id, v_user_id, '1.0', now(), null)
  on conflict (run_id, user_id) do update set consent_version = excluded.consent_version, consented_at = excluded.consented_at, revoked_at = null;
  update public.afterhours_experience_invitations set status = 'accepted', accepted_user_id = v_user_id, accepted_at = now() where id = v_invitation.id;
  return jsonb_build_object('invitation_id', v_invitation.id, 'run_id', v_invitation.run_id, 'status', 'accepted', 'accepted_at', now());
end;
$$;
create or replace function public.preview_afterhours_experience_invitation(p_token_hash text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_user_id uuid := auth.uid();
  v_invitation public.afterhours_experience_invitations%rowtype;
  v_snapshot jsonb;
  v_run_status text;
begin
  if v_user_id is null then raise exception 'Sign in to preview this invitation.' using errcode = '28000'; end if;
  if p_token_hash is null or p_token_hash !~ '^[a-f0-9]{64}$' then raise exception 'This invitation link is invalid.' using errcode = '22023'; end if;
  select * into v_invitation from public.afterhours_experience_invitations where token_hash = p_token_hash;
  if not found or v_invitation.status <> 'pending' or v_invitation.expires_at <= now() then raise exception 'This invitation is no longer available.' using errcode = 'P0002'; end if;
  if v_invitation.inviter_user_id = v_user_id then raise exception 'You cannot preview your own invitation.' using errcode = '22023'; end if;
  select status, scene_snapshot into v_run_status, v_snapshot from public.afterhours_experience_runs where id = v_invitation.run_id;
  if v_run_status <> 'paused' then raise exception 'The host must keep the experience paused while you review the invitation.' using errcode = 'P0002'; end if;
  return jsonb_build_object('run_id', v_invitation.run_id, 'title', coalesce(v_snapshot->>'title', 'AFTER HOURS experience'), 'description', coalesce(v_snapshot->>'description', ''), 'steps', coalesce(v_snapshot->'steps', '[]'::jsonb), 'expires_at', v_invitation.expires_at);
end;
$$;
