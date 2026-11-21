\set ON_ERROR_STOP on

create role anon nologin;
create role authenticated nologin;
create schema auth;
create schema private;

create table auth.users (id uuid primary key);
create function auth.uid() returns uuid
language sql stable
as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;

create table public.afterhours_experience_runs (
  id uuid primary key,
  user_id uuid not null references auth.users(id),
  scene_key text not null,
  scene_snapshot jsonb not null default '{}'::jsonb,
  status text not null check (status in ('ready','active','paused','completed','stopped')),
  current_step integer not null,
  total_steps integer not null,
  consent_version text not null default '1.0',
  interaction_log jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.afterhours_experience_run_consents (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.afterhours_experience_runs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  consent_version text not null,
  consented_at timestamptz not null default now(),
  revoked_at timestamptz,
  unique (run_id,user_id)
);
create table public.afterhours_experience_invitations (
  id uuid primary key,
  run_id uuid not null references public.afterhours_experience_runs(id) on delete cascade,
  inviter_user_id uuid not null references auth.users(id),
  token_hash text not null unique,
  status text not null,
  accepted_user_id uuid references auth.users(id),
  accepted_at timestamptz,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

grant usage on schema public, auth, private to authenticated;
grant select, update on public.afterhours_experience_runs to authenticated;
grant select on public.afterhours_experience_run_consents to authenticated;
alter table public.afterhours_experience_runs enable row level security;
alter table public.afterhours_experience_run_consents enable row level security;
create policy afterhours_experience_runs_select_owner_or_consented
  on public.afterhours_experience_runs for select to authenticated
  using (
    user_id = (select auth.uid())
    or exists (
      select 1 from public.afterhours_experience_run_consents c
      where c.run_id = afterhours_experience_runs.id
        and c.user_id = (select auth.uid())
        and c.revoked_at is null
    )
  );
create policy afterhours_experience_runs_update_own
  on public.afterhours_experience_runs for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy afterhours_run_consents_select_self
  on public.afterhours_experience_run_consents for select to authenticated
  using (user_id = (select auth.uid()));

\i supabase/proposals/20261121001230_afterhours_shared_run_checkins.sql

insert into auth.users(id) values
  ('00000000-0000-4000-8000-000000000001'),
  ('00000000-0000-4000-8000-000000000002'),
  ('00000000-0000-4000-8000-000000000003'),
  ('00000000-0000-4000-8000-000000000004');

insert into public.afterhours_experience_runs(id,user_id,scene_key,status,current_step,total_steps)
values
  ('10000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000001','couple-test','paused',1,3),
  ('10000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000004','private-test','paused',0,2);

insert into public.afterhours_experience_run_consents(run_id,user_id,consent_version,consented_at,revoked_at)
values
  ('10000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000001','1.0',now()-interval '1 hour',now()),
  ('10000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000002','1.0',now()-interval '1 hour',now());

insert into public.afterhours_experience_invitations(id,run_id,inviter_user_id,token_hash,status,accepted_user_id,accepted_at,expires_at)
values
  ('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000001',repeat('a',64),'accepted','00000000-0000-4000-8000-000000000002',now()-interval '1 hour',now()+interval '6 days'),
  ('20000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000001',repeat('b',64),'pending',null,null,now()+interval '6 days');

set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000002',false);

do $$
declare visible_runs integer;
begin
  select count(*) into visible_runs
  from public.afterhours_experience_runs
  where id='10000000-0000-4000-8000-000000000001';
  if visible_runs <> 1 then
    raise exception 'Accepted invitee cannot see paused run after consent revocation.';
  end if;
end $$;

select public.renew_afterhours_experience_consent('10000000-0000-4000-8000-000000000001');

do $$
declare active_consents integer;
begin
  select count(*) into active_consents
  from public.afterhours_experience_run_consents
  where run_id='10000000-0000-4000-8000-000000000001'
    and user_id=auth.uid()
    and revoked_at is null;
  if active_consents <> 1 then
    raise exception 'Fresh participant consent was not saved.';
  end if;
end $$;

insert into public.afterhours_experience_run_checkins(run_id,user_id,step_index,signal)
values ('10000000-0000-4000-8000-000000000001',auth.uid(),1,'ready');

do $$
declare visible_private_runs integer;
begin
  select count(*) into visible_private_runs
  from public.afterhours_experience_runs
  where id='10000000-0000-4000-8000-000000000002';
  if visible_private_runs <> 0 then
    raise exception 'Uninvited account can see another paused run.';
  end if;
end $$;

do $$
begin
  begin
    insert into public.afterhours_experience_run_checkins(run_id,user_id,step_index,signal)
    values ('10000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000001',1,'ready');
    raise exception 'A participant inserted a check-in for another account.';
  exception when insufficient_privilege then
    null;
  end;
end $$;

do $$
begin
  begin
    insert into public.afterhours_experience_run_checkins(run_id,user_id,step_index,signal)
    values ('10000000-0000-4000-8000-000000000001',auth.uid(),2,'ready');
    raise exception 'A participant inserted a check-in for a non-current step.';
  exception when insufficient_privilege then
    null;
  end;
end $$;

do $$
begin
  begin
    update public.afterhours_experience_run_checkins
    set user_id='00000000-0000-4000-8000-000000000003'
    where run_id='10000000-0000-4000-8000-000000000001';
    raise exception 'A participant changed check-in identity.';
  exception when others then
    if sqlerrm <> 'Check-in identity fields are immutable.' then raise; end if;
  end;
end $$;

reset role;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000001',false);
set role authenticated;

do $$
declare host_visible_checkins integer;
begin
  select count(*) into host_visible_checkins
  from public.afterhours_experience_run_checkins
  where run_id='10000000-0000-4000-8000-000000000001';
  if host_visible_checkins <> 1 then
    raise exception 'Run owner cannot see the participant check-in.';
  end if;
end $$;

reset role;
do $$
begin
  begin
    update public.afterhours_experience_invitations
    set status='accepted', accepted_user_id='00000000-0000-4000-8000-000000000003', accepted_at=now()
    where id='20000000-0000-4000-8000-000000000002';
    raise exception 'A third account was accepted into a two-person run.';
  exception when unique_violation then
    null;
  end;
end $$;

\echo 'Shared-run check-in integration tests passed.'
