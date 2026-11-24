# AFTER HOURS — Complete Build Roadmap & Master Feature Checklist

**Status:** Approved product scope / implementation backlog  
**Updated:** 2026-10-13  
**Repository:** `melgabbana-ops/AfterHours`  
**Purpose:** Single implementation checklist for making the approved AFTER HOURS scope work end-to-end. A feature is not considered complete merely because it appears in the UI; it must be connected to persistence, permissions, safety rules, analytics where appropriate, tests, and release checks.

## Status key

- [ ] Not yet verified as implemented end-to-end
- [x] Verified in the current repository/database inspection or existing project documentation
- **Existing / partial** means some foundation exists, but the complete production behavior still needs verification.
- Never mark an item complete without code review, tests, and an observed result.

## 0. Verified starting point and known blockers

### Existing foundations observed
- [x] React 18 + TypeScript + Vite client; build and Vitest scripts in package.json.
- [x] Supabase JS client dependency.
- [x] Existing PWA/offline fallback, responsive/mobile foundations, 18+ gate, consent/safety state, three-round session, pause/reset/stop flow, profile/XP presentation and Control Room documented in README.
- [x] Backend schema currently includes `profiles`, `sessions`, `session_history`, `consent_records`, `experience_rounds`, `admin_audit_log`, `app_admins`, `mission_progress`, `xp_event_ledger`, and `session_mood_events`; RLS is enabled on these tables.
- [x] Supabase migrations include session consent guards/revocation, private media bucket, mission progress, private video capture, XP ledger and mood history.
- [x] GitHub history shows recent moodboard/design updates, seasonal icon collection, deployment/build-watch alerts, lazy loading and production bundle chunking.
- [x] Payments are intentionally absent from the client at present; README says not to enable sales before compliant provider, server-side checkout/webhooks and legal/business setup are ready.

### Immediate technical blockers / review items
- [ ] **P0 Security:** review all nine SECURITY DEFINER RPC warnings surfaced by Supabase Advisor on 2026-10-13. Confirm intended callers and enforce least privilege for `admin_dashboard_metrics`, `complete_mission`, `complete_session`, `get_mission_progress`, `get_session_mood_history`, `is_app_admin`, `record_session_mood`, `set_consent_state`, and `set_session_state`. Do not blindly revoke legitimate client RPCs; verify ownership checks, grants, behavior and tests function-by-function.
- [ ] **P0 Security/performance:** review RLS performance warnings, duplicate permissive SELECT policies on `experience_rounds`, and missing covering indexes for the two `admin_audit_log` foreign keys. Add migrations only after validating query plans and access semantics.
- [ ] **P0 Source-of-truth:** verify that the Lovable “Master build After Hours app”, GitHub `AfterHours` repository, deployed Vercel project and Supabase project are connected to the intended same release. Record canonical project/repo/branch/deployment IDs in internal setup documentation.
- [ ] Verify latest CI run and production build after recent design commits; record actual test counts and build/deployment SHA rather than relying on historical summaries.
- [ ] Confirm Supabase auth providers, email templates, redirect URLs, environment variables, storage policies, production domain and monitoring are configured. No secrets in client-side `VITE_*` variables other than publishable keys.
- [ ] Keep the production branch protected; implement and review work on feature branches/PRs. Do not merge/publish a broad feature bundle until all required CI, security and release checks pass.

## 1. Product foundation, navigation and design system

- [ ] Apply the official AFTER HOURS AH/crescent logo consistently: app shell, loading, login, favicon, PWA icons, social previews and admin.
- [ ] Implement the approved premium cinematic visual system: black, warm gold, deep purple; dark glass surfaces; subtle light, fog, particles, reflections; editorial serif headings and clean sans-serif UI.
- [ ] Establish shared tokens/components for spacing, typography, colors, cards, buttons, forms, modal, toast, navigation, empty/loading/error states and responsive breakpoints.
- [ ] Implement the approved motion system: living background, card reveals, rank/XP animation, cinematic transitions, audio waveforms and camera overlay; all effects must respect reduced-motion and battery/performance settings.
- [ ] Mobile-first iPhone/PWA; Android, tablet and desktop layouts; safe-area insets; one-handed use; touch targets >=48px; keyboard and screen-reader support.
- [ ] Dutch and English language support, with the existing English strings restored/maintained as specified; all content fields need translation fallback and missing-string tests.
- [ ] Discreet Mode / neutral screen, notification previews hidden by default where appropriate, quick exit, optional app icon variants where platform rules allow.
- [ ] Global sound, voice, haptics, animation, contrast, text-size and silent-mode settings.
- [ ] Verify offline shell and recovery states without treating offline/local state as authoritative for consent, session completion, XP, purchases or access control.

## 2. Identity, account and onboarding

- [ ] Production Supabase Auth: email/password, magic link, Google and Apple, with provider setup and redirect/recovery flows tested.
- [ ] Unique AFTER HOURS username/display name; uniqueness conflicts, rename rules, moderation and account recovery.
- [ ] Profile, avatar/Alter Ego, selected visual identity, privacy settings, language and accessibility preferences.
- [ ] Age gate for 18+; determine whether additional age assurance is required by applicable law, platform, payment provider or content model. Do not describe a self-declaration gate as verified age.
- [ ] Onboarding journey: Discover → Interests → Comfort/Boundaries → Personalize → First Experience → Reflect → Evolve.
- [ ] Data export, account deletion, profile reset and clear separation of account identity from optional sensitive preference data.

## 3. KINK DNA BUILDER — approved feature scope

### Supported profile choices
- [ ] Roles/interests include: Service sub; Tease / anticipation; Nog aan het ontdekken; Switch; Roleplay; Strenge taal; Praise / affirmation; Sensation play; Rope / bondage; Brat; Pet play; Slave / protocol.
- [ ] Interests include: Rituelen en protocol; Verhalen en fantasie; Raadsels en quizzen; Duidelijke opdrachten; Speelse uitdagingen; Visuele sfeer; Dagelijkse routines; Koppelscenario's; Persoonlijke reflectie; Stem en audio.
- [ ] Experience level “Geleidelijk ontdekken”; preferred format “Afwisselend”.
- [ ] Multi-selects, editable answers, “unknown/not sure”, “curious”, “maybe later”, “not for me”, and explicit per-topic boundaries.
- [ ] Separate interest, fantasy/story preference, real-world activity interest, context, experience level and consent. A role or kink preference is never consent.
- [ ] Optional context: solo vs partner, time available, energy/mood, voice/text/silent, intensity and preparation needs.

### Eight approved DNA expansions
- [ ] **THE LIVING DNA:** user-controlled evolving profile; show confirmed facts separately from tentative/unknown answers.
- [ ] **THE RIGHT-NOW PROFILE:** temporary mood, energy and time snapshot that does not silently overwrite the lasting profile.
- [ ] **THE DNA STORY MAP:** interactive links between roles, interests, stories, modes and personal routes.
- [ ] **THE WHY THIS EXPERIENCE ENGINE:** explain recommendations; accept explicit feedback; skipping alone is not a dislike signal.
- [ ] **THE DIFFERENCE BRIDGE:** partner comparison and neutral conversation prompts; no sharing without per-item permission.
- [ ] **THE DNA TIMELINE:** optional timeline of profile changes/insights; view, correct, export and delete.
- [ ] **THE EXPERIENCE PREVIEW:** theme, duration, preparation, choice points, categories and safety notes before start.
- [ ] **THE DNA LAB:** test combinations in a sandbox; only change the lasting profile after explicit confirmation.

## 4. Experience Engine and interactive content

- [ ] One modular content engine for stories, tasks, cards, timers, choices, audio, safety checks, aftercare and progression.
- [ ] Content metadata schema: slug/version/status, language, theme, role/interest tags, goal, experience level, intensity, duration, context, prerequisites, consent/safety checks, accessibility alternatives, aftercare and variations.
- [ ] Modes: Story, Random, Surprise, Custom and Boss, all with user-controlled limits and clear previews.
- [ ] Approved story chapters: The Arrival, The Test, The Control, The Challenge, The Boundary, The Night and After Hours.
- [ ] Approved experience families: THE SERVICE PROTOCOL; THE ANTICIPATION ENGINE; THE DUALITY PATH; THE ROLEPLAY CHRONICLES; THE WORDS OF AUTHORITY; THE SENSORY QUEST; THE BOUNDARY LAB; THE PROVOCATION GAME; THE INSTINCT PATH; THE COURT OF RULES.
- [ ] Example “THE FIRST PROTOCOL” (about 5–10 minutes) as a beginner-friendly, gradual, editable experience.
- [ ] Large curated library of 100+ non-explicit, consent-aware prompts/tasks across approved categories; review for quality, duplicate content, language and safety.
- [ ] Branching choices, repeat/resume, favorites, bookmarks, personal notes and session recap.
- [ ] Pause/pass/stop must always be available; no penalty for passing/stopping; pausing or being overwhelmed must not force progression.
- [ ] Keep all content within platform, legal, safety and consent requirements; separate fictional scenarios from real-world instructions.

## 5. New narrative and game features (approved)

- [ ] **THE UNLOCKABLE NARRATIVE:** multi-session chapters, characters, clues and resume support; no missed-day penalty.
- [ ] **THE MIDNIGHT MYSTERIES:** puzzles, riddles, clues, hidden symbols, branching discoveries and accessible alternatives.
- [ ] **THE EXPERIENCE BLUEPRINT:** create a custom experience from story, duration, atmosphere, choices and allowed categories; preview, validate and save privately.
- [ ] Blueprint templates, version history, duplicate/edit, test mode, publish review and withdrawal workflow.
- [ ] Experience engine supports all content as modular, versioned components rather than hard-coded separate game screens.

## 6. Virtual Domme and AI experiences

- [ ] **THE VIRTUAL DOMME:** clearly labelled AI persona, configurable style, tone and role; no claims of being human.
- [ ] **AI DOMME CHAT:** user-controlled chat with explicit memory controls, edit/delete/pause memory and transparent use of stored information.
- [ ] **VOICE OF AUTHORITY / THE VOICE LIBRARY:** voice options, pace, volume, text transcript, silent mode and accessible controls.
- [ ] **ANIMATED DOMME AVATAR:** start with lightweight animation; advanced 3D only after performance/accessibility validation.
- [ ] **THE DOMME EXPERIENCE DIRECTOR:** guide narrative, choices, timers, Tarot and aftercare while the user remains in control.
- [ ] Safety and consent override roleplay at all times; AI must never interpret silence as consent, autonomously control physical devices, or perform irreversible actions.
- [ ] Define AI provider, data processing terms, cost limits, retention, moderation, rate limits, failure/fallback behavior and abuse monitoring before launch.
- [ ] If AI generation is unavailable or too costly, provide deterministic curated recommendations and pre-authored dialogue as a reliable fallback.

## 7. Tarot, astrology, daily content and discovery

- [ ] Kinky Tarot and Kinky Oracle with card meanings, reveal animations, saved readings and disclaimers that this is entertainment/reflection, not professional advice.
- [ ] Astrology/horoscope/insights: user-entered or optional birth details; timezone handling; minimal data collection; delete/export; no sensitive inference presented as fact.
- [ ] DAILY AFTER HOURS, THE SECRET MISSIVE and opt-in daily/weekly prompts.
- [ ] THE PERSONAL SEASON and SEASONAL WORLDS, with seasonal/holiday themes and configurable release dates.
- [ ] THEMES & SEASONS, mood-based experiences, personal milestones and optional 7 Nights Challenge; no guilt, streak punishment or progress loss.
- [ ] THE EXPERIENCE PREVIEW and recommendation reasons displayed before starting.
- [ ] Content freshness plan and admin scheduling; no notification without opt-in.

## 8. Profile, progression and collections

- [ ] Implement approved rank ladder: THE CURIOUS (0), THE INITIATE (250), THE DEVOTED (600), THE DISCIPLINED (1200), THE ENTHRALLED (2000), THE BOUND (3500), AFTER HOURS (5000).
- [ ] Reconcile this approved ladder with any existing 15-rank/200-XP-per-level implementation before changing progression; one canonical progression configuration must be selected and documented.
- [ ] XP awarded only through trusted server-side events and idempotent ledger entries; never from client-supplied XP totals.
- [ ] Achievements, badges, personal milestones, rank emblems, unlock conditions, reward vault and animated progression.
- [ ] **THE PERSONA WARDROBE:** titles, emblems, avatar styles, frames and cosmetic themes; unlock rules and purchase boundaries documented.
- [ ] **THE PRIVATE COLLECTION:** favorites, saved stories, personal rituals, collectibles and filters, private by default.
- [ ] **THE MIDNIGHT VAULT:** unlocked illustrations, emblems, stories, soundscapes and collectibles with asset rights and storage rules.
- [ ] **THE DESIRE CONSTELLATION:** private, editable visualization of interests/preferences, with no inference treated as confirmed truth.
- [ ] **THE NIGHT RECAP:** optional session summary and reflection, controlled by the user.

## 9. Couple features and communication

- [ ] **THE DIFFERENCE BRIDGE** and existing **COMPATIBILITY COMPASS**: compare only items both partners deliberately share.
- [ ] **THE DUO JOURNEY / DYNAMIC DUO:** optional shared routes, milestones, check-ins and shared content.
- [ ] **THE PRIVATE SIGNAL:** optional status/message such as curious, maybe later, not now or let's discuss; silence is not consent.
- [ ] **THE CONSENT PASSPORT:** private, editable preferences, agreements and signals; explicitly not a certification or guarantee of consent.
- [ ] **THE AGREEMENT ROOM / PARTNER CHECK-IN:** discussion guides and separate explicit confirmation for each shared agreement.
- [ ] **THE GIFT VAULT:** optional digital theme/cosmetic gifting, only after secure purchase, refund and abuse controls exist.
- [ ] Invite/revoke partner access, preview exactly what is shared, and provide immediate unlinking and data removal.

## 10. Audio, visuals and camera

- [ ] **THE VOICE LIBRARY**, Ambient Mode, soundscapes, music phases, optional SFX and haptics.
- [ ] Music rights/provider review. Spotify integration only if its current developer terms and commercial-use limits permit the exact use case; otherwise use original/licensed audio or user-owned playback without implying a commercial streaming licence.
- [ ] **SENSORY SYNC:** synchronize optional animations, light effects, audio and haptics to experience events; respect reduced motion, silent mode, battery and device limits.
- [ ] **LIVING BACKGROUND**, interactive card reveals, cinematic intros and transitions, audio waveforms and rank/reward animations.
- [ ] **AFTER HOURS CAMERA OVERLAY:** CLEAN / AFTER HOURS / CINEMATIC modes, branded frame, optional effects and visible recording/privacy indicators.
- [ ] Private media vault and uploads: private storage, signed short-lived URLs, upload validation, size/type limits, deletion, retention, access audit and no public buckets.
- [ ] Media consent and release workflow; avoid automatic upload/sharing; verify browser camera/microphone permissions and iOS PWA limitations.
- [ ] Seasonal iOS/Android/PWA icons and holiday variations; follow platform-specific icon and distribution requirements.

## 11. Safety, consent, aftercare and privacy

- [ ] 18+ gate and appropriate age assurance review.
- [ ] Explicit consent flow before sessions; consent may be revoked at any time.
- [ ] PAUSE / PASS / STOP always visible and keyboard/screen-reader accessible.
- [ ] Safeword/safe-signal configuration, check-ins, mood before/during/after, emergency exit and aftercare options.
- [ ] Aftercare options include “Rustig landen”, “Kort napraten”, “Ruimte & water”; aftercare choice must not block completion or earned XP.
- [ ] **THE AFTERCARE BLUEPRINT:** personalized, optional post-session choices; never diagnose or replace professional support.
- [ ] **AFTERCARE MODE:** quiet/silent mode, grounding content, next-step choices and optional check-in.
- [ ] Private notes, mood history and preference data remain user-controlled; retention and deletion are explicit.
- [ ] No advertising targeting based on kink, sexuality, relationship, mood or other sensitive profile data.
- [ ] Privacy mode, discreet notifications, memory control panel, export/delete flows and clear data-use explanations.
- [ ] Review GDPR/ePrivacy, consumer, online platform, age assurance and app distribution obligations with qualified counsel before launch.

## 12. Admin Control Room and content operations

- [ ] Admin access through server-verified role/claims; never trust a hidden client route or localStorage flag.
- [ ] Modules: Overview, Commands, Users, Sessions, Media, Music, Payments, Products, Ranks, Achievements, Settings, Test Mode, Analytics, Help/Support, Changelog and Notifications.
- [ ] **KINK CONTENT STUDIO:** create/edit/test/publish questions, tasks, stories, quizzes and decks; tag roles/interests, experience level, mode, safety prerequisites and disallowed combinations.
- [ ] Content states: concept → review → approved → published → withdrawn; immutable published versions and rollback.
- [ ] Content moderation, duplicate detection, translations, rights/attribution, version history and preview.
- [ ] Maintenance/update controls, opt-in in-app/push announcements, status page and release notes.
- [ ] Admin audit log for privileged actions; restrict access to sensitive user content and log every permitted access.
- [ ] Analytics should be privacy-minimizing and aggregated; never expose private kink data to general admin dashboards without a justified, authorized need.

## 13. Monetization and business readiness

- [ ] Keep checkout disabled until legal/business readiness, merchant approval, provider credentials, refunds, taxes, webhook verification and security review are complete.
- [ ] Existing project direction: provider abstraction **VEROTEL / SEGPAY / DISABLED**; do not claim either provider is active until verified.
- [ ] Remove Tikkie and do not use personal Revolut as a production checkout.
- [ ] Resolve price conflict before configuring the store: earlier specification €59.99 for three games versus later discussion €75 for three games. Keep pricing as a pending business decision, not a hard-coded assumption.
- [ ] Free/premium tiers, experience packs, cosmetic items, Couples Mode and Creator Market need entitlements, receipt/order history, refund handling, abuse prevention and cancellation UX.
- [ ] **THE CREATOR MARKET:** official content first; third-party creators only after moderation, intellectual-property rights, payout, tax, reporting and payment-provider review.
- [ ] No paid unlock may bypass age checks, safety controls, privacy settings or consent requirements.
- [ ] Spotify/music and third-party creator rights are separate licensing workstreams, not assumed included in a payment provider agreement.

## 14. Support, legal and community

- [ ] Help Center / Support, troubleshooting, contact and report-content flows.
- [ ] Legal pages: Terms, Privacy, Refund, Consent Policy, Content Rules, Content Removal/Complaints and relevant cookie/tracking disclosures.
- [ ] **THE INNER CIRCLE:** optional moderated community only after moderation staffing, reporting/blocking, age controls, privacy, retention and abuse response are designed.
- [ ] **THE KINK ACADEMY:** reviewed educational content with source/author metadata and clear boundaries between education and professional advice.
- [ ] Social links: Instagram https://www.instagram.com/enter_afterhours/; verify any other brand/social links before publishing.
- [ ] Community, creator and user-generated content must have reporting, removal, appeals, rate limits and a clear moderation process.

## 15. Notifications, PWA and integrations

- [ ] In-app inbox, opt-in push notifications, notification preferences, read/unread state and deep links.
- [ ] No unsolicited or sensitive lock-screen content by default; discreet preview setting.
- [ ] Push requires platform permission, service worker/provider configuration and explicit opt-in; provide in-app fallback.
- [ ] PWA install prompts, offline shell, network recovery, update detection, cache versioning and stale-session handling.
- [ ] WhatsApp integration only if the exact approved use case and applicable platform/business policies permit it; no assumption that private automation is allowed.
- [ ] Google/Apple auth, media storage, voice/AI and payment integrations documented with owner, credentials, costs, terms and fallback.
- [ ] Deployment alerts/build watch must report actual build/deployment status and link to logs; do not imply background push from ChatGPT itself.

## 16. Data model and backend work

- [ ] Create reviewed migrations for missing entities; reuse existing tables where appropriate rather than duplicating data.
- [ ] Candidate domain tables (names are proposals, not migrations yet): kink_dna_profiles, kink_dna_answers, kink_dna_boundaries, right_now_checkins, recommendation_feedback, story_routes, story_progress, experience_blueprints, blueprint_versions, collections, collection_items, cosmetics_inventory, voice_preferences, mystery_progress, season_content, partner_links, sharing_grants, consent_agreements, content_versions, purchases/orders/entitlements (only when monetization is approved).
- [ ] Define ownership, primary/foreign keys, unique constraints, retention, indexes, deletion behavior and data classification for every table.
- [ ] RLS tests for every table: own-user read/write, unauthorized cross-user denial, partner share-grant scope, admin least privilege, anon denial and deleted-account behavior.
- [ ] Server-side functions/RPCs for consent changes, session completion, XP ledger, entitlements and sensitive transitions; idempotency and ownership validation.
- [ ] Signed private media URLs and bucket policies; no public exposure of user media.
- [ ] Generate/update TypeScript database types after migrations; keep domain contracts typed.
- [ ] Avoid storing authoritative data only in localStorage; offline state is a UI cache, not proof of consent or purchase.

## 17. Testing and acceptance criteria

- [ ] Unit tests for profile state, preference taxonomy, recommendation explanations, ranking, XP ledger, blueprint validation, story progression and time/mood handling.
- [ ] Integration tests for Auth, RLS, RPC grants, session lifecycle, consent revocation, XP idempotency, media access and account deletion.
- [ ] End-to-end tests for onboarding, KINK DNA, Right-Now Profile, recommendation → preview → session → aftercare → recap, story resume, mystery completion, wardrobe unlock, collection, couple share/revoke and admin publishing.
- [ ] Security tests: cross-account isolation, direct RPC calls, unauthorized admin calls, signed URL expiry, injection/XSS, upload abuse, rate limits and secret scanning.
- [ ] Accessibility: reduced motion, keyboard, screen reader, focus order, contrast, text scaling, touch targets, audio transcript and silent operation.
- [ ] Device QA: current iPhone Safari/PWA, Android Chrome/PWA, iPad/tablet and desktop; camera/microphone, audio resume, safe areas and install/update flows.
- [ ] Performance: lazy loading, bundle budgets, image/audio optimization, low-memory and slow-network testing.
- [ ] Localization and content QA in Dutch and English; no untranslated or broken UI states.
- [ ] Payment sandbox tests only after a provider is selected; webhook signature, duplicate webhook/idempotency, refunds and failed payments.
- [ ] CI must run typecheck/build/tests; no merge if any required check fails.
- [ ] Release smoke test on staging and production; rollback plan and verified backup/restore procedure.

## 18. Release gates and suggested order

### Gate A — Stabilize the existing app
- [ ] Confirm canonical source, branch, Lovable sync, Vercel project and Supabase project.
- [ ] Fix/review security advisor warnings and verify existing auth/session/consent/XP flows.
- [ ] Ensure CI, deployment and rollback are reliable.
- [ ] Verify the approved logo, design system and responsive shell.

### Gate B — Data and profile foundation
- [ ] Finalize schema and privacy/retention decisions.
- [ ] Implement KINK DNA BUILDER, boundaries, Right-Now Profile and data controls.
- [ ] Implement consent-safe recommendation metadata and feedback.
- [ ] Complete RLS and data lifecycle tests.

### Gate C — Content and core experiences
- [ ] Experience Engine, KINK CONTENT STUDIO, story modes, experience preview, first protocol, Midnight Mysteries and Blueprint.
- [ ] Integrate Virtual Domme with curated fallback and memory controls.
- [ ] Add Tarot, Oracle, astrology and daily content.

### Gate D — Retention and personalization
- [ ] Living DNA, DNA Story Map, Why This Experience, Timeline, DNA Lab.
- [ ] Ranks/achievements reconciliation, Persona Wardrobe, Private Collection, Midnight Vault.
- [ ] Voice Library, Ambient/Sensory Sync and seasonal content.

### Gate E — Couples and community
- [ ] Difference Bridge, Compatibility Compass, Duo Journey, Private Signal and consent-based sharing.
- [ ] Community/Creator Market only after moderation, rights and operational support are ready.

### Gate F — Monetization and launch
- [ ] Resolve pricing, business/legal readiness and payment provider.
- [ ] Complete privacy/legal review, device QA, load/performance tests and accessibility review.
- [ ] Production monitoring, incident response, backup/restore, support workflows and launch checklist.
- [ ] Deploy only after every release gate has an owner and a verified pass result.

## 19. Definition of Done for every feature

A feature is complete only when:
1. It has an agreed user flow and design state (loading, empty, success, error and offline where applicable).
2. Its data model, permissions, privacy and retention are documented.
3. It works for signed-in users and correctly handles signed-out/unauthorized states.
4. Safety and consent rules are enforced server-side where relevant.
5. Unit/integration/e2e tests cover expected and abuse/error paths.
6. It works on mobile and desktop and passes accessibility checks.
7. Admin/content operations and localization are ready if the feature needs them.
8. It passes CI, staging smoke tests and production verification.
9. Documentation and changelog are updated.
10. It is marked “live” only after a real deployment is verified; otherwise label it planned, in progress or tested in staging.

## 20. Decisions still open — do not silently assume

- [ ] Canonical progression: approved seven-rank thresholds vs any existing 15-rank/200 XP level implementation.
- [ ] Pricing: €59.99 vs €75 for three games.
- [ ] Payment provider: Verotel, Segpay or disabled until business readiness.
- [ ] Exact AI/voice providers, costs, processing terms and data retention.
- [ ] Exact music/Spotify use case and licence.
- [ ] Age-assurance level and jurisdiction-specific legal requirements.
- [ ] Creator Market/community launch criteria and moderation owner.
- [ ] Which features are launch blockers versus later releases; no weakening of safety/privacy gates for speed.

**Operational rule:** This document records approved scope and implementation work. It does not claim every listed feature is already built. Update checkboxes only with evidence from code, tests, migrations, security review and deployed behavior.


## 21. EXPANDED GAME TASK LIBRARY — new requirement

**Goal:** Add a large, reusable, searchable and versioned task library to every relevant game mode. The library must support both non-explicit tasks and a separately controlled adult-content category. This is a content-production and implementation requirement, not a claim that the tasks are already live.

### 21.1 Content inventory and targets
- [ ] Create a launch seed library of at least **300 reviewed task cards**, then grow towards **500+** as editorial capacity permits.
- [ ] Minimum initial distribution target:
  - 80 non-explicit discovery, reflection and preference-building tasks.
  - 60 protocol, service, ritual and routine tasks.
  - 50 tease/anticipation, puzzle, riddle and branching-story tasks.
  - 40 roleplay, character and fictional-scenario tasks.
  - 30 praise, affirmation, confidence and communication tasks.
  - 20 sensory atmosphere, sound, visual and imagination tasks.
  - 20 partner/couple discussion and agreement tasks.
  - 20 safety, preparation, check-in and aftercare tasks.
  - 20 adult-only explicit-category records, subject to the platform/provider policy review, legal review, age assurance, consent metadata and human approval. Do not generate or publish this category automatically before those gates pass.
- [ ] Avoid duplicate cards that merely change a few words. Each task needs a distinct purpose, choice, outcome or story beat.
- [ ] Maintain both Dutch and English versions; translation must preserve meaning, boundaries, tone and safety instructions.
- [ ] Use short cards for random mode and longer multi-step task chains for story/challenge modes.
- [ ] Provide beginner, gradual, intermediate and experienced variations without treating experience as proof of consent.

### 21.2 Task-card schema
Each card must have:
- [ ] Stable ID, slug, version, title, short preview and complete task text.
- [ ] Dutch and English content, content category, game/mode compatibility and optional story/chapter links.
- [ ] KINK DNA tags: Service sub, Tease / anticipation, Nog aan het ontdekken, Switch, Roleplay, Strenge taal, Praise / affirmation, Sensation play, Rope / bondage, Brat, Pet play, Slave / protocol.
- [ ] Interest tags: Rituelen en protocol, Verhalen en fantasie, Raadsels en quizzen, Duidelijke opdrachten, Speelse uitdagingen, Visuele sfeer, Dagelijkse routines, Koppelscenario's, Persoonlijke reflectie, Stem en audio.
- [ ] Content classification: non-explicit, adult-themed/non-graphic, or explicit adult category; the last category remains unpublished until policy and legal approval.
- [ ] Recommended experience level, suggested duration, intensity, solo/partner context, preparation needs and accessibility alternatives.
- [ ] Required equipment/setting if any, with safe alternatives and a “no equipment” version where possible.
- [ ] Consent/boundary prerequisites, check-in points, stop/pause behavior, contraindication flags for unsafe combinations and optional aftercare.
- [ ] Whether the card is fictional/roleplay, a reflection prompt, a communication task or a real-world activity.
- [ ] Author/reviewer, source/rights if applicable, created/updated dates, moderation notes and publication status.
- [ ] Optional rewards, XP value and idempotent award event; no reward for ignoring a boundary or continuing after stop.
- [ ] Duplicate-detection fingerprint, tags for search and recommendation, feedback counters and retirement reason.
- [ ] Never infer a user's permission from their role, prior session, purchase, relationship status, saved preference or previous completion.

### 21.3 Editorial categories and example non-explicit task prompts
These are seed examples to be turned into complete cards, reviewed and localized. They are non-explicit, optional and adaptable.

**Discovery and KINK DNA**
1. Choose one role or interest that feels familiar and one that remains a question mark.
2. Mark three themes as “curious”, “not now” or “not for me”.
3. Describe the difference between enjoying a fantasy in a story and wanting it in real life.
4. Pick a preferred pace: slow reveal, clear steps or alternating formats.
5. Choose a topic you want the app to leave out of recommendations.
6. Save one boundary and one thing you would like to explore through fiction only.
7. Rate today's energy as low, medium or high, then choose a matching experience.
8. Write one sentence that would make an experience feel respectful and welcoming.
9. Preview a suggested card and choose accept, edit or replace before it starts.
10. Revisit one profile answer and decide whether it still fits today.

**Protocol, service and rituals**
11. Design a two-minute start ritual using only safe, everyday actions.
12. Choose a personal phrase that signals “ready to begin” and a separate phrase that means “pause”.
13. Put three steps in an order that feels calm and achievable.
14. Create a short end-of-session ritual that helps you transition back to ordinary life.
15. Pick a small everyday habit and define a realistic reminder for it.
16. Build a fictional protocol card with a title, purpose and opt-out.
17. Choose which instructions should always be written rather than spoken.
18. Decide what a respectful correction sounds like for you.
19. Create a checklist with one preparation step, one check-in and one closing step.
20. Remove one ritual step that feels unnecessary or uncomfortable.

**Anticipation, riddles and mystery**
21. Solve a short three-clue riddle to reveal the next story choice.
22. Choose between a direct reveal and a gradual reveal.
23. Find a hidden symbol in the scene description and use it to unlock a harmless story branch.
24. Pick one of three sealed story cards, with a preview of category and intensity shown first.
25. Build a sequence from clue, choice and reveal.
26. Choose whether the next clue should be visual, written or audio-based.
27. Pause the story and predict which of two fictional characters will make the next decision.
28. Choose a surprise only from categories already approved in your profile.
29. Solve a word puzzle that reveals a new emblem or piece of lore.
30. Ask the virtual character one question before continuing the scene.

**Roleplay and fictional worlds**
31. Choose a character role and a scene setting from the approved story library.
32. Write one line of dialogue for your character, or choose a suggested line.
33. Decide which character sets the pace of the fictional scene.
34. Select a story branch that emphasizes mystery, warmth, discipline or humor.
35. Create a fictional title and emblem for your alter ego.
36. Choose whether the scene should be dialogue-led, puzzle-led or atmosphere-led.
37. Change one detail in the setting and see how the story adapts.
38. Pick a role reversal in a fictional scene, with a clear exit back to neutral mode.
39. Choose a fictional challenge that can be completed through a decision rather than a physical action.
40. End the chapter by selecting what your character learned.

**Praise, affirmation and confidence**
41. Choose a praise style: gentle, direct, playful or formal.
42. Write one sentence acknowledging something you handled well today.
43. Choose an affirmation that feels authentic, then edit any wording that does not.
44. Select a confidence challenge that can be skipped without explanation.
45. Choose whether feedback should be private, spoken, displayed as text or omitted.
46. Save a phrase that feels supportive and remove any phrase that feels patronizing.
47. Complete the sentence: “I felt respected when…”
48. Choose one small achievement to record in your private collection.
49. Ask the virtual character to reflect your chosen strengths without making assumptions.
50. Finish with a neutral check-in: continue, change direction or stop.

**Sensory atmosphere and imagination**
51. Choose a visual atmosphere: candlelit library, velvet theatre, moonlit garden or abstract gold-and-purple space.
52. Pick ambient sound, voice, silent text or no audio.
53. Choose a breathing-free grounding option such as noticing five visible details in the room.
54. Select a story texture: elegant, mysterious, playful or minimal.
55. Choose whether transitions should be subtle or cinematic.
56. Adjust the pace and brightness before starting.
57. Build a personal soundscape from licensed/original sounds.
58. Choose an accessible text description instead of a visual-only clue.
59. Rate the atmosphere and save or dismiss it.
60. Turn off effects instantly and continue in a clean, neutral interface.

**Couple communication and agreements**
61. Each partner privately chooses one topic they are willing to discuss; only share after reviewing the exact item.
62. Pick a neutral opening question for a boundary conversation.
63. Mark a proposed activity as “yes to discuss”, “not now” or “no”.
64. Compare preferred pacing without showing private answers automatically.
65. Agree on a check-in phrase and a separate stop signal.
66. Choose what information must never be shared with the other account.
67. Complete a short post-experience conversation prompt, or skip it.
68. Review an agreement and explicitly renew, edit or withdraw it.
69. Practice responding respectfully to “no” in a fictional dialogue.
70. Unlink partner access and confirm that shared visibility has ended.

**Safety, preparation and aftercare**
71. Check whether the current setting feels private enough; choose a fictional alternative if not.
72. Confirm available time and select a shorter version if needed.
73. Review the card's category, duration and intensity before opting in.
74. Choose PAUSE, PASS and STOP controls and test where they are on screen.
75. Pick an aftercare option before the experience, with no obligation to use it.
76. Set an optional check-in reminder that can be cancelled.
77. Choose a no-equipment, no-camera and silent alternative.
78. Review which information will be saved to history before starting.
79. Finish with “how am I feeling?” and choose a private answer or skip.
80. Delete the session recap or keep it private in the archive.

### 21.4 Adult-themed and explicit-category handling
- [ ] Create a separate content classification and publication gate; do not mix explicit-category cards into random/surprise pools unless the user explicitly opted in and the card passes all applicable policy and legal checks.
- [ ] The app must not equate “explicit” with “unbounded”: every card needs a preview, user-controlled limits, consent prerequisites, PAUSE/PASS/STOP and aftercare where appropriate.
- [ ] Distinguish non-explicit kink themes, adult-themed but non-graphic writing and explicit sexual content. The OpenAI API policy and any chosen provider policy must be checked for the exact generation and distribution use case before using that provider for adult content. If the policy does not permit a content type, do not generate it with that provider; use approved human-authored content or another lawful, policy-compliant workflow.
- [ ] Do not generate instructions that encourage non-consensual acts, coercion, incapacitation, injury, dangerous restraint, deprivation of safety controls or disregard of a stop signal.
- [ ] For rope/bondage/sensation interests, default to non-instructional discussion, preparation, communication and fictional narrative until qualified safety review approves any practical material. Do not offer dangerous physical restraint, breath restriction or injury-risk instructions.
- [ ] Human review is mandatory before publishing sensitive/adult-category content; keep reviewer decisions, version history and a fast withdrawal mechanism.
- [ ] Do not use sensitive preference data to target advertising or to infer consent.
- [ ] Require robust age-access controls appropriate to applicable law and platform/provider requirements; do not represent a checkbox as verified age.
- [ ] Provide reporting, blocklists, exclusion settings and “never recommend this category” controls.

### 21.5 Content Studio and content generation pipeline
- [ ] Add bulk import/export (CSV/JSON for editorial workflows), schema validation, preview, tag editor, translation status and duplicate detection.
- [ ] Workflow: draft → automated schema/safety checks → human review → approved → scheduled/published → monitored → revised/withdrawn.
- [ ] AI may draft only categories permitted by the configured provider policy. Treat model output as untrusted draft material, never as auto-approved production content.
- [ ] Add content-generation settings for language, tone, category, tags, length, beginner/experienced variation, mode, diversity and excluded topics.
- [ ] Use a deterministic template fallback if AI is unavailable. Generation failure must not break gameplay or create unsafe improvised instructions.
- [ ] Maintain a seeded, human-reviewed library so core games do not require a live model call to function.
- [ ] Rate-limit generation, set budget caps, redact sensitive profile data from prompts when not needed, and log metadata rather than private user text wherever possible.
- [ ] Add regression tests for unsafe combinations, consent language, stop-control visibility, age gating, translations and publication permissions.
- [ ] Track content coverage by role/interest and identify empty combinations without inventing user preferences.
- [ ] Admin can retire or replace a card without breaking historical session references; completed sessions retain a safe snapshot of the card version shown to the user.

### 21.6 Task Library acceptance criteria
- [ ] Seed library meets the agreed minimum count with no duplicate filler cards.
- [ ] Every card has classification, language, tags, experience level, preview, duration and safety metadata.
- [ ] Random/Surprise never selects excluded or unapproved content.
- [ ] KINK DNA recommendations explain why a card was suggested and honor “not for me”, “not now” and per-topic boundaries.
- [ ] User can skip, edit, replace, pause or stop without penalty.
- [ ] Content is private where appropriate, partner sharing is opt-in, and deletion/export works.
- [ ] Human approval, rollback and withdrawal are tested.
- [ ] CI validates schemas, translations, duplicate IDs, missing safety metadata and unauthorized publication.
- [ ] Explicit-category publication remains disabled until provider policy, legal review, age controls and human review are complete.

