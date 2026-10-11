# AFTER HOURS — Approved Feature Checklist

This checklist is the working acceptance scope for the AFTER HOURS build. Items are not considered complete merely because a screen or button exists: implementation, persistence, access control, mobile behavior, and verification must be checked where applicable.

## Non-negotiable product constraints
- Preserve existing approved features, navigation, safety flows, pricing, and premium visual identity.
- Use the official AFTER HOURS logo asset and correct typography consistently. Do not replace it with an AI redraw or a text-only imitation.
- Keep the approved cinematic black, warm gold, and deep purple palette; do not redesign unrelated areas.
- Keep the teaser as the second screen. It must not block normal entry into the app.
- The maintenance gate is disabled by default.
- The app supports Dutch and English. Use direct je/jij address in Dutch rather than speaking to one user as “jullie”.
- Preserve the approved English brand glossary and labels: AFTER HOURS, punchlines, game titles, ranks, Tarot/Oracle/Astrology, Character Creation, Experiences, Radio, Daily AFTER HOURS, Achievements & Collection, THE AFTER HOURS ARCHIVE, Inbox, Control Room, Aftercare Mode, Privacy Mode, Help Center & Support. Keep PASS / STOP / CONTINUE unchanged.
- Keep approved ranks exactly: THE CURIOUS, THE INITIATE, THE DEVOTED, THE DISCIPLINED, THE ENTHRALLED, THE BOUND, AFTER HOURS.
- Do not describe payment, production migrations, push delivery, or deployment as live until verified end-to-end.

## Feature acceptance checklist

### 1. Brand, intro, teaser, and app shell
- [ ] Official logo and typography visually verified in intro, teaser, main app, maintenance/error/loading screens, favicon, and iPhone home-screen/PWA icon.
- [ ] Preserve approved intro and cinematic visual style.
- [ ] Teaser remains the second screen; normal entry and returning users are not trapped behind it.
- [ ] Under Construction teaser conveys a premium, clearly 18+ BDSM-themed experience without disrupting core app access.
- [ ] Loading, error recovery, and maintenance screens match the same brand system.

### 2. Games, experiences, and sessions
- [ ] The Deck and approved games/experiences work end-to-end.
- [ ] Session flow, round navigation, timers, pause/resume, stop-now control, and session recovery work on mobile.
- [ ] Consent is explicit, revocable, and checked before gated experiences.
- [ ] Boundaries, pause/stop signals, and safe-session settings are available without paywall restrictions.
- [ ] Aftercare Mode and post-session check-ins work and are available in NL/EN.
- [ ] Session history and completed-session state persist correctly and do not double-count.

### 3. Missions, XP, levels, ranks, achievements, and collection
- [ ] Daily, weekly, and special missions reset or persist on the correct schedule.
- [ ] Mission completion is not falsely awarded just for opening a feature; completion conditions are meaningful and clear.
- [ ] Mission rewards integrate with the established XP/progression system exactly once, with duplicate completion prevented.
- [ ] XP, levels, approved rank thresholds/names, badges, and achievement collection remain consistent.
- [ ] Badge events cover login, horoscope/astrology, Kinky Tarot, Oracle, consent confirmation, completed sessions, and prompts as appropriate.
- [ ] User can see earned badges and progress in the profile / Achievements & Collection.
- [ ] Do not reward coercive behavior; safety, consent, and personal boundaries always take priority over rewards.

### 4. Kinky Tarot, Oracle, astrology, and daily content
- [ ] Kinky Tarot works and supports the approved language glossary.
- [ ] Oracle feature works.
- [ ] Astrology/horoscope reflection works, including the discussed daily check-in.
- [ ] Relevant activity can award the appropriate badge/progress without duplicates.
- [ ] Reflection prompts and cards are translated consistently in NL/EN.

### 5. Accounts, onboarding, profile, identity, and privacy
- [ ] Practical sign-in options: Google, Apple, and email; email supports magic link and/or password flows already designed.
- [ ] Unique AFTER HOURS username/display name and account creation/update work correctly.
- [ ] Onboarding, avatar/Character Creation, profile, Privacy Mode, and account sign-out behave consistently.
- [ ] Account-backed state syncs safely; local-only state is clearly distinguished from account-synced state.
- [ ] User data and private session/media content are not exposed through public routes or admin views.

### 6. Radio, audio, and notifications
- [ ] BDSM-themed Radio screen is functional and bilingual.
- [ ] Investigate Spotify integration, respecting licensing and restrictions on commercial streaming; do not imply that Spotify is cleared for commercial use.
- [ ] In-app notifications and sound preferences behave as designed.
- [ ] Push notifications require a real subscription and server/provider implementation; verify before claiming push is live.

### 7. Monetization and checkout
- [ ] Preserve approved prices: €9.99 for one premium game and €24.99 for the three-game collection.
- [ ] Free access keeps safety features available without a paywall.
- [ ] Replace local “save interest” placeholders with a genuine, secure server-side checkout before accepting payment.
- [ ] Confirm payment provider explicitly permits the intended adult BDSM-related digital content.
- [ ] Verify payment confirmation, order records, access grants, refunds/failures, and duplicate-payment handling before launch.
- [ ] Do not claim revenue tracking or checkout is live until end-to-end verified.

### 8. Control Room / administration / backend
- [ ] Admin access must be server-authorized, never based only on a client-side flag.
- [ ] Supabase admin migration, roles/allowlist, metrics RPC, content/round editor, and audit logging are applied and tested in the intended environment.
- [ ] Admin views show only necessary aggregated data and protect private content.
- [ ] Verify database schema, row-level security, migrations, and account/session synchronization.
- [ ] Add secure maintenance/update controls for administrators only if the backend design supports authenticated, audited changes.
- [ ] Show setup/unavailable states honestly when backend configuration is missing.

### 9. App updates, scheduled maintenance, and service continuity
- [ ] Check for app updates and offer a clear update/reload notice when a waiting service worker is available.
- [ ] Scheduled maintenance supports valid start/end timestamps and remains off by default.
- [ ] Show advance warnings using the configured warning window, in the selected language.
- [ ] During maintenance, show the configured NL/EN message and planned end time when available.
- [ ] Invalid dates or failed config fetches must not accidentally lock users out.
- [ ] Verify maintenance transitions while the app is already open, including visibility/refresh behavior.
- [ ] Do not claim server push alerts are operational until a push service and subscriptions are implemented.

### 10. Language and copy consistency
- [ ] NL/EN coverage for screens, buttons, notices, validation, errors, missions, badges, profile, Tarot/Oracle/Astrology, and maintenance.
- [ ] Dutch copy addresses one user with je/jij.
- [ ] Preserve approved English labels, rank names, product names, and PASS / STOP / CONTINUE.
- [ ] Avoid accidental mixed-language screens or generic replacement copy.

### 11. iPhone, Android, PWA, and accessibility
- [ ] Responsive layouts and touch targets work on iPhone and Android.
- [ ] Check safe areas, short screens, keyboard/input behavior, scroll, and bottom navigation.
- [ ] Verify installation and launch as a PWA in supported mobile browsers.
- [ ] Check Chrome and Safari behavior, including service-worker update/reload handling.
- [ ] Test keyboard focus, accessible labels, selected states, contrast, and reduced-motion behavior where relevant.

### 12. Verification and release discipline
- [ ] Run unit tests and production build after changes.
- [ ] Test the actual critical flows: teaser-to-app, login/account creation, consent, games/sessions, stop/pause, progression/badges, Radio, maintenance, and mobile navigation.
- [ ] Visually compare the official logo and layout on real mobile viewports.
- [ ] Keep work on the feature branch and PR until explicitly approved for merge/release.
- [ ] Distinguish clearly between code committed, CI-tested, backend configured, production deployed, and end-to-end verified.

## Current known implementation gaps to verify
- Mission points are currently tracked separately from profile XP; integration must be made idempotent and consistent before being called complete.
- Maintenance config currently supports enabled/start/end fields, but warningMinutes and custom messages are not yet wired into a scheduled pre-warning and maintenance screen.
- Monetization screen currently records local interest only; no checkout is started.
- Admin dashboard depends on the correct Supabase configuration and migration; production setup is not assumed.
- Service-worker update UI exists in the feature branch; real push delivery is not assumed.
