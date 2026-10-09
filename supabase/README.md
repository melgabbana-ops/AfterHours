# Production backend

AFTER HOURS is structured for a Supabase/PostgreSQL backend.

## Database and migrations
The canonical schema is in `supabase/schema.sql`. The ordered migration history lives in `supabase/migrations/`:

1. `20261007_initial_schema.sql` creates the base tables, RLS policies, indexes, triggers, and server-authoritative RPCs.
2. `20261008_profile_update_privilege_hardening.sql` restricts browser updates to profile identity fields.
3. `20261009_allow_renewed_consent.sql` supports a new explicit consent event after revocation.
4. `20261009_consent_event_ordering.sql` timestamps consent events after acquiring the session lock, preserving event order during concurrent changes.
5. `20261009_private_media_bucket.sql` creates a private media bucket with user-folder scoped read/write/delete policies and server-enforced upload limits.
6. `20261009_session_activation_consent_guard.sql` requires active consent on the database server before a session can be started or resumed.

For a new Supabase project, review the SQL and apply migrations in timestamp order using the Supabase CLI or migration workflow before enabling remote persistence. For a project where `schema.sql` was already applied manually, inspect the live schema and migration history before running `db push`; baseline the existing database rather than blindly replaying an untracked schema.

## Security model

The browser may use the public Supabase client key, but it must never receive a service-role key.

Row Level Security limits normal users to their own profile and sessions. Consent records are scoped through the owning session. Experience content is read-only to authenticated clients.

Admin actions are intentionally not exposed through a permissive browser policy. They must go through a server-side authenticated role check and create an audit entry.

## Runtime configuration

Configure:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

The Supabase adapter is already wired into the client. Local storage remains available for UI continuity, but offline state is not trusted for authoritative XP, history, consent or completion.

## Consent

Consent is session-scoped and auditable. Revocation stops the active client session immediately. Production code should append a new consent record rather than mutating historical consent evidence.

## Private media storage
The bucket `after-hours-private-media` is private. Every object path must start with the authenticated user's UUID, followed by the session ID and filename: `<auth.uid()>/<session-id>/<filename>`. Storage policies scope access to that first folder. The media UI must use authenticated storage operations or short-lived signed URLs; never make this bucket public.
