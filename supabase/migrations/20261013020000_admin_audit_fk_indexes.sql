-- AFTER HOURS: cover admin audit log foreign keys identified by Supabase performance advisor.
-- Additive only: no data changes and no policy/permission changes.
-- Review and apply through the normal migration process after confirming live schema history.

create index if not exists admin_audit_log_actor_id_idx
  on public.admin_audit_log (actor_id);

create index if not exists admin_audit_log_target_session_id_idx
  on public.admin_audit_log (target_session_id);
