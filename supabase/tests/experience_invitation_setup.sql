-- Disposable PostgreSQL fixture for Secret Invitation RPC hardening.
create extension if not exists pgcrypto;
do $roles$
begin
  if not exists(select 1 from pg_roles where rolname='anon') then create role anon nologin; end if;
  if not exists(select 1 from pg_roles where rolname='authenticated') then create role authenticated nologin; end if;
end; $roles$;
create schema if not exists auth;
create or replace function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid;
$$;
grant usage on schema auth to authenticated;
grant execute on function auth.uid() to authenticated;
create table auth.users(id uuid primary key);
create table public.afterhours_experience_runs(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  scene_key text not null,
  scene_snapshot jsonb not null,
  status text not null default 'ready' check(status in('ready','active','paused','completed','stopped')),
  current_step integer not null default 0,
  total_steps integer not null default 1,
  consent_version text not null default '1.0',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz
);
create table public.afterhours_experience_run_consents(
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.afterhours_experience_runs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  consent_version text not null default '1.0',
  consented_at timestamptz not null default now(),
  revoked_at timestamptz,
  unique(run_id,user_id)
);
create table public.afterhours_experience_invitations(
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.afterhours_experience_runs(id) on delete cascade,
  inviter_user_id uuid not null references auth.users(id) on delete cascade,
  token_hash text not null unique,
  status text not null default 'pending' check(status in('pending','accepted','revoked','expired')),
  accepted_user_id uuid references auth.users(id) on delete set null,
  accepted_at timestamptz,
  expires_at timestamptz not null default(now()+interval '7 days'),
  created_at timestamptz not null default now(),
  check((status='accepted')=(accepted_user_id is not null and accepted_at is not null))
);
grant select on public.afterhours_experience_runs,public.afterhours_experience_run_consents,public.afterhours_experience_invitations to authenticated;
insert into auth.users(id) values
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
 ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'),
 ('cccccccc-cccc-4ccc-8ccc-cccccccccccc');
insert into public.afterhours_experience_runs(id,user_id,scene_key,scene_snapshot,status,total_steps) values
 ('11111111-1111-4111-8111-111111111111','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','scene-one','{"title":"Private scene","description":"A safe test","steps":[{"title":"Step 1"}]}'::jsonb,'paused',1),
 ('22222222-2222-4222-8222-222222222222','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','scene-two','{"title":"Active scene","steps":[]}'::jsonb,'active',1),
 ('33333333-3333-4333-8333-333333333333','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','scene-three','{"title":"Expired scene","steps":[]}'::jsonb,'paused',1);
insert into public.afterhours_experience_run_consents(run_id,user_id,consent_version) values
 ('11111111-1111-4111-8111-111111111111','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','1.0'),
 ('22222222-2222-4222-8222-222222222222','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','1.0'),
 ('33333333-3333-4333-8333-333333333333','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','1.0');
insert into public.afterhours_experience_invitations(id,run_id,inviter_user_id,token_hash,expires_at) values
 ('aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa','11111111-1111-4111-8111-111111111111','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',repeat('a',64),now()+interval '1 day'),
 ('bbbbbbbb-1111-4111-8111-bbbbbbbbbbbb','22222222-2222-4222-8222-222222222222','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',repeat('b',64),now()+interval '1 day'),
 ('cccccccc-1111-4111-8111-cccccccccccc','33333333-3333-4333-8333-333333333333','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',repeat('c',64),now()-interval '1 day'),
 ('dddddddd-1111-4111-8111-dddddddddddd','11111111-1111-4111-8111-111111111111','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',repeat('d',64),now()+interval '1 day');
