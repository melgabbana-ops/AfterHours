-- AFTER HOURS least-privilege hardening for unauthenticated API clients.
-- Current RLS policies on these tables are scoped to the authenticated role;
-- anonymous clients have no matching policies. Remove broad default table grants
-- as defense in depth without changing authenticated-user access.
REVOKE ALL PRIVILEGES ON TABLE
  public.consent_records,
  public.experience_rounds,
  public.profiles,
  public.session_history,
  public.sessions
FROM anon;

-- profiles also has column-level grants for anon, which table-level REVOKE
-- does not remove. Revoke those explicitly, including authoritative progress.
REVOKE ALL PRIVILEGES (
  id,
  display_name,
  username,
  avatar_style,
  level,
  xp,
  sessions,
  created_at,
  updated_at
) ON TABLE public.profiles FROM anon;
