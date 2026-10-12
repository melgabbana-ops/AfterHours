# AFTER HOURS — Complete Approved Scope & Acceptance Checklist

**Purpose.** This is the expanded working scope reconstructed from the saved master build prompts dated 4 and 7 October 2026, the later *MASTER DESIGN-FIRST OVERRIDE*, the 9 October action-plan report, and later project decisions reflected in the current branch. The earlier short checklist was incomplete; this version is intended to supersede it as the day-to-day acceptance inventory.

**Source files recovered from the project Library**
- `AFTER_HOURS_MASTER_LOVABLE_PROMPT_UPDATED.txt` (7 Oct 2026): 38-part master build prompt plus design-first override.
- `AFTER_HOURS_MASTER_LOVABLE_PROMPT.txt` (4 Oct 2026): earlier version of the master prompt.
- `Analyse en Actieplan voor AFTER HOURS` (9 Oct 2026): prior feature inventory, gaps, privacy/security plan, payment conflicts and QA plan.
- Current application repository, especially `src/`, `public/`, Supabase migrations and PR #1.
- This list distinguishes approved scope from proof of implementation. A written requirement or a passing build does not prove the feature works end-to-end.

## Status vocabulary
- [ ] **Not verified / to do:** no current end-to-end evidence yet.
- [~] **Partial:** screen or core code exists, but behavior, persistence, security, integration or testing is incomplete.
- [x] **Verified:** implementation was inspected and the relevant acceptance test passed. Only mark this after evidence exists.
- **Blocked:** requires credentials, provider approval, database operation, supplied creative asset, legal review or another external decision.
- **Needs reconciliation:** an older source conflicts with a later project decision; preserve the latest accepted instruction and do not silently revert.

## A. Product and visual direction (design is first priority)
- [ ] Upgrade the existing app; **do not rebuild from scratch** and do not discard working authentication, Supabase, accounts, sessions, media, admin functionality or existing data.
- [ ] The product promise is **AFTER HOURS — “YOUR RULES. YOUR LIMITS. YOUR EXPERIENCE.”**
- [ ] One unified visual world across app icon, splash, onboarding, installation, trailer, character selection, home, gameplay, XP, ranks, avatars, music, mood checks, aftercare, private notes, media, notifications, social assets and admin.
- [ ] Preserve the official supplied AFTER HOURS AH monogram/logo, including crescent moon and hanging ornamental detail. Never invent an alternate logo, redraw it with AI or replace it with plain text.
- [ ] Place approved identity consistently on splash/loading, favicon, app icon, navigation, rank frames, badges/achievements, profile and social templates.
- [ ] **Design-first override palette (latest visual source):** #070509, #100712, #180A20, #291033, #6D168F, #8E24B7, #C89445, #D7A84F, #F3C96B, #F4EBDD. Black/deep purple are structural, violet is atmospheric, champagne/metallic gold is for key actions, borders, icons, ranks and ornaments. STOP/danger uses a clearly recognizable danger treatment.
- [ ] The earlier master palette (#09050D, #110914, #160D1C, #1D1023, #291333, #DDB85B, #F0D58A, #8D6A2D, #7B2CBF, #B13CC7, #F5EFF7, #B7A9BC, #796C80, #E54858) is a historical reference, not permission to introduce arbitrary colors. Reconcile any implementation tokens with the later override.
- [ ] Luxury high-contrast serif for logo, principal headings and ranks; clean modern sans-serif for controls and body; intentional tracking on uppercase micro-labels.
- [ ] Use dark glass cards, roughly 22px corner radius, fine gold/purple borders, soft shadow and inner glow; gold/champagne primary buttons; transparent dark secondary controls with gold outline; restrained purple glow for selected states.
- [ ] Cinematic art direction: black velvet, deep-purple fabric, candlelight, purple smoke, warm gold reflections, deep shadows, restrained bokeh and ornaments. Reserve photographic/cinematic imagery for major screens, with dark overlays; do not put photography behind every small component.
- [ ] Premium luxury after-dark club, cinematic and adult. Never generic SaaS/dashboard, dating-app/social-clone styling, white corporate screens, childish arcade visuals, cartoon characters, excessive neon, random icons, cheap stock photography, generic Bootstrap/Material appearance or inconsistent default controls.
- [ ] The same character universe, card/button/border/icon system, typography, logo, rank frames and visual language across every screen; redesign any outlier before release.
- [ ] Character artwork must be tasteful, cinematic, non-explicit and non-sexualized. The app remains adult-only and consent-first.
- [ ] Preserve current approved navigation and screen hierarchy; avoid regressions while adding features.

## B. App icon, PWA shell, splash, onboarding, age gate and trailer
- [~] Square AH-style PNG icon assets at 192×192 and 512×512, Apple touch PNG reference and favicon are present; verify exact official logo match and iOS/Android device rendering.
- [ ] Web app manifest: name and short name AFTER HOURS, display `standalone`, theme/background colors from the locked design system.
- [ ] Cinematic splash: dark background, official AH logo, purple glow, gold loading indicator and smooth transition into the app.
- [ ] First-open onboarding sequence, with completion state persisted so it does not repeat automatically.
- [ ] Onboarding screen 1: AFTER HOURS and approved line “MEER DAN EEN GAME. EEN ERVARING.”
- [ ] Onboarding screen 2: “DIT KUN JE VERWACHTEN”, explaining commands, XP/ranks, avatars/unlocks, mood checks, music/SFX, photo/video/voice, private media, aftercare, surprise events and boss rounds.
- [ ] Onboarding screen 3: “INSTALLEREN OP JE TELEFOON”, clear iPhone/Safari and Android/Chrome steps, plus “Bekijk uitleg” and “Later”.
- [ ] Onboarding screen 4: 30–60 second cinematic preview; “BEKIJK TRAILER” and “OVERSLAAN”. Show it automatically only once, then allow replay; persist `trailer_seen`.
- [ ] Separate, clear 18+ age gate before adult functionality; age confirmation persistence must be correct and not silently reset or bypassed.
- [ ] Under Construction teaser remains a distinct cinematic/second-screen experience and cannot trap ordinary users or prevent normal app entry.
- [ ] Add an in-app INSTALL AFTER HOURS panel with iPhone and Android instructions matching the brand.
- [ ] Trailer imagery should show logo, characters, commands, timer, XP, ranks, music, mood, boss round, aftercare and private media without explicit promotional/onboarding imagery.
- [ ] Check onboarding for first-time, returning, skip, replay and interrupted-flow cases.

## C. Character, identity, profile and visual evolution
- [ ] First-time setup: “KIES JOUW CHARACTER”; source prompt specifies feminine and masculine choices. If additional identity options are already approved elsewhere, preserve them rather than removing them. Gameplay, commands, XP, ranks and rewards must be equal for all choices; selection changes visual identity only.
- [ ] Character customization categories: hair, face, skin tone, outfit, accessories, mask, neck detail and style.
- [ ] Persist chosen character and appearance across sessions/devices wherever account sync is supported.
- [ ] The same chosen character identity evolves visually with rank. Do not replace the person with a random unrelated avatar after ranking up.
- [ ] Rank-driven cosmetics: outfit, accessories, lighting, frame, badge, aura and premium styling.
- [ ] Suggested visual rank progression from master spec: Level 1 subtle violet/dark frame; Level 2 silver/purple; Level 3 black/gold ornamental; Level 4 geometric gold; Level 5 purple/gold ornament; Level 6 black/champagne-gold; Level 7 signature AFTER HOURS black glass, gold edge, purple glow and ornamental corners.
- [ ] Premium profile/settings: display name, unique AFTER HOURS username/AH-ID, character/identity, rank, level, XP bar, progress to next level, session statistics, recent session history and Achievements & Collection.
- [ ] Avatar choices, frames, accessories and unlockables should be driven by persistent user state rather than decorative-only buttons.
- [ ] Preserve approved profile naming and username validation rules and show useful errors when save/network operations fail.

## D. Seven approved major ranks and progression
- [ ] Preserve the approved English rank names exactly: **THE CURIOUS, THE INITIATE, THE DEVOTED, THE DISCIPLINED, THE ENTHRALLED, THE BOUND, AFTER HOURS**. Do not silently rename them.
- [ ] Existing approved threshold sequence: 0, 250, 600, 1200, 2000, 3500, 5000 XP.
- [ ] Localized Dutch descriptions may be used without replacing the fixed English rank labels. The master prompt associated the ranks with “De Nieuwsgierige”, “De Ingewijde”, “De Toegewijde”, “De Gedisciplineerde”, “De Gefascineerde”, “De Gebondene”, “De Nachteling”.
- [ ] Rank/progression screen with ornate frame, avatar, level, XP, next unlock and clear ladder.
- [ ] Level-up reveal when crossing a rank threshold: briefly pause progression, show “NEW RANK UNLOCKED”, character/avatar, new frame, rank name, XP and unlocks; restrained gold particles/purple aura and short cinematic sound, never childish confetti.
- [ ] XP event history stores user_id, session_id, command_id, event_type, base_xp, multiplier, final_xp and created_at.
- [ ] Example base XP table in the master prompt, subject to product rules and no-safety-penalty constraints: Easy +10; Medium +15; Hard +20; Boss step +25; Voice +15; Photo +15; Video +20; Choice +15; boss round completion +75; daily command +20; surprise experience +25; first game +50; new category mastered +50; game completion 15 min +50, 30 min +100, 60 min +150.
- [ ] XP award rules must be centralized, explainable, persistent and idempotent. No double awards from reloads, retries, repeated webhooks or repeated UI clicks.
- [ ] PASS = 0 XP but no penalty. PAUSE, STOP and OVERWHELMED cause no XP penalty. Never award XP for crossing a limit or continuing after STOP.
- [ ] **Combo system:** consecutive completed commands; x2 +5%, x3 +10%, x4 +15%, x5 +20%; maximum multiplier 1.5×. Passing a command resets combo; pause, stop, mood check, permission issues and technical errors must not reset combo. Validate how safety-driven stops interact with future combo continuation before launch.
- [ ] Daily missions, weekly missions and special/evergreen milestones must coexist with XP, ranks and badges. Mission points currently exist separately in code; either integrate safely/idempotently or keep explicitly separate until a deliberate rule is confirmed.
- [ ] A STOP or changed boundary always outranks points, streaks, combo, rank or session-completion logic.

## E. Achievements, badges, collections and unlocks
- [ ] Keep a persistent Achievements & Collection screen, with icon, title, description, unlock date/time and source event.
- [ ] Master-prompt achievement set: FIRST NIGHT, TEN COMMANDS, DISCIPLINED, VOICE, CAMERA, DIRECTOR, RANDOM, BOSS, STREAK, NIGHT OWL, AFTER HOURS.
- [ ] Preserve additional implemented/approved event badges where relevant, including first login, horoscope/Star Gazer, Kinky Tarot, Oracle, daily horoscope, consent confirmation, first/completed sessions, three sessions and first prompt.
- [ ] Resolve badge definitions so older and newer badge sets are additive unless a clear explicit superseding decision is found; do not drop earned badges or change IDs without migration.
- [ ] Event-based badge awarding must be idempotent and backed by verified event history; user interface open alone should not falsely grant an achievement.
- [ ] Rank frames, character cosmetics and unlockables should be represented consistently in the user's collection.
- [ ] Test edge cases: repeat event, offline retry, device switch, account sync, timezone/day rollover and rank threshold crossed in one award.

## F. Game modes, experiences, Story chapters and command library
- [ ] Five modes from master spec: STORY MODE, RANDOM MODE, SURPRISE MODE, CUSTOM MODE, BOSS MODE.
- [ ] Story chapters: 1 THE ARRIVAL; 2 THE TEST; 3 THE CONTROL; 4 THE CHALLENGE; 5 THE BOUNDARY; 6 THE NIGHT; 7 AFTER HOURS.
- [ ] Home/dashboard primary action START EXPERIENCE; secondary actions SURPRISE ME and TODAY'S COMMAND.
- [ ] Other home actions: MY FAVORITES, MY SESSIONS, MY MEDIA, PROFILE and AFTERCARE.
- [ ] Experiences gallery uses large cinematic cards. Selection screen includes duration, intensity and category chips.
- [ ] Story progression, selected mode, completed chapters, favorites and session history persist accurately.
- [ ] Random/surprise events from master prompt: MYSTERY COMMAND, DOUBLE XP, SECOND CHANCE, HIDDEN TIMER, SILENCE, CHOICE EVENT, BONUS ROUND. Use sparingly, explain outcomes and never override safety or consent.
- [ ] Boss rounds are optional multi-stage rounds every several commands, with five steps, which may be text, timer, choice, voice, photo or video where the user expressly opts in; completion bonus in master spec is +75 XP.
- [~] The feature branch now has 100 entries in the Kinky opdrachten category (139 prompt items total) with English text and uniqueness/count tests. Still map prompts into all approved categories (DOMINANCE, SUBMISSION, DISCIPLINE, TEASE, ANTICIPATION, MIND GAMES, ROLEPLAY, PET PLAY, SERVICE, PHOTO, VIDEO, VOICE and CHOICE) and verify eligibility metadata, hard/soft limits, media permissions and admin editing.
- [ ] Each command has: id, title, instruction, category, difficulty, duration, xp, type, requires_photo, requires_video, requires_voice, requires_mood_check, premium, active and tags.
- [ ] Command eligibility checks hard/soft limits, user-selected boundaries, mode, consent and any media permissions. Hard limits must never be preselected.
- [ ] Admin can add/edit/activate/deactivate commands and users see only active, eligible commands.
- [ ] Include meaningful empty, loading and error states; all command actions and navigation must work, not be dead buttons.

## G. Session lifecycle, HUD, timer, pause/pass/stop and recovery
- [ ] Full master flow to implement and test: AGE GATE → LOGIN → NICKNAME → CHARACTER → LIMITS → MOOD → GAME MODE → GAME START → COMMAND → XP → COMBO → NEXT → RANDOM EVENT → COMMAND → BOSS ROUND (when selected/triggered) → FINAL COMMAND → FINAL MOOD → AFTERCARE → PRIVATE NOTE → SESSION SUMMARY → GAME XP BONUS → LEVEL CHECK → LEVEL UP (if applicable) → RANK AVATAR → ACHIEVEMENT (if applicable) → COMPLETE.
- [ ] Cinematic active-experience HUD: logo/name, nickname, rank avatar, level, rank, XP, game progress and combo at top; category, command title/instruction, timer and reward in center; persistent PAUSE, PASS and STOP controls at bottom.
- [ ] Gold timer ring, purple atmospheric glow and minimal distractions; always-visible path to STOP.
- [ ] Command reveal has fast cinematic fade/slide/glow. Respect reduced-motion settings.
- [ ] Timer must survive refresh/reopen according to the saved timestamp; no timer duplication, negative time or background-tab drift.
- [ ] Pause/resume, pass, stop-now, next command and session reset have deterministic state transitions and robust persistence failure messages.
- [ ] PASS skips command safely and grants no XP/no penalty; PAUSE pauses timer without penalty; STOP ends immediately and cannot be blocked by animation or network request.
- [ ] A STOP cannot be overridden by delayed async completion, timer callback, media upload or stale server response.
- [ ] Preserve session history including duration, commands completed, passes, XP earned, mood, media count, combo and completion timestamp.
- [ ] Local and Supabase state sync must handle offline/online changes, retry idempotently, validate incomplete server data and never overwrite newer data with stale state.
- [ ] When restoring an interrupted session, explicitly re-request consent where required. Old/pending consent must not silently carry into an incompatible/new session.
- [ ] Stopping, pausing, passing or being overwhelmed must not reduce XP or create a shame/punishment pattern.

## H. Consent First, boundaries, Mood Check and safety overlay
- [ ] Consent is explicit and session-scoped, can be revoked, and is checked before gated experiences.
- [ ] Boundaries and consent controls are clear, premium-styled, always easy to find and never hidden behind menus or a paywall.
- [ ] Safewords/statuses use PAUSE, PASS and STOP exactly as approved. Preserve any agreed Dutch explanations without changing these labels.
- [ ] Hard limits are never preselected; hard and soft limits are checked before command display or media capture.
- [ ] Before-session mood choices from master prompt: KINKY, EXCITED, CURIOUS, CALM, PLAYFUL, CONFIDENT, UNSURE.
- [ ] During-session mood choices: INTO IT, MORE, GOOD, NEUTRAL, NEED A PAUSE, OVERWHELMED, STOP.
- [ ] After-session mood choices: RELAXED, SATISFIED, ENERGIZED, TIRED, EMOTIONAL, OVERSTIMULATED, NEUTRAL, UNSURE.
- [ ] NEED A PAUSE or OVERWHELMED immediately pauses timer and progression and shows “Je bent in controle. Neem je tijd.” with CONTINUE and END EXPERIENCE options; continue requires user agency and safe reconfirmation.
- [ ] STOP ends the session immediately.
- [ ] Persistent safety overlay; safety states must never rely on color alone. Use clear labels, icons, readable contrast and accessible controls.
- [ ] Safety and consent events can create relevant badges only after genuine confirmation; no incentive can pressure someone to continue.
- [ ] Preserve existing consent revocation, green/amber safety state, safe session settings and consent renewal-on-restore behavior.
- [ ] Keep all challenges non-explicit, consensual, 18+, private and safety-first; no coercive or non-consensual content, no minors, no illegal content and no intimate-device control.

## I. Aftercare, private notes and mood history
- [ ] Aftercare starts with “De ervaring is voorbij.” and gentle guidance such as drink water, breathe calmly and take time for yourself.
- [ ] Standalone 30-minute Aftercare Meditation remains accessible in free access without premium purchase.
- [ ] Aftercare uses a softer, warmer light while retaining the same black/purple/gold identity.
- [ ] Post-session order: FINAL MOOD → PRIVATE NOTE → SESSION SUMMARY.
- [ ] Optional private note prompt: “Wil je iets onthouden van deze ervaring?” with fields/questions for how the session felt, what was liked and what the user would like to change next time; save or skip.
- [ ] Store note owner, session_id, note body, created_at and updated_at. Notes are user-owned; admins must not automatically read note contents.
- [ ] Mood history shows before/during/after mood per session, is private to that user, and supports deletion.
- [ ] The session summary shows duration, commands completed, passed, XP earned, final mood, media count and combo.
- [ ] Summary actions: VIEW MEDIA, PRIVATE NOTE, PLAY AGAIN and CLOSE.
- [ ] Aftercare content must remain supportive, nonjudgmental and never be used as a penalty.

## J. Camera, photo, video, voice, and private media vault
- [ ] Reusable AfterHoursCameraFrame with CLEAN, AFTER HOURS and CINEMATIC modes.
- [ ] AFTER HOURS frame uses dark purple, gold border, subtle official logo, command title, optional nickname and optional timer; never cover the face.
- [ ] Capture controls, where browser/device capability permits: FLIP CAMERA, START, STOP, RETAKE, SAVE PRIVATELY and DELETE.
- [ ] Support photo, video and voice-recording flows where browser permission and platform APIs allow; gracefully handle denial, unsupported APIs, interruption and storage errors.
- [ ] Request camera/microphone permissions only in direct response to a clear user action and after any required consent/command permission.
- [ ] Private media is private by default; use a private Supabase Storage bucket, owner-scoped RLS/storage policies and signed URLs with sensible expiry. Never expose public URLs.
- [ ] Media gallery tabs: ALL, PHOTOS, VIDEOS, VOICE and FAVORITES. Actions: VIEW, PLAY, FAVORITE, RENAME and DELETE.
- [ ] Support metadata, owner, media type, creation date, favorites and private deletion; do not load the entire vault in one render.
- [ ] Media count may appear in session summary without exposing the media to anyone else.
- [ ] No automatic upload or sharing without clear user consent. Deletion should handle both metadata and stored object safely.
- [ ] Media use in XP/achievements must be explicitly initiated, optional and non-coercive.

## K. Music, radio, sound effects and haptics
- [ ] Replace a monotonous drone with a real soundtrack system and distinct phases: ARRIVAL, THE COMMAND, TEASE, CONTROL, BOSS, INTENSE and AFTERCARE.
- [ ] Music direction: arrival atmospheric/slow pulse; command controlled electronic beat/deep bass; tease tension/anticipation; control stronger dark electronic groove; boss dramatic percussion/rising tension; intense faster cinematic dark electronic pulse; aftercare warm pads/soft piano/calm texture.
- [ ] Use original or properly licensed music only. Validate commercial streaming terms before integrating external streaming services.
- [ ] Crossfade music by 1–2 seconds; duck music during voice recording/playback; STOP stops audio immediately.
- [ ] Audio settings include music and sound effects controls; respect browser autoplay limitations and user preferences.
- [ ] Sound effects for command reveal, timer start/completion, XP, combo, achievement, boss, level-up, photo, video, voice, mood and session completion.
- [ ] Sound should be cinematic/premium, never childish arcade sounds.
- [ ] Haptics where supported for command start, timer complete, XP, achievement and level-up; include HAPTICS ON/OFF setting and gracefully fall back when unsupported.
- [ ] Radio screen is part of the later approved product scope; keep bilingual, match the brand and avoid claiming third-party catalogue access unless actually configured.
- [ ] Spotify is an idea to investigate, not assumed commercially permitted or technically connected. Check licensing, playback/embed policy and adult-content constraints before implementation.

## L. Kinky Tarot, Oracle, astrology and daily discovery
- [ ] Kinky Tarot feature, including a meaningful card draw/reflection and its appropriate achievement event.
- [ ] Oracle feature and Oracle message/reflection, with appropriate achievement event.
- [ ] Astrology/horoscope experience, daily reflection and daily badge event where applicable.
- [ ] Keep these screens bilingual and in the approved visual world; support repeat visits without duplicate rewards.
- [ ] Integration into Insights and missions must be clear; simply opening a page should only award a “viewed” event where that is the explicitly defined behavior.
- [ ] Keep reflective content optional, private and free of pressure or claims of professional advice.

## M. Favorites, sessions, collection and notifications
- [ ] My Favorites is a real persisted collection of eligible commands/experiences; add/remove and empty states work.
- [ ] My Sessions shows real session history and statuses; repeat/replay starts a new valid session rather than corrupting previous history.
- [ ] My Media, profile and aftercare are reachable from the home dashboard.
- [ ] Notifications are minimal, elegant and bilingual, with clear read/unread state and safe links to the relevant feature.
- [ ] Inbox and Help Center & Support, if included in the approved current navigation glossary, must be real functional destinations, not inert labels.
- [ ] Privacy Mode hides sensitive content on screen where specified and does not substitute for server-side authorization.
- [ ] Daily AFTER HOURS and THE AFTER HOURS ARCHIVE, if shown in current approved UI/brand glossary, must preserve their approved wording and have defined real behavior before being called complete.
- [ ] Offline/local-only state must be distinguished from server-synced state; do not imply sync completed when it failed.

## N. Social templates and promotional assets
- [ ] Reusable templates for TikTok, Instagram, Facebook, YouTube, X, Pinterest, Threads and website.
- [ ] Template formats: POST, STORY, REEL COVER, TRAILER COVER, ANNOUNCEMENT, LEVEL REVEAL, CHARACTER REVEAL, FEATURE REVEAL and COUNTDOWN.
- [ ] Same approved logo, palette, typography, characters, rank frames and brand universe across all exported assets.
- [ ] Promotional/trailer/onboarding assets are non-explicit, clearly 18+ and consent-first.
- [ ] Export/share actions should only claim success when a file or share action truly completed.

## O. Login, authentication and account lifecycle
- [ ] Supabase email authentication and the approved email access flows (magic link and password, where enabled).
- [ ] Google and Apple login are supported in code and tested when the matching Supabase provider settings and credentials are configured.
- [ ] Account creation, sign-in, sign-out, password reset/recovery and update-password flows handle errors distinctly from successful sign-out.
- [ ] Unique username/AH-ID, display name, validation and server-backed uniqueness; no false success on network failure.
- [ ] Age gate, onboarding, account creation and character selection retain intended sequencing.
- [ ] Session/account synchronization preserves the right user's profile, character, limits, sessions, media, favorites, notes, mood history, XP history, achievements, credits and orders.
- [ ] GDPR/privacy workflows: explain data use, provide a user-data deletion request path, and define retention/deletion behavior for account, session history, notes and media.
- [ ] Never expose magic links, session tokens, credentials or private account data.

## P. Backend, Supabase, database, RLS and security
- [ ] Inspect and reconcile schema/migrations with code before applying anything to a production database.
- [ ] RLS is enabled and tested for every user-owned table/storage area. User A must never access user B's profile, character, limits, sessions, media, favorites, notes, mood history, XP history, achievements, credits or orders.
- [ ] Admin-only actions/data: commands, music, products, payments, ranks, achievements, configuration and test mode.
- [ ] Never authorize admin based only on frontend state; confirm role/allowlist server-side on every protected route/action.
- [ ] No payment secrets or service-role secrets in frontend code. Use server-side functions for provider checkout, verification, credits and privileged operations.
- [ ] Validate incomplete/invalid server data and handle network errors/offline state without crashing or falsely resetting user progress.
- [ ] Ensure consent/session restoration cannot silently revalidate obsolete permission.
- [ ] Use least privilege; private object storage and expiring signed links for private media.
- [ ] Consider optional admin two-factor authentication if supported by the chosen auth configuration.
- [ ] Keep audit records for privileged changes without storing private note/media contents unnecessarily.
- [ ] Production migrations, role assignment, storage policies and RPCs are blocked until applied/tested in the intended Supabase project. Do not state these are live based only on SQL files or local UI.

## Q. Admin / Control Room / experience builder
- [ ] Secure admin areas, styled as part of AFTER HOURS rather than generic SaaS admin.
- [ ] Full planned sections: OVERVIEW, COMMANDS, USERS, SESSIONS, MEDIA, MUSIC, PAYMENTS, PRODUCTS, RANKS, ACHIEVEMENTS, SETTINGS and TEST MODE.
- [ ] Admin overview metrics are aggregated and do not expose private session contents, private notes or media by default.
- [ ] User management with authorized role/status operations and privacy guardrails.
- [ ] Session management with state and audit history; never grant admins blanket access to private user notes.
- [ ] Experience/command builder: create/edit/activate/deactivate command content and metadata.
- [ ] Rank administration: edit rank names/descriptions, XP thresholds, avatar/frame, badges and unlockables only with validation and audit logging. Changes must not corrupt existing progression.
- [ ] XP/progression configuration: edit XP awards and thresholds in an auditable, deterministic manner.
- [ ] Media and music management with licensing/ownership checks and private-by-default storage.
- [ ] Product and payment management, status, refund/failure handling and order history only once a real backend/provider exists.
- [ ] Social template management where applicable.
- [ ] TEST MODE supports 15/30/60-minute sessions, no real payment and no real credits consumed; clearly separate from production.
- [ ] Admin audit log identifies who changed what and when, excluding unnecessary sensitive data.
- [ ] Existing AdminDashboard uses role authorization and expects Supabase migration/RPC/tables; verify every view/update end-to-end in the intended project before calling admin complete.

## R. Monetization, packages, credits, payment providers and billing
- [ ] Preserve safety, consent, pause/pass/stop and essential aftercare without a paywall.
- [ ] **Current later project decision to preserve:** €9.99 for one game and €24.99 for the three-game pack. Do not revert to older prices without explicit confirmation.
- [ ] **Historical master-prompt prices conflict:** FREE DEMO €0, 1 GAME €24.99, 3 GAMES €59.99 MOST POPULAR, 5 GAMES €89.99. The 9 Oct action plan also recorded a possible €75 three-game proposal. Treat these as historical alternatives requiring reconciliation; the current app/project decision above takes precedence unless the owner changes it.
- [ ] Validate product names, price, credit counts and grants against the latest explicit project decision before turning on checkout. Avoid publishing contradictory prices in code, copy, admin or payment-provider dashboard.
- [ ] Historical master prompt credits: 1 / 3 / 5 for 1 / 3 / 5-game packs; confirm whether these still apply to the later two-product pricing before use.
- [ ] Historical payment architecture names Verotel, Segpay or DISABLED. Do not assume any provider is connected or approved. Do not reintroduce Tikkie or personal Revolut.
- [ ] Choose a provider only after checking current merchant approval and its explicit allowance for the intended adult BDSM-related digital content.
- [ ] Server-side checkout/payment creation; signed verification; webhook/postback; idempotency; trustworthy order status; no client-side credit grants.
- [ ] Handle successful, declined, cancelled, delayed, duplicate and refunded payments; grant access only after verified provider confirmation.
- [ ] Admin test sessions never consume credits or charge money.
- [ ] The present monetization screen is a local-interest placeholder, not a checkout. Keep the distinction visible until a secure end-to-end payment flow is in production.
- [ ] No revenue/paid-user analytics claims until real verified order data exist.

## S. Legal, complaints and content policy
- [ ] Adults 18+ only.
- [ ] Consent-first, private, non-explicit challenges; no minors, illegal content, non-consensual content or functionality that undermines boundaries.
- [ ] Terms & Conditions.
- [ ] Privacy Policy.
- [ ] Refund Policy.
- [ ] Consent Policy.
- [ ] Content Rules.
- [ ] Content Removal / Complaints procedure.
- [ ] Include clear privacy/data contact and deletion process.
- [ ] Review legal/provider rules for private media retention, payment products, music rights and adult content before release.
- [ ] Never put explicit sexual material in the trailer, teaser or promotional templates.

## T. Language, brand glossary and copy rules
- [ ] Complete Dutch/English coverage across onboarding, age gate, every screen, validation, errors, missions, badges, profile, Tarot, Oracle, Astrology, Radio, media, admin, update notices and maintenance.
- [ ] Dutch addresses one user as je/jij; do not accidentally address an individual as “jullie”.
- [ ] Preserve approved English product/brand labels where required, including: AFTER HOURS, Character Creation, Experiences, Radio, Daily AFTER HOURS, Achievements & Collection, THE AFTER HOURS ARCHIVE, Inbox, Control Room, Aftercare Mode, Privacy Mode, Help Center & Support.
- [ ] Keep official rank names and PASS / STOP / CONTINUE unchanged.
- [ ] Avoid inconsistent mixed-language screens or silently translating protected product names.
- [ ] Make error, success, empty, offline, blocked-permission and loading messages localized too.

## U. Update notices, planned maintenance and service continuity
- [ ] Register and update-check the service worker; if an update is waiting, show a clear app update notice and let the user apply/reload deliberately.
- [ ] Scheduled maintenance supports valid start/end times, warning window and NL/EN custom messages.
- [ ] Maintenance is disabled by default. Invalid timestamps/config fetch failure must not accidentally lock users out.
- [ ] Show advance warning according to warningMinutes; make the notice appear even if the app was already open before the warning window.
- [ ] During maintenance, show configured localized message and planned end time when available.
- [ ] Verify schedule transitions across open tabs, visibility/return from background and reload.
- [ ] A static JSON config does not constitute secure admin-managed maintenance controls.
- [ ] Real push notifications require actual subscription registration, server/provider delivery and unsubscribe/permission handling; a service-worker push handler alone is not live push.
- [ ] Keep release/deployment separate from feature development and require explicit owner authorization before production changes.

## V. Mobile, tablets, PWA, accessibility and performance
- [ ] iPhone-first design at 390×844, then verify 375, 393 and 430 widths; responsive support for Android phones, tablet and desktop without a separate visual identity.
- [ ] Safe-area inset top/bottom; no horizontal overflow; touch targets at least 48px.
- [ ] Mobile navigation matches the current approved spec: HOME / EXPERIENCES / RANKS / PROFILE, while preserving functional paths to media, settings, insights, Radio and admin where authorized. Resolve deviations in code before removing destinations.
- [ ] Installable standalone PWA with working manifest, icon, service worker and coherent launch screen.
- [ ] Keyboard navigation, screen reader labels/states, adequate contrast, large controls and reduced-motion support.
- [ ] STOP and safety controls accessible without hover, tiny targets or color-only signals.
- [ ] Camera, microphone, media, autoplay, background/resume and service-worker behavior tested per supported browser/platform.
- [ ] Lazy-load large imagery/video/audio; use thumbnails; optimize media and do not load the entire vault at once.
- [ ] Consider offline/network-loss states explicitly without claiming unsupported offline functionality.

## W. Test mode, automated/manual QA and release gate
- [ ] Run unit tests and production build after every substantive code change.
- [ ] Test first install, teaser-to-app entry, age gate, onboarding, trailer seen/replay, account flows, character persistence, consent, limits and interrupted-session consent renewal.
- [ ] Test all game modes, story chapters, command categories, 100+ command dataset, combo rules, XP events, rank thresholds, level-up, badges, surprise events and boss round.
- [ ] Test mood states before/during/after, pause, pass, stop, overwhelmed, aftercare, private note, mood history and deleting private data.
- [ ] Test camera/photo/video/voice permission denied, capture/retry/save/delete, private signed URLs, owner isolation and network failure.
- [ ] Test music phases, crossfade, voice ducking, STOP audio behavior, SFX toggle, haptics and reduced motion.
- [ ] Test local/remote sync, offline-to-online recovery, duplicate event prevention, double click/retry, timer recovery, stale response and corrupted/missing data.
- [ ] Test admin role denial, migration-missing state, authorized content edits, audit history, test mode and cross-user data isolation.
- [ ] Test payment provider disabled state, successful/failed/cancelled/duplicate/refunded webhook scenarios before accepting real money.
- [ ] Test PWA installation, iOS/Safari onboarding, Android/Chrome onboarding, all target widths, keyboard, screen readers and accessibility contrast.
- [ ] Fix every dead button, broken route, state/timer bug, XP duplication and privacy issue before release.
- [ ] Keep automated CI, integration/E2E tests and manual mobile verification. A green build only proves compilation/tests included in CI passed, not that every feature has been exercised.
- [ ] Never say a feature works unless actually tested. Use status labels to separate UI present, implementation coded, backend configured, CI passed, end-to-end verified and production deployed.

## X. Later-added features and cross-cutting details
- [ ] Kinky Tarot, Oracle and Astrology/horoscope are later-added scope beyond the original 38-part master prompt and must not be forgotten.
- [ ] Daily / weekly / special Missions have been added in the current feature branch; test reset intervals, real completion semantics, XP/badge integration and cross-device/account persistence.
- [ ] App-update notice and maintenance scheduling have been added in the current feature branch; the warning-time/user-facing maintenance details still require wiring and tests.
- [ ] Radio, privacy mode, help/support and other current approved glossary entries should stay visible in the full roadmap even where the current repo has only a partial screen.
- [ ] Preserve the official logo, current navigation, approved ranks, safety flows, pricing decisions and any existing feature that already works when implementing additions.
- [ ] Do not merge to `main`, deploy to production, apply production Supabase migrations or activate real payment/push features without the relevant approval and verified prerequisites.

## Known code/release gaps to track now
- [~] Missions now call server-side `get_mission_progress` / `complete_mission` RPCs when Supabase is configured; `supabase/migrations/20261012090000_mission_progress.sql` implements idempotent points. The migration is not applied to a live project, demo mode remains local and mission points are not XP.
- [~] Service-worker update notice and user-approved activation are wired in the feature branch; square PNG icons and manifest references are present. CI and real iOS/Android waiting-worker/install behavior still need verification.
- [~] Maintenance config now includes validated scheduling, advance warnings, localized messages, displayed expected end time and automatic maintenance lockout; CI is running and mobile/time-zone behavior still needs verification.
- [~] Admin dashboard code exists, but real availability depends on Supabase configuration, migrations/RPC, admin allowlisting, RLS and live data verification.
- [~] Monetization screen displays prices and stores local interest only; no payment starts.
- [~] Media vault, Radio, profile/avatars, sessions, insights and auth each need the specific acceptance tests above rather than being treated as complete solely because components exist.
- [ ] Verify all master-prompt screens/components against the current source code, including onboarding/trailer, character creation/evolution, game modes/100+ command library, mood history/private notes, private media capture, music/SFX/haptics, socials/templates, admin ranks/products/test mode, legal pages and pricing/credit consistency.
- [x] Build `docs/FEATURE_IMPLEMENTATION_MATRIX.md`, linking approved requirements to source files and explicitly marking partial, missing, unverified and external-prerequisite work. Keep the matrix updated as implementation changes. Do not infer missing features merely from the old 9 Oct report, which itself noted it had not yet inspected all code.
- [~] CI has been rerun repeatedly through each implementation change. Final status must be checked against the latest PR commit SHA before reporting completion. Keep changes on the feature branch until explicitly approved for merge/release.
