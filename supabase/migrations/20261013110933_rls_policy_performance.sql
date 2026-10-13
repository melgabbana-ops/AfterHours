-- Improve RLS evaluation cost without changing access semantics.
-- auth.uid() is wrapped in a scalar subquery so Postgres can evaluate it once per statement.

drop policy if exists profiles_self_insert on public.profiles;
create policy profiles_self_insert on public.profiles
  for insert to authenticated
  with check (id = (select auth.uid()));

drop policy if exists profiles_self_read on public.profiles;
create policy profiles_self_read on public.profiles
  for select to authenticated
  using (id = (select auth.uid()));

drop policy if exists profiles_self_update on public.profiles;
create policy profiles_self_update on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

drop policy if exists sessions_self_insert on public.sessions;
create policy sessions_self_insert on public.sessions
  for insert to authenticated
  with check (
    profile_id = (select auth.uid())
    and status = 'ready'
    and round = 0
  );

drop policy if exists sessions_self_read on public.sessions;
create policy sessions_self_read on public.sessions
  for select to authenticated
  using (profile_id = (select auth.uid()));

drop policy if exists consent_self_read on public.consent_records;
create policy consent_self_read on public.consent_records
  for select to authenticated
  using (
    exists (
      select 1
      from public.sessions s
      where s.id = consent_records.session_id
        and s.profile_id = (select auth.uid())
    )
  );

drop policy if exists history_self_read on public.session_history;
create policy history_self_read on public.session_history
  for select to authenticated
  using (profile_id = (select auth.uid()));

drop policy if exists app_admins_self_read on public.app_admins;
create policy app_admins_self_read on public.app_admins
  for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists mission_progress_read_own on public.mission_progress;
create policy mission_progress_read_own on public.mission_progress
  for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists xp_ledger_read_own on public.xp_event_ledger;
create policy xp_ledger_read_own on public.xp_event_ledger
  for select to authenticated
  using (profile_id = (select auth.uid()));

drop policy if exists session_moods_read_own on public.session_mood_events;
create policy session_moods_read_own on public.session_mood_events
  for select to authenticated
  using (profile_id = (select auth.uid()));

-- Index both foreign keys to keep admin audit-log joins/deletes efficient.
create index if not exists admin_audit_log_actor_id_idx
  on public.admin_audit_log (actor_id);
create index if not exists admin_audit_log_target_session_id_idx
  on public.admin_audit_log (target_session_id);
