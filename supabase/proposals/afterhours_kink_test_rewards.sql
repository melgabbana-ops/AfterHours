-- PROPOSAL ONLY: secure, idempotent Kink Test XP award.
-- Apply only after reviewing the live migration ledger and approving the schema change.
begin;

create or replace function public.award_afterhours_kink_test_completion(p_test_version text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_profile public.profiles%rowtype;
  v_ledger_id uuid;
  v_reward integer := 120;
  v_event_key text;
begin
  if v_user_id is null then
    raise exception 'Log in to claim your Kink Test reward.' using errcode = '28000';
  end if;
  if p_test_version is distinct from 'ah-kink-profile-v1' then
    raise exception 'This Kink Test reward version is not available.' using errcode = '22023';
  end if;

  select * into v_profile
  from public.profiles
  where id = v_user_id
  for update;

  if not found then
    raise exception 'Profile not found.' using errcode = 'P0002';
  end if;

  v_event_key := 'kink-test-completion:' || p_test_version;

  insert into public.xp_event_ledger(
    profile_id, event_key, event_type, xp_earned, metadata
  ) values (
    v_user_id, v_event_key, 'achievement', v_reward,
    jsonb_build_object('test_version', p_test_version, 'reward', 'first_kink_profile_completion')
  )
  on conflict (profile_id, event_key) do nothing
  returning id into v_ledger_id;

  if v_ledger_id is null then
    return jsonb_build_object(
      'xp_earned', 0,
      'already_awarded', true,
      'total_xp', v_profile.xp
    );
  end if;

  update public.profiles
  set xp = xp + v_reward,
      level = floor((xp + v_reward) / 200) + 1
  where id = v_user_id
  returning * into v_profile;

  return jsonb_build_object(
    'xp_earned', v_reward,
    'already_awarded', false,
    'total_xp', v_profile.xp
  );
end;
$$;

revoke all on function public.award_afterhours_kink_test_completion(text) from public, anon;
grant execute on function public.award_afterhours_kink_test_completion(text) to authenticated;

commit;
