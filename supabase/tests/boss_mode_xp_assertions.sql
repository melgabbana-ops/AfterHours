-- The PASS event must never be admitted to the XP ledger.
do $ledger_test$
begin
  begin
    insert into public.xp_event_ledger(profile_id,event_key,event_type,source_session_id,xp_earned)
    values('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','pass-must-not-exist','pass','11111111-1111-4111-8111-111111111111',1);
    raise exception 'PASS event unexpectedly passed the ledger constraint' using errcode='ZX002';
  exception when check_violation then null;
  end;
end;
$ledger_test$;

-- Exercise the public SECURITY INVOKER wrapper as an authenticated API caller.
set role authenticated;
do $tests$
declare
  v_result jsonb;
  v_xp integer;
  v_level integer;
  v_count integer;
  v_index integer;
  v_public_definer boolean;
  v_private_definer boolean;
begin
  perform set_config('request.jwt.claim.sub','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',false);
  v_result:=public.complete_boss_mode_step('11111111-1111-4111-8111-111111111111',0);
  if (v_result->>'xp_earned')::integer<>25 or (v_result->>'step_xp')::integer<>25
     or (v_result->>'completion_bonus_xp')::integer<>0 or (v_result->>'already_awarded')::boolean then
    raise exception 'First explicit step did not award exactly 25 XP: %',v_result;
  end if;

  v_result:=public.complete_boss_mode_step('11111111-1111-4111-8111-111111111111',0);
  if (v_result->>'xp_earned')::integer<>0 or not (v_result->>'already_awarded')::boolean then
    raise exception 'Duplicate step awarded XP: %',v_result;
  end if;

  for v_index in 1..4 loop
    v_result:=public.complete_boss_mode_step('11111111-1111-4111-8111-111111111111',v_index);
    if v_index<4 and (v_result->>'xp_earned')::integer<>25 then
      raise exception 'Step % did not award 25 XP: %',v_index,v_result;
    end if;
    if v_index=4 and (
      (v_result->>'xp_earned')::integer<>100
      or (v_result->>'step_xp')::integer<>25
      or (v_result->>'completion_bonus_xp')::integer<>75
      or not (v_result->>'full_completion')::boolean
    ) then
      raise exception 'Fifth step did not award the +75 bonus exactly once: %',v_result;
    end if;
  end loop;

  select xp,level into v_xp,v_level from public.profiles where id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  if v_xp<>200 or v_level<>2 then raise exception 'Unexpected profile progression: xp %, level %',v_xp,v_level; end if;
  select count(*)::integer into v_count from public.xp_event_ledger
   where source_session_id='11111111-1111-4111-8111-111111111111' and event_type='boss_step_completion';
  if v_count<>5 then raise exception 'Expected five unique step events, found %',v_count; end if;
  select count(*)::integer into v_count from public.xp_event_ledger
   where source_session_id='11111111-1111-4111-8111-111111111111' and event_type='boss_run_completion';
  if v_count<>1 then raise exception 'Expected one completion bonus event, found %',v_count; end if;

  perform set_config('request.jwt.claim.sub','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',false);
  begin
    perform public.complete_boss_mode_step('11111111-1111-4111-8111-111111111111',0);
    raise exception 'Cross-account XP request unexpectedly succeeded' using errcode='ZX003';
  exception when sqlstate 'P0002' then null;
  end;

  perform set_config('request.jwt.claim.sub','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',false);
  begin
    perform public.complete_boss_mode_step('22222222-2222-4222-8222-222222222222',0);
    raise exception 'Revoked-consent XP request unexpectedly succeeded' using errcode='ZX004';
  exception when sqlstate '42501' then null;
  end;
  begin
    perform public.complete_boss_mode_step('33333333-3333-4333-8333-333333333333',0);
    raise exception 'Paused-session XP request unexpectedly succeeded' using errcode='ZX005';
  exception when sqlstate '42501' then null;
  end;
  begin
    perform public.complete_boss_mode_step('44444444-4444-4444-8444-444444444444',0);
    raise exception 'Stopped-session XP request unexpectedly succeeded' using errcode='ZX006';
  exception when sqlstate '42501' then null;
  end;

  select xp into v_xp from public.profiles where id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  if v_xp<>200 then raise exception 'Rejected safety/account requests changed XP: %',v_xp; end if;

  if has_function_privilege('anon','public.complete_boss_mode_step(uuid,integer)','EXECUTE') then
    raise exception 'Anonymous role unexpectedly has EXECUTE privilege on public wrapper';
  end if;
  if not has_function_privilege('authenticated','public.complete_boss_mode_step(uuid,integer)','EXECUTE') then
    raise exception 'Authenticated role is missing EXECUTE privilege on public wrapper';
  end if;
  if has_function_privilege('anon','private.complete_boss_mode_step_impl(uuid,integer)','EXECUTE')
     or has_schema_privilege('anon','private','USAGE') then
    raise exception 'Anonymous role can access the private implementation';
  end if;
  if not has_function_privilege('authenticated','private.complete_boss_mode_step_impl(uuid,integer)','EXECUTE')
     or not has_schema_privilege('authenticated','private','USAGE') then
    raise exception 'Authenticated wrapper cannot reach the private implementation';
  end if;

  select p.prosecdef into v_public_definer from pg_proc p
   where p.oid='public.complete_boss_mode_step(uuid,integer)'::regprocedure;
  select p.prosecdef into v_private_definer from pg_proc p
   where p.oid='private.complete_boss_mode_step_impl(uuid,integer)'::regprocedure;
  if v_public_definer then raise exception 'Public API wrapper must be SECURITY INVOKER'; end if;
  if not v_private_definer then raise exception 'Private implementation must be SECURITY DEFINER'; end if;
end;
$tests$;
reset role;
select 'Boss Mode XP PostgreSQL integration checks passed.' as result;
