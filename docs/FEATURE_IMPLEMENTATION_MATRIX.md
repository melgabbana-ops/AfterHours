# AFTER HOURS feature implementation matrix

Last source audit: 12 October 2026  
Branch: `feature/missions-updates-maintenance`  
Purpose: distinguish real code, partial UI, unverified backend setup and missing scope. A file or green build is not proof of end-to-end functionality.

Status meanings:
- **Implemented in code**: source exists for the named behavior; runtime/backend verification may still be pending.
- **Partial**: some UI or supporting logic exists, but one or more approved acceptance criteria are absent.
- **Missing**: no implementation was found in the current repository tree.
- **External prerequisite**: code cannot be treated as operational until the named provider, Supabase project, secrets, policy or account setup has been completed and verified.
- **Verify**: implementation may exist, but relevant manual/integration tests have not been evidenced.

## Product scope

| Approved feature | Current source evidence | Status | Remaining work / acceptance test |
|---|---|---|---|
| Official logo / black-gold brand | `public/after-hours-logo.svg`, `src/styles.css`, `src/Teaser.tsx` | Partial | Some styles still use near-black and legacy gold rather than the approved deep-plum palette. Verify the exact approved logo and consistent sizing on every screen. |
| Cinematic teaser | `src/Teaser.tsx`, `public/under-construction.html` | Partial | Trailer is hosted on an external Picsart URL. Verify availability, mobile playback, fallback and final approved reveal text/video. |
| 18+ gate | `src/main.tsx` | Partial | Currently a self-declaration, not age verification. Legal/product review needed before release. Consent is separately checked. |
| Four-step onboarding | `src/Onboarding.tsx` | Implemented in code / Verify | Install guidance and trailer markup exist. Verify only-first-time behavior, Skip/Later, persisted completion, all languages and mobile media playback. |
| PWA manifest and installation | `public/manifest.webmanifest`, `index.html`, `public/sw.js` | Partial | Manifest currently references one SVG icon only. Create/test 192px, 512px and Apple touch PNG icons; verify install on Safari and Chrome. |
| Character builder | `src/CharacterStudio.tsx` | Partial | Character UI exists. Verify profile/account persistence and whether visual identity actually evolves with the seven ranks. |
| Approved seven ranks | `src/progression.ts` | Implemented in code / Verify | Names and XP thresholds are present: THE CURIOUS, THE INITIATE, THE DEVOTED, THE DISCIPLINED, THE ENTHRALLED, THE BOUND, AFTER HOURS. Verify all rank frames, unlocks and profile displays. |
| XP, level and rank ledger | `src/main.tsx`, `src/services/backend.ts`, `supabase/migrations/20261007_initial_schema.sql` | Partial | Server currently grants fixed session XP on session completion. A full event ledger, combo multiplier, XP reasons and historical idempotency for all event types are not wired. Do not award authoritative XP locally. |
| Achievement badges | `src/achievements.ts`, `src/BadgeShowcase.tsx` | Partial | Event and earned badge state are browser-local. Verify complete approved badge catalogue, cross-device persistence, repeated-event handling and account separation. |
| Command / prompt library | `src/PromptLibrary.tsx`, `src/promptTranslations.ts`, `src/promptLibrary.test.ts` | Implemented in code / CI pending | 139 prompt items total, with 100 entries in the Kinky opdrachten category and English copy for all items. Automated test now guards the minimum count, unique IDs and English translations. This is not the same as verifying every command flow on mobile. |
| Five game modes | `src/PromptLibrary.tsx`, `src/main.tsx` | Partial / Missing acceptance flow | Several game cards/experience types exist, but the five named modes STORY, RANDOM, SURPRISE, CUSTOM and BOSS are not connected as a single mode-selection and session flow. |
| Seven story chapters | Current tree search did not find the seven approved chapter names in the active game flow | Missing | Implement THE ARRIVAL, THE TEST, THE CONTROL, THE CHALLENGE, THE BOUNDARY, THE NIGHT and AFTER HOURS with persistent chapter progress and chapter-specific content. |
| Session HUD / timer / pause / pass / stop | `src/main.tsx`, `src/storage.ts`, `src/services/sessionSafety.ts`, Supabase session RPC migrations | Partial | Three database rounds and timer persistence exist. Verify STOP while offline, timer/background recovery, PASS semantics, final mood and aftercare; add automated transition tests. |
| Consent and revocation | `src/main.tsx`, `supabase/migrations/20261009090000_allow_renewed_consent.sql`, subsequent consent/session migrations | Implemented in code / External prerequisite | Consent RPC and database guards exist in source. Must apply/verify migrations against the actual Supabase project and test competing requests, revocation and active session stopping. |
| Mood checks | `src/main.tsx`, `src/Insights.tsx`, `src/SafetyPlan.tsx` | Partial | Basic check-in / safety state exists; complete approved pre/during/after mood catalog and persistent mood history require verification/implementation. |
| Aftercare and private notes | `src/main.tsx`, `src/Insights.tsx`, `src/MediaVault.tsx` | Partial | Aftercare choice and reflection UI exist. Verify 30-minute meditation, private notes, mood history, session summary and deletion controls. |
| Private media vault | `src/MediaVault.tsx`, `src/services/media.ts`, `supabase/migrations/20261009090400_private_media_bucket.sql` | Partial | Private image/audio uploads, signed URLs and deletes exist in source. Current file picker supports images/audio, not video capture or a voice recorder. Verify RLS, ownership, expiry and mobile permission-denied cases. |
| Camera frames / photo / video / voice capture | `src/PromptLibrary.tsx`, `src/MediaVault.tsx` | Partial | Camera-themed prompts exist. Native capture modes CLEAN/AFTER HOURS/CINEMATIC, actual in-app photo/video/voice recording and capture-to-private-vault workflow need implementation. |
| Radio and sound design | `src/RadioRoom.tsx`, `src/services/notificationSound.ts` | Partial | Radio currently opens external Spotify searches by mood; it does not stream in-app or implement the seven session music phases. SFX are partial; crossfade, voice ducking and haptics need work/verification. Spotify/commercial rules require separate review before a true integration. |
| Kinky Tarot, Oracle and astrology | `src/Insights.tsx`, `src/astrology.ts`, `src/astrology.test.ts` | Implemented in code / Verify | Reflection cards and astrology logic exist. Verify content, language switching, daily reset, achievements and privacy behavior. |
| Missions | `src/Missions.tsx` | Partial | Daily/weekly/special missions and local mission points exist. Completion is self-marked and stored in localStorage; it does not authoritatively award XP or sync across devices. Design server-side idempotent rewards before any rank integration. |
| Favorites / collection / archive | `src/PromptLibrary.tsx`, `src/MediaVault.tsx`, `src/main.tsx` | Partial / Verify | Some prompt/media interactions exist; verify account persistence, full approved collection/archive and data export/delete flows. |
| Notifications and push | `src/main.tsx`, `src/services/notifications.ts`, `public/sw.js` | Partial | In-app notifications and a push event display handler exist. Push subscription, permission UX, delivery provider and server sender are not configured in this repository. |
| Login / account lifecycle | `src/services/auth.ts`, `src/main.tsx`, `.env.example` | Partial / External prerequisite | Email magic link/password, reset and provider calls exist. Real Supabase URL/key and Google/Apple OAuth configuration are external prerequisites; verify sign-up, recovery, deletion and username edge cases. |
| Supabase schema, RLS, consent, media | `supabase/schema.sql`, `supabase/migrations/`, `supabase/README.md` | Implemented in source / External prerequisite | Migration files and RLS/RPCs exist, but the live project, migration history and policies have not been proven from source access. Apply only after checking baseline and approval. |
| Admin / Control Room | `src/AdminDashboard.tsx`, `supabase/migrate_admin_dashboard.sql` | Partial / External prerequisite | Admin allowlist, three-round editing, metrics and audit log are present. Approved command/rank/achievement/music/product/payment/social-template/test-mode editors are not all implemented. Live admin role and migrations need verification. |
| Monetization / credits / checkout | `src/Monetization.tsx`, `docs/MONETIZATION_PLAN.md` | Partial | Pricing UI (€9.99 single / €24.99 three-game collection) only saves local interest. No checkout, verified webhook, credit ledger, refunds or fulfillment exists. Keep real payment disabled until an adult-content-approved provider, merchant setup, server endpoints and webhook tests are verified. |
| Legal pages and complaints | No dedicated legal-page routes/files found in the current source tree | Missing | Implement Terms, Privacy, Refund, Consent, Content Rules, removal/complaints and GDPR account deletion before release. Requires legal review. |
| Social templates / promotional builder | No dedicated social-template or announcement-builder component found in the current source tree | Missing | Add reusable templates, platform-specific formats and export flows; distinguish copy/content from actual image/video export. |
| Language / brand glossary | `src/UnderConstruction.tsx`, `src/Teaser.tsx`, `src/promptTranslations.ts`, `src/brandGlossary.ts` | Partial | Dutch/English switching exists. Test every screen and all labels; correct “you” wording and ensure the glossary/copy rules cover all content. |
| Planned maintenance | `public/maintenance.json`, `src/maintenance.ts`, `src/maintenance.test.ts`, `src/UnderConstruction.tsx`, `src/main.tsx` | Implemented in code / CI + device verification pending | Schedule, warning window, localized custom copy, start/end display and switch to the maintenance screen are wired. Verify in browsers and across time zones. |
| User-approved app updates | `src/main.tsx`, `public/sw.js` | Implemented in code / CI + device verification pending | New worker waits for explicit “Refresh now” action. Verify first install, update notice, offline fallback and controller-change reload on iOS/Android. |
| Responsive design / accessibility | `src/styles.css`, component-level semantic controls | Partial | Existing responsive CSS exists, but required width matrix, keyboard/VoiceOver, 48px targets, focus states, reduced motion, contrast and performance audits remain. |
| Test mode and release gates | `src/main.tsx`, `.github/workflows/build.yml`, existing Vitest suite | Partial | Automated unit/build workflow exists. Admin test mode, integration/E2E, payment/webhook scenarios and mobile manual QA are not evidenced. A green build is not release certification. |

## Immediate implementation order

1. Run the latest CI and fix any TypeScript, unit-test or build failures.
2. Finish the feature matrix and keep acceptance status truthful.
3. Add mode selection and seven story chapters without weakening server-side session/consent checks.
4. Implement missions with a server-authoritative, idempotent reward ledger before connecting them to rank XP.
5. Complete private capture (photo/video/voice) and session/mood/aftercare persistence with ownership tests.
6. Finish PWA icons and accessibility/mobile tests.
7. Build the missing legal and social-template screens.
8. Only after all above: evaluate approved provider/account setup for payments, push and live admin.
9. Review every completed line against the acceptance checklist. No production migration, merge or deployment without the required approval.

## External dependencies that cannot be completed from repository code alone

- Supabase project URL/key, current database state, applied migrations and an allowlisted admin account.
- Google/Apple OAuth provider configuration and email delivery settings.
- An adult-content-permitting payment provider, verified merchant account, server secrets, webhook endpoint and refund/test transactions.
- Push delivery credentials/provider and browser permission verification.
- Legal approval of age gating, terms/privacy/refunds and adult-content policies.
- Real-device testing on iPhone Safari and Android Chrome.

This matrix is an engineering audit, not a claim that the whole approved product is release-ready.
