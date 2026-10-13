# AFTER HOURS — MASTER BUILD SPECIFICATION & HANDOFF
**Version:** 1.0  
**Date:** 2026-10-13  
**Repository:** https://github.com/melgabbana-ops/AfterHours  
**Roadmap:** docs/MASTER_BUILD_ROADMAP.md  
**Working branch:** docs/complete-build-roadmap  
**Purpose:** This is the portable build brief to paste into a new ChatGPT/build chat. It describes approved product scope and implementation expectations. It is NOT proof that all features are implemented.

---

# COPY THIS BRIEF INTO THE NEXT BUILD CHAT

You are the technical lead and implementation agent for the existing AFTER HOURS app. Continue the existing project; do not start from scratch. Inspect the live repository, Lovable project, Supabase project, Vercel project, current branch, recent commits, CI, database migrations and deployed status before making changes. Use the connected tools available in that chat. Work in small reviewable branches/PRs, run tests, report exact evidence, and never claim a feature is built, deployed, secure or working without verification.

## A. Operating rules
1. Treat this document and `docs/MASTER_BUILD_ROADMAP.md` as the approved product backlog.
2. Preserve existing working features and data. Prefer incremental migrations and additive changes.
3. First inspect current code and architecture. Identify what exists, what is partial, what is missing, what is broken, and what is deployed. Do not infer implementation from a UI mockup or commit message alone.
4. Prioritize security issues and broken foundations before adding large feature sets.
5. Make reasonable implementation decisions without asking for approval on every routine technical detail. Ask only for genuinely blocking business decisions or irreversible actions.
6. Do not expose secrets, tokens, API keys, private user data or sensitive kink profile information in logs, source code, prompts, analytics or reports.
7. Never place private API keys in browser code, `VITE_*` variables or Git. Use server-side secrets/edge functions.
8. Do not use live payment processing until a provider, legal/business readiness, checkout, signed webhooks, refunds, tax handling and merchant configuration are verified. No Tikkie or personal Revolut checkout.
9. AI-generated content is a draft until checked against the chosen provider policy, schema and editorial safety rules. Never auto-publish sensitive content.
10. “Done” means code, data migration, authorization, tests, mobile/accessibility, documentation and verified deployment where applicable. Label items Planned / In progress / Tested in staging / Live.
11. Never promise background work or push updates unless a configured service actually performs them. Report progress only when work has actually occurred.
12. Follow current platform and provider policies for all content. If a content category is not permitted by a provider, do not generate it with that provider.

## B. Product vision and design
- Product: AFTER HOURS, an 18+ premium, mobile-first interactive experience platform with consensual kink/BDSM themes, story games, discovery, audio, a virtual AI Domme, personalization and optional couple experiences.
- Brand line: “YOUR RULES. YOUR LIMITS. YOUR EXPERIENCE.”
- Visual identity: official AH monogram/crescent logo; cinematic black, warm gold and deep purple; subtle glass surfaces, refined borders, soft light and atmospheric motion; elegant serif headings with clean sans-serif UI. No generic SaaS look.
- Platforms: iPhone-first responsive PWA, Android, tablet and desktop. Respect safe areas, one-handed use, accessible touch targets, keyboard/screen readers, contrast, text scaling and reduced motion.
- Motion/sound/haptics are optional, performance-aware and never block PAUSE/PASS/STOP.
- English and Dutch content/UI with localization coverage checks. Preserve the intended English strings already selected in the project.
- Discreet Mode: neutral view, privacy-aware notification previews, fast return to safety/neutral screen. Do not promise platform-level app icon hiding where unsupported.
- Official logo assets must be reused consistently in app shell, login, splash/loading, favicon, PWA icons, camera overlays and admin.

## C. Existing architecture and starting point to verify
Current repository is `melgabbana-ops/AfterHours`, React 18 + TypeScript + Vite, Supabase JS, Vitest, with existing PWA/offline fallback, profile/session state, age gate, consent state, three-round session, pause/stop, XP/history UI, Control Room, private media foundations and recent design/build-watch commits. The project has Supabase tables including `profiles`, `sessions`, `session_history`, `consent_records`, `experience_rounds`, `admin_audit_log`, `app_admins`, `mission_progress`, `xp_event_ledger` and `session_mood_events`. Verify this against current code/migrations before relying on it.
- Current local state in `src/storage.ts` is a UI cache, not an authoritative backend.
- Verify Lovable, GitHub, Vercel and Supabase are connected to the same intended project/release.
- Inspect latest CI/build/deployment SHA and production status.
- Security review is a P0: Supabase Advisor reported nine SECURITY DEFINER RPC warnings for `admin_dashboard_metrics`, `complete_mission`, `complete_session`, `get_mission_progress`, `get_session_mood_history`, `is_app_admin`, `record_session_mood`, `set_consent_state` and `set_session_state`. Review each function's owner, search_path, grants, caller, auth/ownership validation and tests. Do not blindly revoke required access.
- Also review duplicate permissive SELECT policies on `experience_rounds`, RLS performance warnings and missing indexes on the two `admin_audit_log` foreign keys.
- Existing draft PR #15 is https://github.com/melgabbana-ops/AfterHours/pull/15. It is documentation-only, open as draft, not merged. Review current status rather than assuming it remains unchanged.

## D. Build order (follow in sequence)

### Phase 0 — Verify and stabilize
- Inventory source, app routes, feature flags, current UI, database schema/migrations, storage buckets, auth providers, secrets/config, CI, Vercel deployments and Lovable sync.
- Create a feature-status matrix with evidence and links to code/tests.
- Fix or document P0 security findings, confirm RLS and RPC grants, check production build and tests.
- Confirm rollback, backups and staging/production separation.
- Do not perform destructive database changes without backup and migration plan.

### Phase 1 — Shared app foundation
- Design tokens/components, responsive shell, official logo, navigation, error/loading/empty states, Dutch/English localization, motion/audio/accessibility settings.
- Authentication: email/password, magic link, Google and Apple if configured; unique AFTER HOURS username, recovery, session expiration, account deletion.
- Age gate and legal age assurance review. A checkbox is not proof of age.
- Central preferences, privacy settings, data export/deletion and consent-management UI.

### Phase 2 — KINK DNA BUILDER and privacy-safe data model
Roles:
- Service sub
- Tease / anticipation
- Nog aan het ontdekken
- Switch
- Roleplay
- Strenge taal
- Praise / affirmation
- Sensation play
- Rope / bondage
- Brat
- Pet play
- Slave / protocol

Interests:
- Rituelen en protocol
- Verhalen en fantasie
- Raadsels en quizzen
- Duidelijke opdrachten
- Speelse uitdagingen
- Visuele sfeer
- Dagelijkse routines
- Koppelscenario's
- Persoonlijke reflectie
- Stem en audio

Default profile examples: experience level “Geleidelijk ontdekken”; preferred format “Afwisselend”. Answers must be editable and allow unknown, curious, maybe later, not for me, and per-topic boundaries. Distinguish fantasy, interest, real-world activity preference, context and current consent. A role or kink is never consent.

Build these approved extensions:
1. THE LIVING DNA: user-controlled evolving profile; distinguish confirmed vs tentative.
2. THE RIGHT-NOW PROFILE: temporary mood, energy and time; does not overwrite lasting DNA.
3. THE DNA STORY MAP: interactive graph of roles/interests/stories/routes.
4. THE WHY THIS EXPERIENCE ENGINE: explain recommendations; skipping alone is not dislike.
5. THE DIFFERENCE BRIDGE: partner conversation/compatibility, only using items each person deliberately shares.
6. THE DNA TIMELINE: optional history with view/edit/export/delete.
7. THE EXPERIENCE PREVIEW: theme, duration, preparation, choices, intensity/category and safety notes before start.
8. THE DNA LAB: sandbox for testing profile combinations; explicit confirmation before saving changes.

Suggested data entities (validate against existing schema first): `kink_dna_profiles`, `kink_dna_answers`, `kink_dna_boundaries`, `right_now_checkins`, `recommendation_feedback`. Define ownership, retention, RLS, indexes, deletion cascade and TypeScript types.

### Phase 3 — Experience Engine and game content
Create a modular, versioned engine for task cards, stories, choices, timers, audio, safety checks, XP and aftercare. Do not hard-code each game as an isolated app.
Modes: Story, Random, Surprise, Custom and Boss. Surprise/random must only select allowed, approved content and respect exclusions.
Approved chapters: The Arrival, The Test, The Control, The Challenge, The Boundary, The Night, After Hours.
Approved game families:
- THE SERVICE PROTOCOL
- THE ANTICIPATION ENGINE
- THE DUALITY PATH
- THE ROLEPLAY CHRONICLES
- THE WORDS OF AUTHORITY
- THE SENSORY QUEST
- THE BOUNDARY LAB
- THE PROVOCATION GAME
- THE INSTINCT PATH
- THE COURT OF RULES
- THE FIRST PROTOCOL (beginner-friendly 5–10 minute starter)
- THE UNLOCKABLE NARRATIVE (multi-session story with resume; no missed-day penalty)
- THE MIDNIGHT MYSTERIES (riddles, clues, symbols, branches)
- THE EXPERIENCE BLUEPRINT (build, preview, validate, save and edit custom experiences)

All experiences require clear previews, editable settings, accessible alternatives and PAUSE/PASS/STOP at all times. No penalties for passing/stopping; no forced progression after a user is overwhelmed.

### Phase 4 — Large Game Task Library
Roadmap requirement: minimum 300 reviewed task cards at launch, growing toward 500+. This is a target, not a claim that cards already exist.
Initial editorial distribution:
- 80 discovery, reflection and preference-building cards.
- 60 protocol, service, ritual and routine cards.
- 50 tease/anticipation, puzzle, riddle and branching-story cards.
- 40 roleplay, character and fictional-scenario cards.
- 30 praise, affirmation, confidence and communication cards.
- 20 sensory atmosphere, sound, visual and imagination cards.
- 20 couple discussion and agreement cards.
- 20 safety, preparation, check-in and aftercare cards.
- 20 adult-only explicit-category records, only after provider-policy/legal/age-access review and human approval. These must not be generated or published before gates pass.
The first 80 seed examples are in `docs/MASTER_BUILD_ROADMAP.md` section 21. Expand these into full distinct, localized, reviewed cards; do not pad with near-duplicates.

Each task card needs: stable ID/slug/version; title/preview/full text; NL/EN; category/classification; compatible game modes; DNA tags; experience level; estimated duration; intensity; solo/partner context; preparation/equipment and alternatives; safety prerequisites; fictional vs real-world flag; pause/pass/stop behavior; aftercare; reviewer; status; XP event where appropriate; duplicate fingerprint; accessibility alternative; publication history.
Content lifecycle: draft → automated schema/safety checks → human review → approved → scheduled/published → monitored → revised/withdrawn. AI output is an untrusted draft, never automatically approved. Keep published versions stable for session history; allow rollback/withdrawal.
- Seed library must have no duplicate filler cards.
- Random/Surprise cannot surface excluded or unapproved content.
- Feedback and “not now/not for me” update recommendations only according to explicit user choices.
- Use curated pre-authored fallback if AI unavailable or over budget.

### Phase 5 — Virtual Domme and AI
- THE VIRTUAL DOMME: clearly labelled AI character; configurable tone/style/role; no pretending to be human.
- AI DOMME CHAT: optional user-approved memory, with view/edit/delete/pause controls.
- VOICE OF AUTHORITY and THE VOICE LIBRARY: multiple voice styles/pace/volume, text transcript, silent mode and accessibility.
- ANIMATED DOMME AVATAR: lightweight animation first; 3D only after cost/performance review.
- THE DOMME EXPERIENCE DIRECTOR: guides story, choices, timers, Tarot, progression and aftercare without overriding user choices.
- Provider policy review for exact content type, API terms, data processing, retention, moderation, rate limits and costs. If a provider does not permit a content category, do not generate it through that provider.
- Never expose API keys to client. Server-side API/edge function only; set spend caps, rate limits and usage monitoring; avoid sending sensitive profile fields unless essential. Provide deterministic curated fallback.

### Phase 6 — Tarot, astrology, daily and seasonal content
- Kinky Tarot, Kinky Oracle, saved readings and reveal animations; present as entertainment/reflection, not professional advice.
- Astrology/horoscope/insights with optional user-entered birth data, timezone handling, minimal collection and deletion/export.
- DAILY AFTER HOURS, THE SECRET MISSIVE, optional daily/weekly prompts, THE PERSONAL SEASON, SEASONAL WORLDS, Themes & Seasons and optional 7 Nights Challenge.
- No guilt-based streaks, missed-day penalties or loss of progress.
- Schedule and localize content through admin; opt-in notifications only.

### Phase 7 — Identity, ranks, rewards and collections
Approved rank thresholds:
- THE CURIOUS: 0 XP
- THE INITIATE: 250 XP
- THE DEVOTED: 600 XP
- THE DISCIPLINED: 1,200 XP
- THE ENTHRALLED: 2,000 XP
- THE BOUND: 3,500 XP
- AFTER HOURS: 5,000 XP
Before implementation, reconcile this approved ladder with any existing 15-rank/200-XP-level code and select one canonical configuration. XP must be server-authoritative, idempotent and never awarded for violating boundaries.
- Achievements, badges, milestones, reward vault and progression animation.
- THE PERSONA WARDROBE: titles, emblems, avatar styles, frames and themes.
- THE PRIVATE COLLECTION: favorites, stories, rituals and collectibles.
- THE MIDNIGHT VAULT: unlockable illustrations, emblems, stories, soundscapes and assets with rights checked.
- THE DESIRE CONSTELLATION: private editable visualization of preferences.
- THE NIGHT RECAP: optional private session summary.

### Phase 8 — Couples and communication
- COMPATIBILITY COMPASS and THE DIFFERENCE BRIDGE.
- THE DUO JOURNEY / DYNAMIC DUO with optional shared milestones/check-ins.
- THE PRIVATE SIGNAL: curious / maybe later / not now / let's discuss; silence is not consent.
- THE CONSENT PASSPORT: editable private preferences/agreements/signals, never a certification.
- THE AGREEMENT ROOM and PARTNER CHECK-IN.
- THE GIFT VAULT only after secure purchase/refund controls.
- Explicit per-item sharing, partner access preview, revoke/unlink, delete shared data. No automatic disclosure of private answers.

### Phase 9 — Audio, visual, camera and sensory
- LIVING BACKGROUND, interactive card reveals, cinematic intros, progression/reward animations, ambient waveform and event-based sound.
- SENSORY SYNC: optional animations/light/audio/haptics, reduced-motion support, battery/performance awareness.
- Music phases, original/licensed soundscapes and SFX. Spotify only if the precise integration/use case is permitted by current developer and commercial terms; otherwise use licensed/original audio.
- AFTER HOURS CAMERA OVERLAY: CLEAN / AFTER HOURS / CINEMATIC, branded frame, optional effects and clear recording indicators.
- Private media vault: private bucket, signed short-lived URLs, validation, file size/type limits, deletion/retention, audit and no public exposure.
- Seasonal iOS/Android/PWA icon variants, respecting platform constraints.

### Phase 10 — Safety, consent, privacy and aftercare
- Age gate and legal review for appropriate age assurance.
- Explicit session consent; revocable at any time.
- PAUSE/PASS/STOP always visible, accessible and immediate.
- Safe signal/safeword configuration, check-ins, before/during/after mood, emergency exit and aftercare.
- THE AFTERCARE BLUEPRINT and AFTERCARE MODE: user-selected grounding/quiet/communication options; no diagnosis or replacement for professional care.
- Sensitive preferences, private notes and mood history remain private by default; clear export, correction, deletion and retention controls.
- No ads targeted using kink/sexuality/relationship/mood data.
- No content may encourage non-consensual acts, coercion, ignoring stop signals, dangerous restraint, breath restriction, injury-risk activities or bypassing safety.
- Legal review: GDPR/ePrivacy, consumer law, age access, platform rules, content moderation and applicable jurisdictions.

### Phase 11 — Admin Control Room and content operations
Modules: Overview, Commands, Users, Sessions, Media, Music, Payments, Products, Ranks, Achievements, Settings, Test Mode, Analytics, Help/Support, Changelog, Notifications, KINK CONTENT STUDIO.
KINK CONTENT STUDIO must support: create/edit/preview/test, bulk import/export CSV/JSON, tags, NL/EN translations, duplicate detection, role/interest mapping, safety prerequisites, disallowed combinations, versioning, approval, scheduled publication, rollback, withdraw, review notes and content coverage analytics.
- Admin authorization must be server-verified; never trust a hidden client route or localStorage flag.
- Audit privileged actions; limit access to sensitive content; aggregated/minimal analytics.
- Creator content stays disabled until rights, moderation, reporting, takedown, payout/tax and platform/provider terms are ready.

### Phase 12 — Support, community and legal
- Help Center, support/report content, troubleshooting and user feedback.
- Legal pages: Terms, Privacy, Refund, Consent Policy, Content Rules, Content Removal/Complaints, applicable cookie/tracking disclosures.
- THE KINK ACADEMY with reviewed educational content and source/author metadata.
- THE INNER CIRCLE/community only after moderation, age controls, reporting/blocking, privacy and incident response are operational.
- Creator Market: official content first; external creators only after rights, moderation, payouts, taxes and abuse workflows are approved.
- Verify social links before publication. Instagram reference: https://www.instagram.com/enter_afterhours/

### Phase 13 — Monetization and integrations
- Keep checkout disabled until legal/business readiness, provider approval, credentials, server-side checkout, signed webhooks, refunds, tax and security are verified.
- Existing intended provider abstraction: VEROTEL / SEGPAY / DISABLED. Do not claim any provider is active without proof. No Tikkie or personal Revolut checkout.
- Price decision remains open: previous €59.99 for 3 games vs later €75 for 3 games. Do not hard-code price before owner confirms.
- Free/premium tiers, experience packs, cosmetics, Couples Mode and Creator Market require entitlements, orders, refunds, cancellation, abuse prevention and customer support.
- Google/Apple/email auth, private media, AI/voice, notifications, and any WhatsApp/Spotify integrations require provider-specific policy, credentials, cost, fallback and monitoring.

### Phase 14 — Data model and authorization
Inspect schema first, then design additive migrations. Candidate tables only if missing: `kink_dna_profiles`, `kink_dna_answers`, `kink_dna_boundaries`, `right_now_checkins`, `recommendation_feedback`, `story_routes`, `story_progress`, `experience_blueprints`, `blueprint_versions`, `collections`, `collection_items`, `cosmetics_inventory`, `voice_preferences`, `mystery_progress`, `season_content`, `partner_links`, `sharing_grants`, `consent_agreements`, `content_versions`, and orders/entitlements only after monetization approval.
For every table/function: ownership, grants, RLS, indexes, foreign keys, retention, delete behavior, audit and TypeScript types. Test cross-user denial, anon denial, partner-grant scope, admin least privilege, account deletion and direct RPC calls. Never rely on localStorage for authoritative consent, XP, sessions or purchases.

### Phase 15 — QA and release
- Unit tests: DNA state, recommendations, card validation, rank/XP, stories, blueprints, timers, localization and aftercare.
- Integration tests: auth, RLS, RPC grants, session lifecycle, consent revoke, XP idempotency, media and account deletion.
- E2E: onboarding → DNA → recommendation → preview → game → aftercare → recap; story resume; mystery; wardrobe; collection; partner share/revoke; admin publish.
- Security: cross-account isolation, admin escalation, XSS/injection, upload abuse, signed URL expiry, rate limits, secret scanning, policy checks.
- Accessibility: reduced motion, keyboard, screen reader, focus, contrast, text scaling, audio transcript, silent mode and touch targets.
- Devices: iPhone Safari/PWA, Android Chrome/PWA, tablet and desktop; test camera, mic, audio resume, safe areas, offline and updates.
- Performance: bundle budgets, lazy loading, asset optimization, slow network and low memory.
- CI: typecheck, lint if configured, unit/integration tests, production build, migrations/schema checks; required checks pass before merge.
- Staging smoke tests, production verification, backup/restore and rollback.
- Do not label a feature live until observed in deployed environment.

## E. Decisions that must stay open until confirmed
1. Canonical progression: seven approved ranks vs existing 15-rank/200 XP-level model.
2. Price: €59.99 vs €75 for three games.
3. Payment provider: Verotel, Segpay or disabled.
4. AI/voice provider, spend limits, processing/retention terms.
5. Exact music/Spotify use case and licensing.
6. Legal age assurance and jurisdiction requirements.
7. Launch vs later release scope for community/Creator Market.
Do not block routine engineering on these decisions; keep dependent features behind flags until resolved.

## F. Definition of done
A feature is done only when it has a designed flow and states; correct schema and authorization; privacy/safety checks; mobile and accessibility behavior; tests for normal, error and abuse paths; localization; docs/changelog; CI pass; staging verification; and production evidence if called live.

## G. Immediate next actions
1. Inspect latest state of PR #15 and canonical branches/deployments.
2. Verify/fix the Supabase SECURITY DEFINER/RLS findings and latest CI.
3. Build the feature-status matrix against actual code.
4. Finalize the data model for KINK DNA and content cards.
5. Implement the KINK CONTENT STUDIO + versioned task-card schema and seed reviewed non-explicit cards.
6. Implement recommendation/preview/game loop with PAUSE/PASS/STOP.
7. Add further game cards in reviewed batches until the target library count is met.
8. Add AI drafting only behind provider-policy checks, server-side key handling, spend caps and human review.
9. Add remaining features phase by phase; run tests and update the checklist after every PR.

**End of handoff specification.**
