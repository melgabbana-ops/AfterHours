-- AFTER HOURS secure admin console.
-- Apply via the Supabase SQL Editor. Then add the trusted admin account:
-- insert into public.app_admins(user_id) values ('YOUR_AUTH_USER_UUID') on conflict do nothing;
-- Never allow users to grant themselves admin access from the app.

begin;

create table if not exists public.app_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.app_admins enable row level security;
revoke all on public.app_admins from anon, authenticated;
grant select on public.app_admins to authenticated;
drop policy if exists "app_admins_self_read" on public.app_admins;
create policy "app_admins_self_read"
  on public.app_admins for select
  to authenticated
  using (user_id = auth.uid());

create or replace function public.is_app_admin()
returns boolean
language sql stable security definer
set search_path = public
as $function$
  select exists (
    select 1 from public.app_admins a
    where a.user_id = auth.uid()
  );
$function$;
revoke all on function public.is_app_admin() from public, anon;
grant execute on function public.is_app_admin() to authenticated;

-- An admin may read inactive rounds and edit only the round-content fields.
drop policy if exists "experience_rounds_admin_read" on public.experience_rounds;
create policy "experience_rounds_admin_read"
  on public.experience_rounds for select
  to authenticated
  using (public.is_app_admin());

drop policy if exists "experience_rounds_admin_update" on public.experience_rounds;
create policy "experience_rounds_admin_update"
  on public.experience_rounds for update
  to authenticated
  using (public.is_app_admin())
  with check (public.is_app_admin());

revoke insert, update, delete on public.experience_rounds from anon, authenticated;
grant select on public.experience_rounds to authenticated;
grant update (title, body, title_nl, body_nl, title_en, body_en, duration_seconds, sort_order, active)
  on public.experience_rounds to authenticated;

-- Admin audit history is readable only by the allowlisted admin.
drop policy if exists "admin_audit_log_admin_read" on public.admin_audit_log;
create policy "admin_audit_log_admin_read"
  on public.admin_audit_log for select
  to authenticated
  using (public.is_app_admin());
revoke all on public.admin_audit_log from anon, authenticated;
grant select on public.admin_audit_log to authenticated;

create or replace function public.audit_experience_round_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
begin
  -- SQL-editor/service-role maintenance has no end-user JWT. Allow it without
  -- a user audit entry so rerunning schema seeds stays idempotent.
  if auth.uid() is not null then
    if not public.is_app_admin() then
      raise exception 'Not authorized to update experience rounds.' using errcode = '42501';
    end if;
    insert into public.admin_audit_log(actor_id, action, metadata)
    values (
      auth.uid(),
      'experience_round.updated',
      jsonb_build_object(
        'slug', new.slug,
        'active', new.active,
        'duration_seconds', new.duration_seconds
      )
    );
  end if;
  return new;
end;
$function$;
revoke all on function public.audit_experience_round_update() from public, anon, authenticated;

drop trigger if exists "experience_round_update_audit" on public.experience_rounds;
create trigger "experience_round_update_audit"
  after update on public.experience_rounds
  for each row
  when (
    old.title is distinct from new.title
    or old.body is distinct from new.body
    or old.title_nl is distinct from new.title_nl
    or old.body_nl is distinct from new.body_nl
    or old.title_en is distinct from new.title_en
    or old.body_en is distinct from new.body_en
    or old.duration_seconds is distinct from new.duration_seconds
    or old.sort_order is distinct from new.sort_order
    or old.active is distinct from new.active
  )
  execute function public.audit_experience_round_update();

create or replace function public.admin_dashboard_metrics()
returns jsonb
language plpgsql
security definer
set search_path = public
as $function$
begin
  if not public.is_app_admin() then
    raise exception 'Not authorized.' using errcode = '42501';
  end if;

  return jsonb_build_object(
    'profiles_total', (select count(*) from public.profiles),
    'sessions_total', (select count(*) from public.sessions),
    'sessions_completed', (select count(*) from public.sessions where status = 'completed'),
    'sessions_in_progress', (select count(*) from public.sessions where status in ('active','paused')),
    'active_consents', (select count(*) from public.consent_records where status = 'active'),
    'rounds_total', (select count(*) from public.experience_rounds),
    'rounds_active', (select count(*) from public.experience_rounds where active = true),
    'private_media_files', (
      select count(*) from storage.objects
      where bucket_id = 'after-hours-private-media'
    )
  );
end;
$function$;
revoke all on function public.admin_dashboard_metrics() from public, anon;
grant execute on function public.admin_dashboard_metrics() to authenticated;

commit;
