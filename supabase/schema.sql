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
  round integer not null default 0 check (round between 0 and 2),
  started_at timestamptz,
  updated_at timestamptz not null default now()
);
alter table public.sessions add column if not exists active_seconds integer not null default 0;
alter table public.sessions add column if not exists active_started_at timestamptz;

create table if not exists public.session_history (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  completed_at timestamptz not null default now(),
  xp_earned integer not null default 0 check (xp_earned >= 0),
  rounds integer not null default 0 check (rounds between 0 and 3),
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

-- Browser clients may create identity data only.
-- Progress counters use database defaults and server-side RPCs.
revoke insert on public.profiles from authenticated;
grant insert (id, display_name, username, avatar_style) on public.profiles to authenticated;
revoke insert (level, xp, sessions, created_at, updated_at) on public.profiles from authenticated;

create policy "profiles_self_update"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- Browser clients may edit identity fields only.
-- XP, level and session counters remain server-authoritative.
revoke update on public.profiles from authenticated;
grant update (display_name, username, avatar_style) on public.profiles to authenticated;
revoke update (level, xp, sessions, id, created_at, updated_at) on public.profiles from authenticated;

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
with check (profile_id = auth.uid() and status = 'ready' and round = 0);

-- Session updates are server-authoritative through set_session_state / complete_session.

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

-- Consent writes are server-authoritative through set_consent_state.

drop policy if exists "history_self_read" on public.session_history;
drop policy if exists "history_self_insert" on public.session_history;

create policy "history_self_read"
on public.session_history for select
to authenticated
using (profile_id = auth.uid());

-- History writes are server-authoritative through complete_session.

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
 ('eerste-stap','De Eerste Stap','Neem een moment. Spreek samen af wat vandaag wel, niet en misschien is.',1200,1),
 ('richting','De Richting','Kies één opdracht die past bij jullie afgesproken grenzen. Communiceer helder.',1200,2),
 ('verdieping','De Verdieping','Blijf aanwezig, check in en gebruik jullie afgesproken stopwoord wanneer nodig.',1200,3)
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


-- Normalize constraints for existing databases as well as fresh installs.
alter table public.sessions drop constraint if exists sessions_round_check;
alter table public.sessions add constraint sessions_round_check check (round between 0 and 2);
alter table public.session_history drop constraint if exists session_history_rounds_check;
alter table public.session_history add constraint session_history_rounds_check check (rounds between 0 and 3);

-- Authoritative session state transitions. Browser clients cannot directly mutate sessions.
drop function if exists public.set_session_state(uuid,text,integer,timestamptz);

create or replace function public.set_session_state(p_session_id uuid,p_status text,p_round integer,p_started_at timestamptz,p_updated_at timestamptz)
returns public.sessions language plpgsql security definer set search_path=public as $func$
declare v_session public.sessions%rowtype; v_result public.sessions%rowtype; v_active_seconds integer;
begin
 if auth.uid() is null then raise exception 'Niet ingelogd.'; end if;
 if p_status not in ('ready','active','paused','completed','stopped') then raise exception 'Ongeldige sessiestatus.'; end if;
 if p_round not between 0 and 2 then raise exception 'Ongeldige ronde.'; end if;
 if p_updated_at is null then raise exception 'Ontbrekende state-versie.'; end if;
 if p_updated_at > now()+interval '5 seconds' then raise exception 'Ongeldige toekomstige state-versie.'; end if;
 select * into v_session from public.sessions where id=p_session_id and profile_id=auth.uid() for update;
 if not found then raise exception 'Sessie niet gevonden.'; end if;
 if p_updated_at <= v_session.updated_at then return v_session; end if;
 if p_status='completed' then raise exception 'Gebruik complete_session voor afronden.'; end if;
 if p_status='ready' and p_round<>0 then raise exception 'Ready vereist ronde 0.'; end if;
 if p_status='ready' and v_session.status='completed' then raise exception 'Een afgeronde sessie kan niet worden herstart.'; end if;
 v_active_seconds:=v_session.active_seconds;
 if v_session.status='active' and v_session.active_started_at is not null then
   v_active_seconds:=v_active_seconds+greatest(0,floor(extract(epoch from(now()-v_session.active_started_at)))::integer);
 end if;
 if p_status='active' then
   if p_round<>v_session.round then raise exception 'Ronde moet via de rondeflow worden gewijzigd.'; end if;
   if v_session.status not in ('ready','active','paused','stopped') then raise exception 'Ongeldige overgang naar actief.'; end if;
   if v_session.status in ('ready','stopped') then p_started_at:=now(); v_active_seconds:=0; else p_started_at:=v_session.started_at; end if;
 elsif p_status='paused' then
   if p_round=v_session.round then
     if v_session.status not in ('active','paused') then raise exception 'Pauzeren kan alleen vanuit een actieve sessie.'; end if;
   elsif v_session.status='paused' and p_round=v_session.round+1 then null;
   else raise exception 'Ongeldige overgang naar de volgende ronde.'; end if;
 elsif p_status='stopped' then
   if p_round<>v_session.round then raise exception 'Stoppen mag de ronde niet wijzigen.'; end if;
   p_started_at:=null;
 elsif p_status='ready' then
   p_started_at:=null; v_active_seconds:=0;
 end if;
 update public.sessions set status=p_status,round=p_round,started_at=p_started_at,active_seconds=v_active_seconds,
 active_started_at=case when p_status='active' then now() else null end,updated_at=now()
 where id=v_session.id returning * into v_result;
 return v_result;
end;$func$;
revoke all on function public.set_session_state(uuid,text,integer,timestamptz,timestamptz) from public;
grant execute on function public.set_session_state(uuid,text,integer,timestamptz,timestamptz) to authenticated;

-- Authoritative session completion. XP/history are awarded only once server-side.
create or replace function public.complete_session(p_session_id uuid, p_rounds integer)
returns jsonb
language plpgsql
security definer
set search_path = public
as $func$
declare
  v_session public.sessions%rowtype;
  v_xp integer := 120;
  v_completed_at timestamptz := now();
  v_consent_status text;
begin
  if auth.uid() is null then raise exception 'Niet ingelogd.'; end if;
  if p_rounds <> 3 then raise exception 'Ongeldige sessiegrootte.'; end if;
  select * into v_session from public.sessions where id=p_session_id and profile_id=auth.uid() for update;
  if not found then raise exception 'Sessie niet gevonden.'; end if;
  if v_session.status='completed' then
    return jsonb_build_object('xp_earned',0,'already_completed',true);
  end if;
  if v_session.status not in ('active','paused') or v_session.round <> 2 then raise exception 'Sessie kan nog niet worden afgerond.'; end if;
  if v_session.status='active' and v_session.active_started_at is not null then
    v_session.active_seconds:=v_session.active_seconds+greatest(0,floor(extract(epoch from(now()-v_session.active_started_at)))::integer);
  end if;
  if v_session.active_seconds < 3600 then
    raise exception 'De sessie moet minimaal 60 minuten actieve speeltijd hebben.';
  end if;
  select c.status into v_consent_status
  from public.consent_records c
  where c.session_id = v_session.id
  order by c.created_at desc, c.id desc
  limit 1;
  if v_consent_status is distinct from 'active' then
    raise exception 'Actieve consent ontbreekt.';
  end if;
  update public.sessions set status='completed',round=0,started_at=null,active_started_at=null,active_seconds=v_session.active_seconds,updated_at=v_completed_at where id=v_session.id;
  insert into public.session_history(profile_id,completed_at,xp_earned,rounds) values(auth.uid(),v_completed_at,v_xp,p_rounds);
  update public.profiles set xp=xp+v_xp,level=floor((xp+v_xp)/200)+1,sessions=sessions+1 where id=auth.uid();
  return jsonb_build_object('xp_earned',v_xp,'already_completed',false);
end;
$func$;

revoke all on function public.complete_session(uuid,integer) from public;
grant execute on function public.complete_session(uuid,integer) to authenticated;


-- Profile progress protection is defined above and remains server-authoritative.

-- Session history is created only by the authoritative completion function.
drop policy if exists "history_self_insert" on public.session_history;
revoke insert on public.session_history from authenticated;


-- Authoritative consent state. Browser clients cannot forge consent events directly.
create or replace function public.set_consent_state(
  p_session_id uuid,
  p_status text,
  p_confirmed_at timestamptz,
  p_revoked_at timestamptz
)
returns public.consent_records
language plpgsql
security definer
set search_path = public
as $func$
declare
  v_session public.sessions%rowtype;
  v_result public.consent_records%rowtype;
  v_now timestamptz := now();
begin
  if auth.uid() is null then raise exception 'Niet ingelogd.'; end if;
  if p_status not in ('active','revoked') then raise exception 'Ongeldige consentstatus.'; end if;
  select * into v_session from public.sessions where id=p_session_id and profile_id=auth.uid() for update;
  if not found then raise exception 'Sessie niet gevonden.'; end if;

  if p_status='active' then
    if p_confirmed_at is null or p_revoked_at is not null then raise exception 'Ongeldige actieve consent.'; end if;
    -- Treat the request as idempotent only when the latest consent state is active.
    -- A later revocation must allow a fresh, explicit consent event.
    select c.* into v_result
    from public.consent_records c
    where c.session_id=v_session.id
    order by c.created_at desc, c.id desc
    limit 1;
    if found and v_result.status='active' then return v_result; end if;
    insert into public.consent_records(session_id,status,confirmed_at)
    values(v_session.id,'active',v_now)
    returning * into v_result;
  else
    if p_revoked_at is null or p_confirmed_at is not null then raise exception 'Ongeldige ingetrokken consent.'; end if;
    select * into v_result from public.consent_records
    where session_id=v_session.id and status='revoked'
    order by created_at desc
    limit 1;
    if found then return v_result; end if;
    if not exists (
      select 1 from public.consent_records
      where session_id=v_session.id and status='active'
      order by created_at desc
      limit 1
    ) then
      raise exception 'Actieve consent ontbreekt.';
    end if;
    insert into public.consent_records(session_id,status,revoked_at)
    values(v_session.id,'revoked',v_now)
    returning * into v_result;
  end if;