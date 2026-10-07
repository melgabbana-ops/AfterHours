-- AFTER HOURS production database contract
-- Supabase / PostgreSQL
-- Run this migration in the production Supabase project before enabling remote persistence.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Night Walker',
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

create table if not exists public.consent_records (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  status text not null check (status in ('active','revoked')),
  confirmed_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
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
alter table public.experience_rounds enable row level security;
alter table public.admin_audit_log enable row level security;

create policy "profiles_self_read"
on public.profiles for select
to authenticated
using (id = auth.uid());

create policy "profiles_self_update"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

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

create policy "rounds_public_read"
on public.experience_rounds for select
to authenticated
using (active = true);

-- Admin writes must be implemented through a server-side role check.
-- Never grant browser clients a service-role key.
-- Do not create a broad client-side admin policy.

create index if not exists sessions_profile_id_idx on public.sessions(profile_id);
create index if not exists consent_session_id_idx on public.consent_records(session_id);
create index if not exists rounds_sort_order_idx on public.experience_rounds(sort_order);

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
