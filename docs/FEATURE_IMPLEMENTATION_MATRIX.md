# AFTER HOURS feature implementation matrix

Last source audit: 12 October 2026  
Branch: `audit/daily-revenue-lovense-camera` (based on current `main`)  
Purpose: distinguish real code, partial UI, unverified backend setup and missing scope. A file or green build is not proof of end-to-end functionality.

Status meanings:
- **Implemented in code**: source exists for the named behavior; runtime/backend verification may still be pending.
- **Partial**: some UI or supporting logic exists, but one or more approved acceptance criteria are absent.
- **Missing**: no implementation was found in the current repository tree.
- **External prerequisite**: code cannot be treated as operational until the named provider, Supabase project, secrets, policy or account setup has been completed and verified.
- **Verify**: implementation may exist, but relevant manual/integration tests have not been evidenced.

## Product scope

| Lovense connection | `src/LovenseControl.tsx`, `supabase/functions/lovense-auth-token/index.ts`, `docs/LOVENSE_INTEGRATION.md` | UI + server token scaffold implemented / not live-verified | Uses the official Lovense Basic JS SDK pattern and server-side developer-token exchange. User must be authenticated, opt in and manually enable controls; first test pulse is capped at 5 seconds and STOP NOW is available. Requires approved Lovense developer platform, correct Supabase secrets/origin allowlist, deployed Edge Function, CSP validation, and real device tests on iOS/Android. No automatic mission/game/camera-triggered commands yet. |
| Daily engagement / repeat use | `src/DailyAfterHours.tsx`, `src/DailyAfterHours.test.ts`, `src/services/dailyRituals.ts`, `src/services/missions.ts`, `supabase/migrations/20261012130000_daily_ritual_history.sql`, `public/manifest.webmanifest` | Daily ritual + account-history code implemented / migration and device QA pending | Fourteen rotating bilingual micro-rituals, UTC day keys, local fallback, server-owned 120-day history RPC, idempotent daily completion, daily mission points kept separate from rank XP, links to missions/insights and a PWA shortcut. Cross-device sync only works after the new migration is applied. Archive/calendar, weekly content drops, analytics, timezone preference and live Supabase migration remain open. |
| Club membership UI | `src/Monetization.tsx`, `docs/DAILY_RETENTION_AND_MEMBERSHIP.md` | Proposed pricing UI only / no live billing | €8.99/month and €79.99/year are draft proposals; buttons save local interest only. No charge, subscription or paid entitlement is created. Build actual benefits and server entitlements, obtain written adult-product underwriting, then implement checkout, verified/idempotent webhooks, renewal/failure, receipts, VAT disclosures, self-serve cancellation, refunds/disputes and admin reconciliation. Safety, consent, hard limits, PAUSE/PASS/STOP, core aftercare, support and deletion must remain free. |

| Approved feature | Current source evidence | Status | Remaining work / acceptance test |
|---|---|---|---|
| Official logo / black-gold brand | `public/after-hours-logo.svg`, `src/styles.css`, `src/Teaser.tsx` | Partial | Some styles still use near-black and legacy gold rather than the approved deep-plum palette. Verify the exact approved logo and consistent sizing on every screen. |
| Cinematic teaser | `src/Teaser.tsx`, `public/under-construction.html` | Partial | Trailer is hosted on an external Picsart URL. Verify availability, mobile playback, fallback and final approved reveal text/video. |
| 18+ gate | `src/main.tsx` | Partial | Currently a self-declaration, not age verification. Legal/product review needed before release. Consent is separately checked. |
| Four-step onboarding | `src/Onboarding.tsx` | Implemented in code / Verify | Install guidance and trailer markup exist. Verify only-first-time behavior, Skip/Later, persisted completion, all languages and mobile media playback. |
| PWA manifest and installation | `public/manifest.webmanifest`, `index.html`, `public/sw.js`, `public/after-hours-icon-192.png`, `public/after-hours-icon-512.png` | Implemented in code / device verification pending | Manifest references actual 192px and 512px PNG assets; favicon, Apple touch icon and notification/service-worker shell now use raster icons. Verify installation and icon rendering on actual iOS Safari and Android Chrome. |
| Character builder | `src/CharacterStudio.tsx` | Partial | Character UI exists. Verify profile/account persistence and whether visual identity actually evolves with the seven ranks. |
| Approved seven ranks | `src/progression.ts` | Implemented in code / Verify | Names and XP thresholds are present: THE CURIOUS, THE INITIATE, THE DEVOTED, THE DISCIPLINED, THE ENTHRALLED, THE BOUND, AFTER HOURS. Verify all rank frames, unlocks and profile displays. |
| XP, level and rank ledger | `src/main.tsx`, `src/services/backend.ts`, `supabase/migrations/20261007_initial_schema.sql`, `supabase/migrations/20261012110000_xp_event_ledger.sql` | Partial / session completion only | The new migration adds an owner-readable, server-write-only XP ledger and makes the existing 120-XP session completion atomic and unique per session. Per-command XP, combo multipliers, streaks, achievement-linked awards and other approved event types are not yet wired; never reward PASS, PAUSE, STOP or crossing a boundary. Apply migration only after reviewing the target database history. |
| Achievement badges | `src/achievements.ts`, `src/BadgeShowcase.tsx`, `src/achievements.test.ts` | Partial | Logged-in users' earned badges are separated by profile ID in local storage; anonymous demo uses a device-only bucket. Badges are still not server-synced across devices. Verify the complete approved catalogue and repeated-event behavior. |
| Command / prompt library | `src/PromptLibrary.tsx`, `src/promptTranslations.ts`, `src/promptLibrary.test.ts` | Implemented in code / CI pending | 139 prompt items total, with 100 entries in the Kinky opdrachten category and English copy for all items. Automated test now guards the minimum count, unique IDs and English translations. This is not the same as verifying every command flow on mobile. |
| Five game modes + story chapters | `src/sessionModes.ts`, `src/sessionModes.test.ts`, `src/PromptLibrary.tsx`, `src/styles.css` | Implemented in UI / Partial end-to-end | The selector exposes STORY, RANDOM, SURPRISE, CUSTOM and BOSS; RANDOM draws an actual random command card, and the seven named chapters and five-step Boss Mode are wired to existing guided rounds. The seven named chapters and five-step Boss Mode are wired to existing guided rounds. Chapter progress is not yet persisted server-side, and these mode rounds are not yet integrated with the authoritative session XP/consent flow. |
| Story chapters | `src/sessionModes.ts`, `src/sessionModes.test.ts`, `src/PromptLibrary.tsx` | Implemented in UI / Partial end-to-end | Seven approved chapters are defined in English and mapped to guided rounds, with an opening prompt per chapter. Server-side chapter progress, resumability and authoritative session/reward integration are not complete. |
| Session HUD / timer / pause / pass / stop | `src/main.tsx`, `src/storage.ts`, `src/services/sessionSafety.ts`, Supabase session RPC migrations | Partial | Three database rounds and timer persistence exist. Verify STOP while offline, timer/background recovery, PASS semantics, final mood and aftercare; add automated transition tests. |
| Consent and revocation | `src/main.tsx`, `supabase/migrations/20261009090000_allow_renewed_consent.sql`, subsequent consent/session migrations | Implemented in code / External prerequisite | Consent RPC and database guards exist in source. Must apply/verify migrations against the actual Supabase project and test competing requests, revocation and active session stopping. |
| Mood checks | `src/main.tsx`, `src/Insights.tsx`, `src/SafetyPlan.tsx` | Partial | Basic check-in / safety state exists; complete approved pre/during/after mood catalog and persistent mood history require verification/implementation. |
| Aftercare and private notes | `src/main.tsx`, `src/Insights.tsx`, `src/MediaVault.tsx` | Partial | Aftercare choice and reflection UI exist. Verify 30-minute meditation, private notes, mood history, session summary and deletion controls. |
| Private media vault | `src/MediaVault.tsx`, `src/services/media.ts`, `supabase/migrations/20261009090400_private_media_bucket.sql`, `supabase/migrations/20261012100000_private_video_capture.sql` | Implemented in code / external migration + device verification pending | Image/file picker, direct camera photo capture, video and voice-only recording now exist. Camera photos and chosen image/audio/video files now stage for local preview and need a separate Save action before upload. Recording requires explicit confirmation, stops at 60 seconds, previews locally before upload and checks the 20 MiB limit. MediaRecorder codec parameters are normalized to the allowlisted base MIME type before storage. Verify live bucket MIME settings, RLS, ownership, interrupted streams, upload failure and mobile permissions after applying migration. |
| Camera frames / photo / video / voice capture | `src/MediaVault.tsx`, `src/mediaOverlay.ts`, `src/mediaOverlay.test.ts` | Branded overlay code implemented / device verification pending | CLEAN, AFTER HOURS and CINEMATIC are selectable. The live video preview is composited through a canvas and the same canvas stream is recorded, so the frame is burned into new video. Selected images are locally composited before the user separately saves them. Existing videos are not re-rendered. iOS/Android Safari permissions, rotation, audio sync, codec support, interruption and upload failure still require real-device QA. |
| Lovense device integration | `src/LovenseControl.tsx`, `supabase/functions/lovense-auth-token/index.ts`, `docs/LOVENSE_INTEGRATION.md` | UI + server-token function coded / external setup and real-device QA blocked | Official Lovense Basic JS SDK is loaded only after explicit user action. The Edge Function validates Supabase auth and keeps the developer token server-side. Current UI supports a manually enabled five-second test only; STOP NOW disables manual controls and disconnect/timeout resets the SDK. No automatic command is tied to a game, XP, camera or mood. Not live until Lovense approves the registered platform, secrets/origins are configured, function is deployed, CSP is updated and iOS/Android + actual toy tests pass. |
| Radio and sound design | `src/RadioRoom.tsx`, `src/services/notificationSound.ts` | Partial | Radio currently opens external Spotify searches by mood; it does not stream in-app or implement the seven session music phases. SFX are partial; crossfade, voice ducking and haptics need work/verification. Spotify/commercial rules require separate review before a true integration. |
| Kinky Tarot, Oracle and astrology | `src/Insights.tsx`, `src/astrology.ts`, `src/astrology.test.ts` | Implemented in code / Verify | Reflection cards and astrology logic exist. Verify content, language switching, daily reset, achievements and privacy behavior. |
| Missions | `src/Missions.tsx`, `src/services/missions.ts`, `supabase/migrations/20261012090000_mission_progress.sql` | Server flow coded / external migration prerequisite | Configured mode uses authenticated `get_mission_progress` and idempotent `complete_mission` RPCs; server assigns fixed rewards and UTC day/week/season, while demo mode remains local and separate from rank XP. Mission copy is bilingual. Apply the migration only after checking the target project's current migration history; test RLS/RPCs, period reset and double-click behavior. |
| Favorites / collection / archive | `src/PromptLibrary.tsx`, `src/MediaVault.tsx`, `src/main.tsx` | Partial / Verify | Some prompt/media interactions exist; verify account persistence, full approved collection/archive and data export/delete flows. |
| Notifications and push | `src/main.tsx`, `src/services/notifications.ts`, `public/sw.js` | Partial | In-app notifications and a push event display handler exist. Push subscription, permission UX, delivery provider and server sender are not configured in this repository. |
| Login / account lifecycle | `src/services/auth.ts`, `src/main.tsx`, `.env.example` | Partial / External prerequisite | Email magic link/password, reset and provider calls exist. Real Supabase URL/key and Google/Apple OAuth configuration are external prerequisites; verify sign-up, recovery, deletion and username edge cases. |
| Supabase schema, RLS, consent, media | `supabase/schema.sql`, `supabase/migrations/`, `supabase/README.md` | Implemented in source / External prerequisite | Migration files and RLS/RPCs exist, but the live project, migration history and policies have not been proven from source access. Apply only after checking baseline and approval. |
| Admin / Control Room | `src/AdminDashboard.tsx`, `supabase/migrate_admin_dashboard.sql` | Partial / External prerequisite | Admin allowlist, three-round editing, metrics and audit log are present. Approved command/rank/achievement/music/product/payment/social-template/test-mode editors are not all implemented. Live admin role and migrations need verification. |
| Monetization / credits / checkout | `src/Monetization.tsx`, `docs/MONETIZATION_PLAN.md`, `docs/DAILY_RETENTION_AND_MEMBERSHIP.md` | Partial / no live revenue | One-time offers (€9.99 single / €24.99 three-game collection) and proposed Club (€8.99/month, €79.99/year) are UI-only; interest is local and no payment is collected. Daily ritual, rotating prompt and local streak exist. No checkout, verified webhook, server entitlement/subscription state, credit ledger, refund/cancellation flow or fulfillment. Do not market proposed Club benefits until delivered. Processor approval for the adult/BDSM product is a blocker; Stripe's published policy excludes many adult-content/services. Verotel/Segpay are candidates only, not approved. |
| Legal pages and complaints | `src/LegalCenter.tsx`, `src/main.tsx`, `src/types.ts` | Draft UI implemented / Legal and operational review blocked | Six NL/EN draft documents (terms, privacy, refund, consent, content rules, complaints/removal) are reachable from the public 18+ gate and home screen. They explicitly disclose draft-only status. Actual complaint submission, GDPR delete/export operations, operator/contact details and legal approval remain missing. |
| Social templates / promotional builder | `src/SocialStudio.tsx`, `src/SocialStudio.test.ts`, `src/main.tsx`, `src/styles.css` | Text studio implemented / Visual export missing | Editable NL/EN templates support 8 platforms and 9 formats; generated text can be copied or downloaded as a `.txt` file. Unit tests cover every platform and key formats. Image/video design export, branded media asset generation, saving templates to account and publishing integrations remain missing. |
| Language / brand glossary | `src/UnderConstruction.tsx`, `src/Teaser.tsx`, `src/promptTranslations.ts`, `src/brandGlossary.ts` | Partial | Dutch/English switching exists. Test every screen and all labels; correct “you” wording and ensure the glossary/copy rules cover all content. |
| Planned maintenance | `public/maintenance.json`, `src/maintenance.ts`, `src/maintenance.test.ts`, `src/UnderConstruction.tsx`, `src/main.tsx` | Implemented in code / CI + device verification pending | Schedule, warning window, localized custom copy, start/end display and switch to the maintenance screen are wired. Verify in browsers and across time zones. |
| User-approved app updates | `src/main.tsx`, `public/sw.js` | Implemented in code / CI + device verification pending | New worker waits for explicit “Refresh now” action. Verify first install, update notice, offline fallback and controller-change reload on iOS/Android. |
| Responsive design / accessibility | `src/styles.css`, component-level semantic controls | Partial | Existing responsive CSS exists, but required width matrix, keyboard/VoiceOver, 48px targets, focus states, reduced motion, contrast and performance audits remain. |
| Test mode and release gates | `src/main.tsx`, `.github/workflows/build.yml`, existing Vitest suite | Partial | Automated unit/build workflow exists. Admin test mode, integration/E2E, payment/webhook scenarios and mobile manual QA are not evidenced. A green build is not release certification. |

## Immediate implementation order

1. Run the latest CI and fix any TypeScript, unit-test or build failures.
2. Keep the feature matrix synced to verified code, not just implementation intent.
3. Integrate the new mode/chapter UI into server-owned consent, session progression and idempotent XP.
4. Apply and verify the mission-progress SQL migration in the correct Supabase project; do not connect mission points to rank XP yet.
5. Complete private capture (photo/video/voice) and session/mood/aftercare persistence with ownership tests.
6. Finish PWA icon assets and accessibility/mobile tests.
7. Add actual complaint intake and GDPR data export/deletion behind the legal information hub; obtain legal review.
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


## Follow-up verification pass — 12 October 2026

### Changes now present on `audit/daily-revenue-lovense-camera`

- [x] Lovense is reachable through Profile → Settings → Connected devices rather than a mandatory/home-level entry. It remains optional; the core app works without a toy.
- [x] Daily After Hours is a first-class destination and now has a PWA shortcut (`/?screen=daily`). The app also accepts direct `daily` and `lovense` screen links.
- [x] Camera frame choices CLEAN, AFTER HOURS and CINEMATIC are rendered into new in-app video via canvas captureStream, and selected images are composited locally before explicit save.
- [x] Lovense server-token function validates the signed-in Supabase user and does not forward the user's bearer token to Lovense. Developer credentials remain server-side.
- [ ] Latest commit's CI must finish successfully; see the repository Actions workflow for the commit that adds the Daily After Hours shortcut.

### Newly confirmed gaps from the final repository pass

- [ ] No repository-level Content-Security-Policy is currently declared in `index.html` or a deployment header file. Before live Lovense, add a carefully tested CSP that allows the official SDK/API, the configured Supabase origin and required media sources without weakening the rest of the policy.
- [ ] Lovense developer platform approval, `LOVENSE_DEVELOPER_TOKEN`, `LOVENSE_PLATFORM_NAME`, exact allowed origins, Supabase Edge Function deployment and hardware tests are external prerequisites. Do not call the integration live before they pass.
- [ ] Daily ritual streak remains local-only; the mission completion endpoint can confirm the server mission, but there is no separate account-owned daily-ritual archive/streak table. Keep the UI's copy explicit and implement server persistence if cross-device streaks are desired.
- [ ] Club price cards are proposals only. Do not collect payment until paid content is delivered, the adult/BDSM product is approved in writing by the processor, and checkout, webhooks, subscription entitlements, cancellation, refunds, disputes and VAT disclosures are tested end to end.
- [ ] Real iPhone Safari/Android Chrome verification is still required for camera canvas recording, audio/video sync, orientation, capture interruption, storage/upload errors, and PWA shortcut behavior.

This update records repository evidence and blockers; it is not a production-readiness declaration.


### Follow-up implementation update — 12 October 2026, 21:xx CET

- [x] Added owner-scoped daily ritual history and idempotent completion RPC in `20261012130000_daily_ritual_history.sql`.
- [x] Daily After Hours now merges server history into its local fallback when the authenticated backend and migration are available. Day keys are UTC to match the server's period boundary.
- [x] Added a PWA Daily After Hours shortcut and moved Lovense from the home tile to Profile → Settings → Connected devices.
- [ ] Apply the daily history migration only after checking the configured Supabase project's migration history, then verify cross-device sync with two sessions.
- [ ] Latest CI for the daily history integration is queued/in progress; do not call this verified until the exact head SHA run is green.
