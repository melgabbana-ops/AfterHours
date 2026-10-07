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
- Personal Dashboard / profile DNA summary

### Avatar system — approved moodboard characters

The generic placeholder/default profile silhouette must be replaced by the custom AFTER HOURS character system based on the approved moodboard.

- Provide a curated set of AFTER HOURS character bases derived from the approved moodboard's visual language.
- On first profile creation, the user selects a character base instead of receiving a generic placeholder image.
- Characters are customizable through modular visual attributes such as hairstyle, facial/visual details, clothing, accessories, color accents, pose/expression and unlocked rank elements, while preserving the AFTER HOURS art direction.
- Rank progression can unlock additional avatar frames, outfits, accessories, badges and visual effects.
- Users can change/customize their character later from Profile.
- Avatar choices should be represented as structured data/configuration rather than hard-coded per screen.
- The same character identity should be reused consistently across profile, session UI, progression, achievements and other appropriate surfaces.
- Do not use generic stock avatars or unrelated emoji avatars as the default experience.
- The character system must remain cohesive with the approved moodboard and premium black/deep-purple/gold visual system.

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
- Always-accessible Safety route
- Safety reports must be clearly separated from normal support

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

## DAILY AFTER HOURS

A daily return experience:
- Daily welcome / Tonight's Energy
- Oracle card
- Horoscope
- Mood check
- Daily challenge
- Current streak
- Personalized experience recommendation

## PERSONALIZATION ENGINE

Within explicit user preferences and consent boundaries, personalize:
- Preferred experience duration
- Favorite moods
- Difficulty
- Dynamics
- Audio preferences
- Guide persona/tone
- Frequently favorited experiences
- Skipped/pass patterns
- Recommendations

Personalization must not infer or expose sensitive attributes unnecessarily and must never override consent or safety settings.

## THE AFTER HOURS ARCHIVE

A private, unified personal history:
- Experiences
- Oracle draws
- Achievements
- Private notes
- Collection
- Progress
- Session history
- Favorites

The Archive should feel like a private digital vault, not a generic activity log.

## COLLECTIONS & COLLECTIBLES

- Oracle cards
- Badges
- Avatar frames
- Titles
- Character items
- Rank rewards
- Seasonal/limited visual collectibles

Collectibles are cosmetic/progression-oriented and must not create pay-to-win mechanics.

## AFTER HOURS INBOX & NOTIFICATIONS

### Inbox
- Official AFTER HOURS messages
- Product updates
- Feature announcements
- Account notices
- Personal unlocks
- Support replies
- Safety/account alerts

### Notification controls
Users can independently control:
- Achievements
- Level-ups
- Streaks
- Oracle
- New experiences
- Messages
- Support
- Non-urgent product notifications

Critical safety/security notifications remain appropriately prominent.

## HELP CENTER / SUPPORT

A persistent, easy-to-find support entry:
- General question
- Bug / technical issue
- Account / login issue
- Payment issue
- Content issue
- Safety / report
- Contact AFTER HOURS Support
- FAQ / help articles
- Support request history
- Support replies

Support requests should be manageable in the Control Room. Technical reports may attach safe diagnostic context, but must not automatically transmit private or sensitive session content.

### Safety vs Support

Normal support and safety reporting are separate routes. Safety must be reachable immediately from relevant experiences and must not require navigating through normal support.

## PRIVACY MODE

A quick privacy-protection mode for mobile and shared environments:
- Hide sensitive previews
- Lock/obscure the app view
- Protect access where supported by device capabilities
- Resume safely after unlock
- Avoid exposing sensitive content in notifications/previews

Privacy Mode must not interfere with emergency stop/safety actions.

## AFTERCARE MODE

After an experience, transition into a calmer dedicated state:
- Breathing / grounding option
- Calm audio
- Short reflection
- Feeling check
- Private note
- Session close
- Return to Archive/Profile

Aftercare must remain optional and non-judgmental.

## ADMIN / CONTROL ROOM

- Manage experiences
- Manage tasks/content
- Manage users
- Manage progression
- Manage sessions
- Manage media
- Manage audio
- Manage Oracle content
- Manage avatar/character catalog
- Moderation/safety controls
- Test and preview tools
- Manage support tickets
- Manage FAQ/help content
- Manage announcements and notification campaigns
- Review safe diagnostic information
- Manage collectibles and seasonal content

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
- Separate privacy-aware data boundaries for support, session history, notes and safety records

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
13. Final visual QA is completed against the approved moodboard, including the avatar/character system.
14. Help Center, support routing and Safety routing are tested.
15. Privacy Mode and notification privacy are tested.
16. Aftercare and Archive flows are tested.
17. Personalization respects consent and privacy boundaries.
18. Control Room support/moderation workflows are tested.
19. Release branch is reviewed before merge to main.

## Current repository note

The current client is the visual/interaction foundation. Authentication, persistent profiles, database-backed sessions and payment infrastructure still need production integration before public launch.

## Release rule

Do not push or merge to main until the release gates above are satisfied and the user explicitly asks to push/merge.
