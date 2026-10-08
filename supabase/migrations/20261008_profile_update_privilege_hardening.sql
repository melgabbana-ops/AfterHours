-- AFTER HOURS security hardening
-- Browser clients may edit identity fields only.
-- XP, level and session counters remain server-authoritative.

revoke update on public.profiles from authenticated;
grant update (display_name, username, avatar_style) on public.profiles to authenticated;

-- Revoke any accidental browser write paths for authoritative profile progress.
revoke update (level, xp, sessions, id, created_at, updated_at) on public.profiles from authenticated;
