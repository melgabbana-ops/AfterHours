-- AFTER HOURS: account-bound Duo rooms with private Realtime authorization.
-- This migration is additive. It does not alter project-level Realtime settings or run itself.
begin;

create table if not exists public.afterhours_duo_rooms (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'lobby' check (status in ('lobby', 'active', 'paused', 'stopped')),
  expires_at timestamptz not null default (now() + interval '24 hours'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists afterhours_duo_rooms_owner_expiry
  on public.afterhours_duo_rooms (owner_user_id, expires_at desc);

create table if not exists public.afterhours_duo_room_members (
  room_id uuid not null references public.afterhours_duo_rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('host', 'guest')),
  consented_at timestamptz,
  consent_revoked_at timestamptz,
  removed_at timestamptz,
  joined_at timestamptz not null default now(),
  primary key (room_id, user_id),
  unique (room_id, role),
  check (consent_revoked_at is null or consented_at is null or consent_revoked_at >= consented_at)
);
create index if not exists afterhours_duo_members_user_room
  on public.afterhours_duo_room_members (user_id, room_id)
  where removed_at is null;

create table if not exists public.afterhours_duo_invitations (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null unique references public.afterhours_duo_rooms(id) on delete cascade,
  inviter_user_id uuid not null references auth.users(id) on delete cascade,
  token_hash text not null unique check (token_hash ~ '^[a-f0-9]{64}$'),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'revoked', 'expired')),
  accepted_user_id uuid references auth.users(id) on delete cascade,
  accepted_at timestamptz,
  expires_at timestamptz not null default (now() + interval '24 hours'),
  created_at timestamptz not null default now(),
  check (
    (status = 'accepted' and accepted_user_id is not null and accepted_at is not null)
    or (status <> 'accepted' and accepted_user_id is null and accepted_at is null)
  )
);
create index if not exists afterhours_duo_invitations_expiry
  on public.afterhours_duo_invitations (expires_at)
  where status = 'pending';

alter table public.afterhours_duo_rooms enable row level security;
alter table public.afterhours_duo_room_members enable row level security;
alter table public.afterhours_duo_invitations enable row level security;

revoke all on public.afterhours_duo_rooms from public, anon, authenticated;
revoke all on public.afterhours_duo_room_members from public, anon, authenticated;
revoke all on public.afterhours_duo_invitations from public, anon, authenticated;
grant select on public.afterhours_duo_rooms to authenticated;
grant select on public.afterhours_duo_room_members to authenticated;

drop policy if exists afterhours_duo_rooms_member_read on public.afterhours_duo_rooms;
create policy afterhours_duo_rooms_member_read
  on public.afterhours_duo_rooms for select to authenticated
  using (
    exists (
      select 1 from public.afterhours_duo_room_members m
      where m.room_id = afterhours_duo_rooms.id
        and m.user_id = (select auth.uid())
        and m.removed_at is null
    )
  );

drop policy if exists afterhours_duo_members_read_self on public.afterhours_duo_room_members;
create policy afterhours_duo_members_read_self
  on public.afterhours_duo_room_members for select to authenticated
  using (user_id = (select auth.uid()) and removed_at is null);

create or replace function public.create_afterhours_duo_room(p_invitation_token_hash text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_room_id uuid;
  v_expires_at timestamptz := now() + interval '24 hours';
begin
  if v_user_id is null then
    raise exception 'Sign in before creating an online Duo room.' using errcode = '28000';
  end if;
  if p_invitation_token_hash is null or p_invitation_token_hash !~ '^[a-f0-9]{64}$' then
    raise exception 'The invitation token is invalid.' using errcode = '22023';
  end if;

  insert into public.afterhours_duo_rooms (owner_user_id, expires_at)
  values (v_user_id, v_expires_at)
  returning id into v_room_id;

  insert into public.afterhours_duo_room_members (room_id, user_id, role)
  values (v_room_id, v_user_id, 'host');

  insert into public.afterhours_duo_invitations (room_id, inviter_user_id, token_hash, expires_at)
  values (v_room_id, v_user_id, p_invitation_token_hash, v_expires_at);

  return jsonb_build_object('room_id', v_room_id, 'expires_at', v_expires_at);
end;
$$;

create or replace function public.preview_afterhours_duo_invitation(p_token_hash text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_invitation public.afterhours_duo_invitations%rowtype;
  v_room public.afterhours_duo_rooms%rowtype;
begin
  if v_user_id is null then
    raise exception 'Sign in to preview this Duo invitation.' using errcode = '28000';
  end if;
  if p_token_hash is null or p_token_hash !~ '^[a-f0-9]{64}$' then
    raise exception 'This Duo invitation is invalid.' using errcode = '22023';
  end if;

  select * into v_invitation
  from public.afterhours_duo_invitations
  where token_hash = p_token_hash;

  if not found
    or v_invitation.status <> 'pending'
    or v_invitation.expires_at <= now()
    or v_invitation.inviter_user_id = v_user_id then
    raise exception 'This Duo invitation is unavailable.' using errcode = 'P0002';
  end if;

  select * into v_room from public.afterhours_duo_rooms where id = v_invitation.room_id;
  if not found or v_room.status not in ('lobby', 'paused') or v_room.expires_at <= now() then
    raise exception 'This Duo room is no longer accepting a participant.' using errcode = 'P0002';
  end if;

  return jsonb_build_object(
    'room_id', v_room.id,
    'status', v_room.status,
    'expires_at', v_invitation.expires_at
  );
end;
$$;

create or replace function public.accept_afterhours_duo_invitation(p_token_hash text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_invitation public.afterhours_duo_invitations%rowtype;
  v_room public.afterhours_duo_rooms%rowtype;
  v_member_count integer;
begin
  if v_user_id is null then
    raise exception 'Sign in before accepting a Duo invitation.' using errcode = '28000';
  end if;
  if p_token_hash is null or p_token_hash !~ '^[a-f0-9]{64}$' then
    raise exception 'This Duo invitation is invalid.' using errcode = '22023';
  end if;

  select * into v_invitation
  from public.afterhours_duo_invitations
  where token_hash = p_token_hash
  for update;

  if not found
    or v_invitation.status <> 'pending'
    or v_invitation.expires_at <= now()
    or v_invitation.inviter_user_id = v_user_id then
    raise exception 'This Duo invitation is unavailable.' using errcode = 'P0002';
  end if;

  select * into v_room
  from public.afterhours_duo_rooms
  where id = v_invitation.room_id
  for update;

  if not found or v_room.status not in ('lobby', 'paused') or v_room.expires_at <= now() then
    raise exception 'This Duo room is no longer accepting a participant.' using errcode = 'P0002';
  end if;

  select count(*) into v_member_count
  from public.afterhours_duo_room_members
  where room_id = v_room.id and removed_at is null;

  if v_member_count <> 1 then
    raise exception 'This Duo room is full or unavailable.' using errcode = 'P0002';
  end if;

  -- Accepting an invitation joins the room; it is not consent to participate.
  -- The guest must explicitly opt in through set_afterhours_duo_consent.
  insert into public.afterhours_duo_room_members (room_id, user_id, role)
  values (v_room.id, v_user_id, 'guest');

  update public.afterhours_duo_invitations
  set status = 'accepted', accepted_user_id = v_user_id, accepted_at = clock_timestamp()
  where id = v_invitation.id;

  return jsonb_build_object('room_id', v_room.id, 'status', 'accepted');
end;
$$;

create or replace function public.set_afterhours_duo_consent(p_room_id uuid, p_consent boolean)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_room public.afterhours_duo_rooms%rowtype;
begin
  if v_user_id is null then
    raise exception 'Sign in to update Duo consent.' using errcode = '28000';
  end if;
  if p_consent is null then
    raise exception 'A consent decision is required.' using errcode = '22023';
  end if;

  select * into v_room
  from public.afterhours_duo_rooms
  where id = p_room_id
  for update;

  if not found or v_room.expires_at <= now() or v_room.status = 'stopped' then
    raise exception 'This Duo room is no longer active.' using errcode = 'P0002';
  end if;

  if not exists (
    select 1 from public.afterhours_duo_room_members m
    where m.room_id = p_room_id and m.user_id = v_user_id and m.removed_at is null
  ) then
    raise exception 'You are not a member of this Duo room.' using errcode = '42501';
  end if;

  if p_consent then
    if v_room.status = 'active' then
      raise exception 'Pause the Duo room before changing consent.' using errcode = '55000';
    end if;
    update public.afterhours_duo_room_members
    set consented_at = clock_timestamp(), consent_revoked_at = null
    where room_id = p_room_id and user_id = v_user_id and removed_at is null;
  else
    update public.afterhours_duo_rooms
    set status = 'paused', updated_at = clock_timestamp()
    where id = p_room_id;
    update public.afterhours_duo_room_members
    set consent_revoked_at = clock_timestamp()
    where room_id = p_room_id and removed_at is null and consent_revoked_at is null;
  end if;

  return jsonb_build_object('room_id', p_room_id, 'consent', p_consent, 'status', case when p_consent then v_room.status else 'paused' end);
end;
$$;

create or replace function public.set_afterhours_duo_room_state(p_room_id uuid, p_status text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_room public.afterhours_duo_rooms%rowtype;
  v_member_count integer;
  v_consented_count integer;
begin
  if v_user_id is null then
    raise exception 'Sign in to control this Duo room.' using errcode = '28000';
  end if;
  if p_status is null or p_status not in ('active', 'paused', 'stopped') then
    raise exception 'This Duo room state is invalid.' using errcode = '22023';
  end if;

  select * into v_room
  from public.afterhours_duo_rooms
  where id = p_room_id
  for update;

  if not found or v_room.expires_at <= now() or v_room.status = 'stopped' then
    raise exception 'This Duo room is no longer active.' using errcode = 'P0002';
  end if;

  if not exists (
    select 1 from public.afterhours_duo_room_members m
    where m.room_id = p_room_id and m.user_id = v_user_id and m.removed_at is null
  ) then
    raise exception 'You are not a member of this Duo room.' using errcode = '42501';
  end if;

  if p_status = 'active' then
    if v_room.owner_user_id <> v_user_id then
      raise exception 'Only the host can start or resume this Duo room.' using errcode = '42501';
    end if;
    select count(*), count(*) filter (where consented_at is not null and consent_revoked_at is null)
      into v_member_count, v_consented_count
    from public.afterhours_duo_room_members
    where room_id = p_room_id and removed_at is null;
    if v_member_count <> 2 or v_consented_count <> 2 then
      raise exception 'Both participants must be present and actively consenting before starting.' using errcode = '55000';
    end if;
  end if;

  update public.afterhours_duo_rooms
  set status = p_status, updated_at = clock_timestamp()
  where id = p_room_id;

  if p_status in ('paused', 'stopped') then
    update public.afterhours_duo_room_members
    set consent_revoked_at = clock_timestamp()
    where room_id = p_room_id and removed_at is null and consent_revoked_at is null;
  end if;

  return jsonb_build_object('room_id', p_room_id, 'status', p_status);
end;
$$;

-- Return only the room state and minimal per-member consent status to a member.
-- This is the authoritative lobby snapshot; clients never infer consent from broadcasts.
create or replace function public.get_afterhours_duo_room_state(p_room_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $
declare
  v_user_id uuid := auth.uid();
  v_room public.afterhours_duo_rooms%rowtype;
  v_members jsonb;
begin
  if v_user_id is null then
    raise exception 'Sign in to view this Duo room.' using errcode = '28000';
  end if;

  select * into v_room
  from public.afterhours_duo_rooms
  where id = p_room_id;

  if not found or v_room.expires_at <= now() then
    raise exception 'This Duo room is no longer available.' using errcode = 'P0002';
  end if;

  if not exists (
    select 1 from public.afterhours_duo_room_members m
    where m.room_id = p_room_id and m.user_id = v_user_id and m.removed_at is null
  ) then
    raise exception 'You are not a member of this Duo room.' using errcode = '42501';
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'role', m.role,
        'is_self', m.user_id = v_user_id,
        'consented', m.consented_at is not null
          and (m.consent_revoked_at is null or m.consent_revoked_at < m.consented_at)
      ) order by m.role
    ),
    '[]'::jsonb
  ) into v_members
  from public.afterhours_duo_room_members m
  where m.room_id = p_room_id and m.removed_at is null;

  return jsonb_build_object(
    'room_id', v_room.id,
    'status', v_room.status,
    'expires_at', v_room.expires_at,
    'members', v_members
  );
end;
$;

create or replace function public.revoke_afterhours_duo_invitation(p_room_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_room public.afterhours_duo_rooms%rowtype;
begin
  if v_user_id is null then
    raise exception 'Sign in to revoke this Duo invitation.' using errcode = '28000';
  end if;
  select * into v_room
  from public.afterhours_duo_rooms
  where id = p_room_id
  for update;
  if not found or v_room.owner_user_id <> v_user_id then
    raise exception 'Only the host can revoke this invitation.' using errcode = '42501';
  end if;
  update public.afterhours_duo_invitations
  set status = 'revoked'
  where room_id = p_room_id and status = 'pending';
  update public.afterhours_duo_rooms
  set status = 'stopped', updated_at = clock_timestamp()
  where id = p_room_id and status <> 'stopped';
  update public.afterhours_duo_room_members
  set consent_revoked_at = clock_timestamp()
  where room_id = p_room_id and removed_at is null and consent_revoked_at is null;
  return jsonb_build_object('room_id', p_room_id, 'status', 'stopped');
end;
$$;

revoke all on function public.create_afterhours_duo_room(text) from public, anon;
revoke all on function public.preview_afterhours_duo_invitation(text) from public, anon;
revoke all on function public.accept_afterhours_duo_invitation(text) from public, anon;
revoke all on function public.set_afterhours_duo_consent(uuid, boolean) from public, anon;
revoke all on function public.set_afterhours_duo_room_state(uuid, text) from public, anon;
revoke all on function public.get_afterhours_duo_room_state(uuid) from public, anon;
revoke all on function public.revoke_afterhours_duo_invitation(uuid) from public, anon;
grant execute on function public.create_afterhours_duo_room(text) to authenticated;
grant execute on function public.preview_afterhours_duo_invitation(text) to authenticated;
grant execute on function public.accept_afterhours_duo_invitation(text) to authenticated;
grant execute on function public.set_afterhours_duo_consent(uuid, boolean) to authenticated;
grant execute on function public.set_afterhours_duo_room_state(uuid, text) to authenticated;
grant execute on function public.get_afterhours_duo_room_state(uuid) to authenticated;
grant execute on function public.revoke_afterhours_duo_invitation(uuid) to authenticated;

-- Private Broadcast + Presence are allowed only on the exact topic of a room
-- for an authenticated, non-removed member. Never authorize public room codes.
drop policy if exists afterhours_duo_member_receive_private on realtime.messages;
create policy afterhours_duo_member_receive_private
  on realtime.messages for select to authenticated
  using (
    extension in ('broadcast', 'presence')
    and exists (
      select 1 from public.afterhours_duo_room_members m
      where m.user_id = (select auth.uid())
        and m.removed_at is null
        and ('afterhours-duo:' || m.room_id::text) = (select realtime.topic())
        and exists (
          select 1 from public.afterhours_duo_rooms r
          where r.id = m.room_id and r.status <> 'stopped' and r.expires_at > now()
        )
    )
  );

drop policy if exists afterhours_duo_member_send_private on realtime.messages;
create policy afterhours_duo_member_send_private
  on realtime.messages for insert to authenticated
  with check (
    extension in ('broadcast', 'presence')
    and exists (
      select 1 from public.afterhours_duo_room_members m
      where m.user_id = (select auth.uid())
        and m.removed_at is null
        and ('afterhours-duo:' || m.room_id::text) = (select realtime.topic())
        and exists (
          select 1 from public.afterhours_duo_rooms r
          where r.id = m.room_id and r.status <> 'stopped' and r.expires_at > now()
        )
    )
  );

commit;
