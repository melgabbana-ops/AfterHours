# Production backend

AFTER HOURS is structured for a Supabase/PostgreSQL backend.

## Database
The production schema is in `supabase/schema.sql`.

It contains:
- profiles
- sessions
- append-only consent records
- versioned experience rounds
- admin audit log

## Security model

The browser may use the public Supabase client key, but it must never receive a service-role key.

Row Level Security limits normal users to their own profile and sessions. Consent records are scoped through the owning session. Experience content is read-only to authenticated clients.

Admin actions are intentionally not exposed through a permissive browser policy. They must go through a server-side authenticated role check and create an audit entry.

## Next integration step

Configure:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Then add the Supabase client adapter behind the existing `AfterHoursState` interface. Local storage remains the offline fallback until a signed-in session is available.

## Consent

Consent is session-scoped and auditable. Revocation stops the active client session immediately. Production code should append a new consent record rather than mutating historical consent evidence.
