# AFTER HOURS — Master Release Specification

Status: RELEASE PREPARED, NOT PRODUCTION PUSHED

This document is the release checklist for the next AFTER HOURS push. The approved product direction is the source of truth.

## Product vision

AFTER HOURS is a premium, cinematic, mobile-first interactive experience. Navigation must feel like one continuous app, not a sequence of web pages.

## Platform requirements

- iPhone
- Android phones
- iPad
- Android tablets
- Desktop/laptop
- Responsive layouts
- Touch-safe controls
- Safe-area support
- PWA / standalone web-app support

## Visual and interaction system

- Premium dark black / deep purple / champagne-gold visual language
- Approved moodboard remains the visual reference
- Cinematic entrance
- Fluid screen transitions and shared visual continuity
- No cheap full-page reload feeling
- Persistent session/audio state while navigating
- Micro-interactions, gestures and polished loading states
- Accessibility-conscious contrast and touch targets

## Authentication

Preferred practical login stack:
- Sign in with Apple
- Google
- Email
- Magic link
- Unique AFTER HOURS username/display name after account creation
- Supabase Auth as the authentication layer
- Never expose server/service-role secrets to the client

## Identity and progression

- Persona/profile
- Avatar
- Avatar frames
- XP
- Levels
- Achievements
- Streaks
- Session history
- Favorites
- Rank progression

### Approved BDSM-themed ranks

1. Curious
2. Tease
3. Plaything
4. Submissive
5. Brat
6. Toy
7. Pet
8. Thrall
9. Devotee
10. Obedient
11. Enthralled
12. Collared
13. Owned
14. Devoted
15. Dark Devotion

Ranks should unlock visual identity elements and progression rewards without turning progression into a pay-to-win mechanic.

## Experience engine

- Guided experiences
- Multi-round sessions
- Timer
- Pause
- Pass
- Stop
- Reset
- Progress tracking
- Daily challenges
- Random challenges
- Surprise mode
- Favorites
- Custom experiences
- Experience history
- Difficulty, duration, mood, dynamic and equipment metadata
- Consent-aware task selection
- Safety-aware task selection

Content should support non-explicit, suggestive and kinky BDSM themes. Do not generate or ship graphic sexual instructions.

## Consent and safety

- 18+ access gate
- Separate consent flow
- Consent can be withdrawn
- Immediate stop on safety withdrawal
- Pause / Pass / Stop controls available during sessions
- Safety state
- Aftercare flow
- Private post-session notes

## THE ORACLE

### Kinky Tarot
- Daily card
- Random draw
- Three-card spread
- Dark/premium card interaction
- Card meaning
- Mood/desire/power themes
- Optional challenge generated from the card
- Draw history

### Horoscope
- Zodiac profile
- Daily reading
- Mood
- Desire
- Power-dynamic theme
- Optional daily challenge

## THE GUIDE

AI-guided experience layer:
- Master persona
- Mistress persona
- Configurable tone/persona
- Spoken or text guidance
- Introduce rounds
- Announce tasks
- Manage timers
- React to pause/pass/stop
- Maintain session context
- Follow consent and safety constraints
- Choose from approved task/content data rather than unrestricted generation

AI must never override consent, safety state, or a user's explicit stop/pass action.

## AFTER HOURS RADIO

- Built-in AFTER HOURS audio/radio layer
- Dark electronic / ambient / cinematic mood categories
- Persistent playback during navigation
- Audio state retained during experiences
- Optional Spotify connection investigated separately
- Spotify must not be treated as the core commercial streaming infrastructure; comply with Spotify platform and licensing restrictions

## Admin / Control Room

- Manage experiences
- Manage tasks/content
- Manage users
- Manage progression
- Manage sessions
- Manage media
- Manage audio
- Manage Oracle content
- Moderation/safety controls
- Test and preview tools

## Backend architecture

- Supabase/Postgres
- Supabase Auth
- Row Level Security
- Private storage
- Typed backend contracts
- Server-side authorization
- Secure webhook handling where applicable
- Payment integration kept server-side
- Local storage is offline/prototype only

## Payments

Payment architecture remains separate from the client and must use a compliant payment provider. Previous Tikkie/personal-payment concepts are not part of the production architecture.

## Release gates

Before production push:
1. Build passes.
2. Type checking/linting passes where configured.
3. Auth flows are tested.
4. Consent/safety flows are tested.
5. Timer/session persistence is tested.
6. Responsive behavior is tested on iPhone, Android, iPad, tablet and desktop.
7. Navigation transitions are checked for reload/page-jump artifacts.
8. Audio persistence is tested.
9. AI Guide is disabled by default until safety/content guardrails are verified.
10. No secrets are committed.
11. Production environment variables are configured outside the repository.
12. No placeholder UI is presented as finished functionality.
13. Final visual QA is completed against the approved moodboard.
14. Release branch is reviewed before merge to main.

## Current repository note

The current client is the visual/interaction foundation. Authentication, persistent profiles, database-backed sessions and payment infrastructure still need production integration before public launch.

## Release rule

Do not push or merge to main until the release gates above are satisfied and the user explicitly asks to push/merge.
