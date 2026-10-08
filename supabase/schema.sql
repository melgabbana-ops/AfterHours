-- AFTER HOURS production database contract
-- Supabase / PostgreSQL
-- Run this migration in the production Supabase project before enabling remote persistence.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $func$
begin
  new.updated_at = now();
  return new;
end;
$func$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Night Walker',
  username text unique,
  avatar_style text not null default 'sigil' check (avatar_style in ('sigil','collar','key','crown')),
  level integer not null default 1 check (level > 0),
  xp integer not null default 0 check (xp >= 0),
  sessions integer not null default 0 check (sessions >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'ready' check (status in ('ready','active','paused','completed','stopped')),
  round integer not null default 0 check (round >= 0),
  started_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.session_history (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  completed_at timestamptz not null default now(),
  xp_earned integer not null default 0 check (xp_earned >= 0),
  rounds integer not null default 0 check (rounds >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.consent_records (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  status text not null check (status in ('active','revoked')),
  confirmed_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  check (
    (status = 'active' and confirmed_at is not null and revoked_at is null)
    or
    (status = 'revoked' and revoked_at is not null)
  )
);

create table if not exists public.experience_rounds (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  body text not null,
  duration_seconds integer not null check (duration_seconds > 0),
  sort_order integer not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references auth.users(id) on delete restrict,
  action text not null,
  target_session_id uuid references public.sessions(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.sessions enable row level security;
alter table public.consent_records enable row level security;
alter table public.session_history enable row level security;
alter table public.experience_rounds enable row level security;
alter table public.admin_audit_log enable row level security;

drop policy if exists "profiles_self_read" on public.profiles;
drop policy if exists "profiles_self_insert" on public.profiles;
drop policy if exists "profiles_self_update" on public.profiles;

create policy "profiles_self_read"
on public.profiles for select
to authenticated
using (id = auth.uid());

create policy "profiles_self_insert"
on public.profiles for insert
to authenticated
with check (id = auth.uid());

create policy "profiles_self_update"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "sessions_self_read" on public.sessions;
drop policy if exists "sessions_self_insert" on public.sessions;
drop policy if exists "sessions_self_update" on public.sessions;

create policy "sessions_self_read"
on public.sessions for select
to authenticated
using (profile_id = auth.uid());

create policy "sessions_self_insert"
on public.sessions for insert
to authenticated
with check (profile_id = auth.uid());

create policy "sessions_self_update"
on public.sessions for update
to authenticated
using (profile_id = auth.uid())
with check (profile_id = auth.uid());

drop policy if exists "consent_self_read" on public.consent_records;
drop policy if exists "consent_self_insert" on public.consent_records;

create policy "consent_self_read"
on public.consent_records for select
to authenticated
using (
  exists (
    select 1 from public.sessions s
    where s.id = consent_records.session_id
      and s.profile_id = auth.uid()
  )
);

create policy "consent_self_insert"
on public.consent_records for insert
to authenticated
with check (
  exists (
    select 1 from public.sessions s
    where s.id = consent_records.session_id
      and s.profile_id = auth.uid()
  )
);

drop policy if exists "history_self_read" on public.session_history;
drop policy if exists "history_self_insert" on public.session_history;

create policy "history_self_read"
on public.session_history for select
to authenticated
using (profile_id = auth.uid());

create policy "history_self_insert"
on public.session_history for insert
to authenticated
with check (profile_id = auth.uid());

drop policy if exists "rounds_public_read" on public.experience_rounds;

create policy "rounds_public_read"
on public.experience_rounds for select
to authenticated
using (active = true);

-- Admin audit writes must be implemented through a server-side role check.
-- Never grant browser clients a service-role key.
-- Do not create a broad client-side admin policy.

create unique index if not exists profiles_username_idx on public.profiles(lower(username)) where username is not null;

create index if not exists sessions_profile_id_idx on public.sessions(profile_id);
create index if not exists session_history_profile_id_idx on public.session_history(profile_id);
create index if not exists session_history_completed_at_idx on public.session_history(completed_at desc);
create index if not exists sessions_updated_at_idx on public.sessions(updated_at desc);
create index if not exists consent_session_id_idx on public.consent_records(session_id);
create index if not exists consent_created_at_idx on public.consent_records(created_at desc);
create index if not exists rounds_sort_order_idx on public.experience_rounds(sort_order);

create unique index if not exists consent_active_event_idx
on public.consent_records(session_id,status,confirmed_at)
where status='active' and confirmed_at is not null;

create unique index if not exists consent_revoked_event_idx
on public.consent_records(session_id,status,revoked_at)
where status='revoked' and revoked_at is not null;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists sessions_set_updated_at on public.sessions;
create trigger sessions_set_updated_at
before update on public.sessions
for each row execute function public.set_updated_at();

insert into public.experience_rounds (slug,title,body,duration_seconds,sort_order)
values
 ('eerste-stap','De Eerste Stap','Neem een moment. Spreek samen af wat vandaag wel, niet en misschien is.',180,1),
 ('richting','De Richting','Kies één opdracht die past bij jullie afgesproken grenzen. Communiceer helder.',240,2),
 ('verdieping','De Verdieping','Blijf aanwezig, check in en gebruik jullie afgesproken stopwoord wanneer nodig.',300,3)
on conflict (slug) do update set
 title=excluded.title,
 body=excluded.body,
 duration_seconds=excluded.duration_seconds,
 sort_order=excluded.sort_order,
 active=true;

-- Profile identity extension: safe to run on an existing AFTER HOURS database.
alter table public.profiles add column if not exists avatar_style text not null default 'sigil';
alter table public.profiles drop constraint if exists profiles_avatar_style_check;
alter table public.profiles add constraint profiles_avatar_style_check check (avatar_style in ('sigil','collar','key','crown'));
