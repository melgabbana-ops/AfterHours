-- Disposable PostgreSQL fixture; this is not a Supabase or production connection.
create extension if not exists pgcrypto;
do $roles$
begin
  if not exists(select 1 from pg_roles where rolname='anon') then create role anon nologin; end if;
  if not exists(select 1 from pg_roles where rolname='authenticated') then create role authenticated nologin; end if;
end;
$roles$;
create schema if not exists auth;
create or replace function auth.uid() returns uuid language sql stable as $function$
  select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid;
$function$;
grant usage on schema auth to authenticated;
grant execute on function auth.uid() to authenticated;
create table auth.users(id uuid primary key);
create table public.profiles(
  id uuid primary key references auth.users(id) on delete cascade,
  xp integer not null default 0,
  level integer not null default 1
);
create table public.sessions(
  id uuid primary key,
  profile_id uuid not null references public.profiles(id),
  status text not null
);
create table public.consent_records(
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id),
  status text not null,
  created_at timestamptz not null default now()
);
create table public.xp_event_ledger(
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  event_key text not null,
  event_type text not null check(event_type in(
    'session_completion','command_completion','daily_mission','weekly_mission',
    'special_mission','achievement','streak','first_session'
  )),
  source_session_id uuid references public.sessions(id) on delete set null,
  xp_earned integer not null check(xp_earned>0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(profile_id,event_key)
);
insert into auth.users(id) values
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
 ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');
insert into public.profiles(id,xp,level) values
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',0,1),
 ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',0,1);
insert into public.sessions(id,profile_id,status) values
 ('11111111-1111-4111-8111-111111111111','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','active'),
 ('22222222-2222-4222-8222-222222222222','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','active'),
 ('33333333-3333-4333-8333-333333333333','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','paused'),
 ('44444444-4444-4444-8444-444444444444','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','stopped');
insert into public.consent_records(session_id,status,created_at) values
 ('11111111-1111-4111-8111-111111111111','active',now()),
 ('22222222-2222-4222-8222-222222222222','revoked',now()),
 ('33333333-3333-4333-8333-333333333333','active',now()),
 ('44444444-4444-4444-8444-444444444444','active',now());
