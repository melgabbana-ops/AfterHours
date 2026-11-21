-- Verify the run-first lock order and public/private privilege boundary.
do $definition_tests$
declare v_definition text; v_run_lock integer; v_invite_lock integer;
begin
  select regexp_replace(lower(pg_get_functiondef('private.accept_afterhours_experience_invitation_impl(text)'::regprocedure)), '\s+', '', 'g') into v_definition;
  v_run_lock:=position('whereid=v_locked_run_id' in v_definition);
  v_invite_lock:=position('whereid=v_invitation.id' in v_definition);
  if v_run_lock=0 or v_invite_lock=0 or v_run_lock>v_invite_lock then
    raise exception 'Accept RPC must lock the run before locking the invitation';
  end if;
  if position('forupdate' in v_definition)=0 then raise exception 'Accept RPC must lock its rows'; end if;
  if exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname in (
      'preview_afterhours_experience_invitation','accept_afterhours_experience_invitation','withdraw_afterhours_experience_consent'
    ) and p.prosecdef) then
    raise exception 'Public invitation RPC wrappers must be SECURITY INVOKER';
  end if;
  if exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='private' and p.proname in (
      'preview_afterhours_experience_invitation_impl','accept_afterhours_experience_invitation_impl','withdraw_afterhours_experience_consent_impl'
    ) and not p.prosecdef) then
    raise exception 'Private invitation implementations must be SECURITY DEFINER';
  end if;
  if not exists(select 1 from pg_trigger where tgname='afterhours_invitation_paused_run_guard' and not tgisinternal)
     or not exists(select 1 from pg_trigger where tgname='afterhours_experience_run_activation_guard' and not tgisinternal) then
    raise exception 'Invitation and run activation guards must be installed';
  end if;
  if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='private' and p.proname='guard_afterhours_invitation_run_paused' and p.prosecdef)
     or not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='private' and p.proname='guard_afterhours_experience_run_activation' and p.prosecdef) then
    raise exception 'Private invitation trigger guards must be SECURITY DEFINER';
  end if;
end; $definition_tests$;

-- Explicitly grant the fixture's authenticated role the table operations exercised below.
grant select,insert,update on public.afterhours_experience_runs,public.afterhours_experience_run_consents,public.afterhours_experience_invitations to authenticated;

set role authenticated;
do $tests$
declare v_result jsonb; v_status text; v_revoked timestamptz; v_new_run_id uuid;
begin
  perform set_config('request.jwt.claim.sub','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',false);
  v_result:=public.preview_afterhours_experience_invitation(repeat('a',64));
  if v_result->>'title'<>'Private scene' or jsonb_array_length(v_result->'steps')<>1 then raise exception 'Invite preview returned incomplete scene data: %',v_result; end if;
  if v_result ? 'inviter_user_id' or v_result ? 'token_hash' then raise exception 'Invite preview leaked internal invitation identifiers'; end if;

  v_result:=public.accept_afterhours_experience_invitation(repeat('a',64));
  if v_result->>'status'<>'accepted' then raise exception 'Valid paused-run invitation was not accepted: %',v_result; end if;
  if not exists(select 1 from public.afterhours_experience_run_consents where run_id='11111111-1111-4111-8111-111111111111' and user_id='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' and revoked_at is null) then
    raise exception 'Acceptance did not create fresh participant consent';
  end if;

  begin
    perform public.accept_afterhours_experience_invitation(repeat('a',64));
    raise exception 'A one-time invitation was accepted twice' using errcode='ZX001';
  exception when sqlstate 'P0002' then null;
  end;
  begin
    perform public.preview_afterhours_experience_invitation(repeat('b',64));
    raise exception 'An active run invitation should not be previewable' using errcode='ZX002';
  exception when sqlstate 'P0002' then null;
  end;
  begin
    perform public.accept_afterhours_experience_invitation(repeat('b',64));
    raise exception 'An active run invitation should not be accepted' using errcode='ZX003';
  exception when sqlstate 'P0002' then null;
  end;
  begin
    perform public.accept_afterhours_experience_invitation(repeat('c',64));
    raise exception 'An expired invitation should not be accepted' using errcode='ZX004';
  exception when sqlstate 'P0002' then null;
  end;
  begin
    perform public.accept_afterhours_experience_invitation('invalid');
    raise exception 'Malformed invitation hash should not be accepted' using errcode='ZX005';
  exception when sqlstate '22023' then null;
  end;

  perform set_config('request.jwt.claim.sub','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',false);
  begin
    perform public.accept_afterhours_experience_invitation(repeat('d',64));
    raise exception 'An inviter accepted their own invitation' using errcode='ZX006';
  exception when sqlstate '22023' then null;
  end;
  begin
    perform public.preview_afterhours_experience_invitation(repeat('d',64));
    raise exception 'An inviter previewed their own invitation' using errcode='ZX007';
  exception when sqlstate '22023' then null;
  end;

  begin
    insert into public.afterhours_experience_runs(user_id,scene_key,scene_snapshot,status,total_steps)
    values('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','direct-active','{}'::jsonb,'active',1);
    raise exception 'A run was inserted active without owner consent' using errcode='ZX011';
  exception when sqlstate '42501' then null;
  end;
  insert into public.afterhours_experience_runs(user_id,scene_key,scene_snapshot,status,total_steps)
  values('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','consent-first','{}'::jsonb,'paused',1)
  returning id into v_new_run_id;
  insert into public.afterhours_experience_run_consents(run_id,user_id,consent_version)
  values(v_new_run_id,'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','1.0');
  update public.afterhours_experience_runs set status='active'
  where id=v_new_run_id and status='paused';
  if not exists(select 1 from public.afterhours_experience_runs where id=v_new_run_id and status='active') then
    raise exception 'A run could not activate after fresh owner consent was recorded';
  end if;

  insert into public.afterhours_experience_invitations(run_id,inviter_user_id,token_hash,expires_at)
  values('33333333-3333-4333-8333-333333333333','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',repeat('7',64),now()+interval '1 day');
  begin
    insert into public.afterhours_experience_invitations(run_id,inviter_user_id,token_hash,expires_at)
    values('22222222-2222-4222-8222-222222222222','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',repeat('f',64),now()+interval '1 day');
    raise exception 'An invitation was inserted for an active run' using errcode='ZX009';
  exception when sqlstate '42501' then null;
  end;
  begin
    update public.afterhours_experience_runs set status='active'
    where id='44444444-4444-4444-8444-444444444444';
    raise exception 'Host resumed while an invitation was still pending' using errcode='ZX010';
  exception when sqlstate '42501' then null;
  end;
  update public.afterhours_experience_invitations set status='revoked' where token_hash=repeat('e',64);
  update public.afterhours_experience_runs set status='active' where id='44444444-4444-4444-8444-444444444444';
  if not exists(select 1 from public.afterhours_experience_runs where id='44444444-4444-4444-8444-444444444444' and status='active') then
    raise exception 'Host could not resume after resolving the pending invitation';
  end if;

  perform set_config('request.jwt.claim.sub','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',false);
  v_result:=public.withdraw_afterhours_experience_consent('11111111-1111-4111-8111-111111111111');
  if v_result->>'status'<>'stopped' then raise exception 'Consent withdrawal did not stop the shared run: %',v_result; end if;
  select status into v_status from public.afterhours_experience_runs where id='11111111-1111-4111-8111-111111111111';
  select revoked_at into v_revoked from public.afterhours_experience_run_consents where run_id='11111111-1111-4111-8111-111111111111' and user_id='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  if v_status<>'stopped' or v_revoked is null then raise exception 'Consent withdrawal did not revoke and stop atomically'; end if;
  begin
    perform public.withdraw_afterhours_experience_consent('11111111-1111-4111-8111-111111111111');
    raise exception 'A second consent withdrawal unexpectedly succeeded' using errcode='ZX008';
  exception when sqlstate 'P0002' then null;
  end;

  if has_function_privilege('anon','public.accept_afterhours_experience_invitation(text)','EXECUTE')
     or has_function_privilege('anon','public.preview_afterhours_experience_invitation(text)','EXECUTE')
     or has_function_privilege('anon','public.withdraw_afterhours_experience_consent(uuid)','EXECUTE')
     or has_function_privilege('anon','private.accept_afterhours_experience_invitation_impl(text)','EXECUTE')
     or has_function_privilege('anon','private.preview_afterhours_experience_invitation_impl(text)','EXECUTE')
     or has_function_privilege('anon','private.withdraw_afterhours_experience_consent_impl(uuid)','EXECUTE')
     or has_function_privilege('anon','private.guard_afterhours_invitation_run_paused()','EXECUTE')
     or has_function_privilege('anon','private.guard_afterhours_experience_run_activation()','EXECUTE')
     or has_schema_privilege('anon','private','USAGE') then
    raise exception 'Anonymous role can execute or reach invitation RPCs';
  end if;
  if not has_function_privilege('authenticated','public.accept_afterhours_experience_invitation(text)','EXECUTE')
     or not has_function_privilege('authenticated','public.preview_afterhours_experience_invitation(text)','EXECUTE')
     or not has_function_privilege('authenticated','public.withdraw_afterhours_experience_consent(uuid)','EXECUTE')
     or not has_function_privilege('authenticated','private.accept_afterhours_experience_invitation_impl(text)','EXECUTE')
     or not has_function_privilege('authenticated','private.preview_afterhours_experience_invitation_impl(text)','EXECUTE')
     or not has_function_privilege('authenticated','private.withdraw_afterhours_experience_consent_impl(uuid)','EXECUTE')
     or has_function_privilege('authenticated','private.guard_afterhours_invitation_run_paused()','EXECUTE')
     or has_function_privilege('authenticated','private.guard_afterhours_experience_run_activation()','EXECUTE')
     or not has_schema_privilege('authenticated','private','USAGE') then
    raise exception 'Authenticated role cannot reach the approved invitation RPC path';
  end if;
end; $tests$;
reset role;
select 'Secret Invitation RPC hardening checks passed.' as result;
