-- Verify the run-first lock order and public/private privilege boundary.
do $definition_tests$
declare v_definition text; v_public_definer boolean; v_private_definer boolean;
begin
  select pg_get_functiondef('private.accept_afterhours_experience_invitation_impl(text)'::regprocedure) into v_definition;
  if position('where id = v_locked_run_id' in lower(v_definition))=0 and position('where id=v_locked_run_id' in lower(v_definition))=0 then
    raise exception 'Accept RPC must lock the run before locking the invitation';
  end if;
  if position('v_locked_run_id' in v_definition)=0 then raise exception 'Accept RPC is missing the locked run identity guard'; end if;
  select prosecdef into v_public_definer from pg_proc where oid='public.accept_afterhours_experience_invitation(text)'::regprocedure;
  select prosecdef into v_private_definer from pg_proc where oid='private.accept_afterhours_experience_invitation_impl(text)'::regprocedure;
  if v_public_definer then raise exception 'Public accept wrapper must be SECURITY INVOKER'; end if;
  if not v_private_definer then raise exception 'Private accept implementation must be SECURITY DEFINER'; end if;
end; $definition_tests$;

set role authenticated;
do $tests$
declare v_result jsonb; v_status text; v_revoked timestamptz;
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
     or has_function_privilege('anon','private.accept_afterhours_experience_invitation_impl(text)','EXECUTE')
     or has_schema_privilege('anon','private','USAGE') then
    raise exception 'Anonymous role can execute or reach invitation RPCs';
  end if;
  if not has_function_privilege('authenticated','public.accept_afterhours_experience_invitation(text)','EXECUTE')
     or not has_function_privilege('authenticated','private.accept_afterhours_experience_invitation_impl(text)','EXECUTE')
     or not has_schema_privilege('authenticated','private','USAGE') then
    raise exception 'Authenticated role cannot reach the approved invitation RPC path';
  end if;
end; $tests$;
reset role;
select 'Secret Invitation RPC hardening checks passed.' as result;
