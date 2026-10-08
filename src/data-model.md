# AFTER HOURS data model

This is the backend-ready contract for the client.

## UserProfile
- id
- displayName
- username (unique account identity)
- avatarStyle
- level
- xp
- sessions
- createdAt

## Session
- id
- profileId
- status: ready | active | paused | completed | stopped
- round
- startedAt
- updatedAt
- activeSeconds (server-authoritative)
- activeStartedAt (server-authoritative)

## ConsentRecord
- status: pending | active | revoked
- confirmedAt
- revokedAt

## AfterHoursState
The client may cache a local state for UI continuity, but server-side XP, history, consent and session completion are authoritative when Supabase is configured. Offline completion does not award authoritative XP.

## Backend mapping

The intended production mapping is:
- profiles -> authenticated user/profile table
- sessions -> session table
- consent -> append-only consent/audit records
- experience rounds -> versioned experience content
- admin -> role-protected server routes

Do not store authentication secrets, payment credentials, or server-only authorization data in localStorage.
