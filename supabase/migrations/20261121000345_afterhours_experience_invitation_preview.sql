-- AFTER HOURS: authenticated invitees can inspect the exact scene before consenting.
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
  if not found or v_invitation.status <> 'pending' or v_invitation.expires_at <= now() then
    raise exception 'This invitation is no longer available.' using errcode = 'P0002';
  end if;
  if v_invitation.inviter_user_id = v_user_id then raise exception 'You cannot preview your own invitation.' using errcode = '22023'; end if;
  select status, scene_snapshot into v_run_status, v_snapshot
  from public.afterhours_experience_runs where id = v_invitation.run_id;
  if v_run_status not in ('active','paused') then raise exception 'This experience is no longer accepting participants.' using errcode = 'P0002'; end if;
  return jsonb_build_object(
    'run_id', v_invitation.run_id,
    'title', coalesce(v_snapshot->>'title', 'AFTER HOURS experience'),
    'description', coalesce(v_snapshot->>'description', ''),
    'steps', coalesce(v_snapshot->'steps', '[]'::jsonb),
    'expires_at', v_invitation.expires_at
  );
end;
$$;
revoke all on function public.preview_afterhours_experience_invitation(text) from public, anon;
grant execute on function public.preview_afterhours_experience_invitation(text) to authenticated;
