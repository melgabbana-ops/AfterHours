> **Design direction superseded (15 November 2026):** The latest approved reference screens and user instruction replace the purple/aubergine palette in this historical brief. Use deep black, warm bronze and champagne gold only. No purple UI, violet glow or plum panels. Preserve the functional and safety requirements below unless the user explicitly changes them.

# AFTER HOURS — APPROVED VISUAL UPDATE
## Direct implementation brief for Bolt

**Target:** Existing AFTER HOURS application  
**Repository:** `melgabbana-ops/AfterHours`  
**Branch:** `main`  
**Purpose:** Apply the approved AFTER HOURS visual identity consistently across the entire existing application. This file is the single source of truth for this visual update.

---

# BOLT: IMPLEMENT THIS UPDATE NOW

Read this complete file before editing. Then inspect the existing application and implement the visual update across every existing screen and component. Do not stop after changing the homepage or global background. The entire app must feel like one coherent, finished AFTER HOURS product.

This is a **visual redesign of the existing app**, not a rebuild.

## 1. Non-negotiable preservation rules

1. Keep the current application, routes, screens, components, interactions, state, authentication, Supabase integration, database schema, data, session lifecycle, XP logic, ranks, achievements, media handling, admin functions and existing safety controls working exactly as they do now.
2. Do not delete, replace, simplify, stub, mock or disable existing features to make the redesign easier.
3. Do not rewrite backend logic, database migrations, API contracts, authentication, permissions, consent logic, session/timer logic or persistence as part of this visual task.
4. Do not introduce breaking changes to props, types, storage keys, routes, event names or data structures.
5. Keep the current responsive behavior and improve its visual polish without losing iPhone, Android, iPad, tablet or desktop support.
6. Preserve all current copy and product meaning unless a visual layout requires a small presentational adjustment. Do not invent new product promises, prices, subscription rules or functionality.
7. Keep all existing safety actions visible, legible and immediately accessible. PAUSE, PASS and STOP must never be hidden behind decorative elements, menus or animations.
8. Do not overwrite or redesign the approved logo files. Do not generate a replacement logo, redraw the monogram, approximate the crescent, substitute a generic moon icon or recreate the wordmark with ordinary text.
9. Do not replace existing approved brand artwork with stock imagery, emoji, cartoon illustrations or generic AI-generated BDSM imagery.
10. Make changes in small, coherent steps. Run the existing build and tests after implementation and fix any regressions caused by the visual work.

**Priority:** Preserve functionality and data first. Apply the new design through shared styles, design tokens, layout and component presentation.

---

## 2. Approved brand identity

AFTER HOURS must feel like a private, cinematic, premium after-dark experience: mysterious, elegant, intimate, adult, confident and carefully designed.

The approved visual world is:
- Deep black and aubergine as the foundation.
- Rich dark purple and violet as atmospheric color.
- Warm champagne gold and metallic gold for the signature details.
- Black velvet, purple velvet, subtle purple smoke, soft cinematic lighting and restrained gold reflections.
- Elegant editorial typography, deliberate spacing and a strong visual hierarchy.
- Premium, tactile surfaces rather than a generic SaaS dashboard.

The visual identity must remain sophisticated and restrained. Avoid cheap fetish styling, explicit imagery, pink-heavy styling, childish game graphics, generic corporate dashboards, excessive neon, rainbow gradients, loud glows, random decorative symbols and visual clutter.

### Approved logo and wordmark

Use the existing approved AFTER HOURS brand asset already present in the project, beginning with:
- `public/after-hours-logo.svg`
- Existing AFTER HOURS app icon assets in `public/`

Inspect the available assets and use the correct existing approved asset in each context. Keep the official gold crescent and AH monogram intact, including its original proportions, ornamental detail, geometry and wordmark treatment.

Use:
- Full primary logo for splash, welcome/intro, major brand moments and suitable large-format placements.
- Compact AH monogram for app navigation, profile/avatar details, small badges and compact placements.
- Existing app icon for PWA/app-icon contexts.

Never stretch, crop, recolor, redraw, distort or rebuild the approved logo. Maintain its original aspect ratio and clear space. The logo should be visible but never dominate functional screens. Do not create a competing second logo.

Official brand assets and branding lockups use English only. The app itself must continue to support English and Dutch, with English as the default. Preserve the existing language selection and translation behavior.

### Approved tagline

**YOUR RULES. YOUR LIMITS. YOUR EXPERIENCE.**

Use it only in suitable brand moments such as the intro, splash or welcome area. Do not repeat it on every screen.

---

## 3. Locked color system

Create or consolidate one central set of CSS design tokens. Remove inconsistent one-off color values where safe, and make all components use the same shared tokens.

Use this approved design-first palette:

| Token | Color | Use |
|---|---|---|
| Obsidian | `#070509` | Main app background |
| Deep Black | `#100712` | Main panels and dark surfaces |
| Aubergine | `#180A20` | Raised cards and navigation surfaces |
| Velvet Plum | `#291033` | Secondary panels, depth and borders |
| Royal Violet | `#6D168F` | Selected states and controlled accents |
| Amethyst | `#8E24B7` | Restrained atmospheric highlights |
| Antique Champagne | `#C89445` | Muted metallic details |
| Warm Gold | `#D7A84F` | Primary brand accent, borders and icons |
| Light Gold | `#F3C96B` | Important highlights and primary actions |
| Warm Ivory | `#F4EBDD` | Main text on dark surfaces |

Additional semantic tokens:
- Secondary text: a muted warm grey-lilac with sufficient contrast.
- Subtle borders: translucent warm gold or plum, never harsh white.
- Success: restrained, recognizable muted green.
- Warning: warm amber.
- Danger/STOP: a clearly recognizable deep red/coral danger treatment, never gold or purple alone.

The earlier approved reference colors `#0B0B0B`, `#2A0E2F` and `#6B1F6B` remain part of the same black/aubergine/violet visual direction. Reconcile them with the locked tokens above rather than introducing a second competing palette.

Do not use gold for every element. Gold is the signature accent. Purple provides atmosphere and depth. Ivory is for readable content. Keep the overall interface predominantly dark.

---

## 4. Typography

Create a consistent typography hierarchy:
- Official logo/wordmark: use the approved supplied asset unchanged. Its original letterforms must not be recreated.
- Main editorial headings and rank names: elegant high-contrast serif, refined and cinematic.
- Body copy, descriptions, labels, controls and forms: clean, highly readable modern sans-serif.
- Small uppercase labels: restrained letter spacing and consistent sizing.
- Numbers, timer, XP and level values: clear, stable and highly legible.

The current project uses Cinzel and DM Sans. Inspect the current implementation and retain/refine these where they fit the approved visual direction. Do not change typography randomly between screens. Avoid tiny body text, overly wide tracking in paragraphs and long all-caps blocks.

---

## 5. Surface, card and component language

Apply one coherent component system across the application:

### Backgrounds
- Near-black base with subtle deep-purple atmospheric gradients.
- Optional restrained velvet/smoke texture only on major hero or brand areas.
- Avoid busy backgrounds behind text, forms, timers or controls.
- Use subtle radial light and soft vignette effects to create depth.

### Cards and panels
- Deep aubergine/black surfaces with clear visual separation.
- Fine warm-gold or plum borders.
- Soft, controlled shadow and occasional subtle inner glow.
- Consistent corner radius, padding and spacing.
- Use layered surfaces to establish hierarchy, not a stack of identical boxes.
- Premium glass-like translucency only where it improves clarity.

### Buttons and controls
- Primary action: warm gold/champagne treatment with strong readable contrast.
- Secondary action: dark transparent surface with a subtle plum/gold border.
- Selected state: restrained violet glow or gold edge, clearly visible.
- Destructive action: unmistakable danger color and clear label.
- All buttons and touch targets remain comfortable on mobile.
- Hover, focus, pressed, disabled and loading states must be designed consistently.
- Keyboard focus must remain clearly visible.

### Icons
- Use one consistent icon family and stroke weight.
- Use gold for meaningful brand/feature accents, not every icon.
- Do not mix emoji, random icon packs and unrelated illustration styles.
- Preserve recognizable safety iconography.

### Motion
- Use restrained cinematic transitions: short fades, gentle reveals and subtle glow transitions.
- Avoid constant pulsing, excessive particles, spinning ornaments or long blocking animations.
- Respect `prefers-reduced-motion`.
- Motion must never delay or block PAUSE, PASS, STOP, consent or navigation.

---

## 6. Whole-app visual implementation scope

Audit and visually update every existing screen, not just the home screen. This includes the main application shell and all current modules/components, including (where present in the current branch):

- Main app shell, header, navigation and page transitions in `src/main.tsx`.
- Splash, age gate, welcome/intro and teaser.
- Home/dashboard and experience entry points.
- Story, Random, Surprise, Custom and Boss experience modes.
- Active experience screen, command cards, round progress and timer.
- Pause, pass, stop and session-completion states.
- Consent, safety readiness, safety plan and safety control room.
- Aftercare, mood check-in and mood history.
- Profile, avatar, character selection/customization and rank progression.
- XP, achievements, badges, collections and unlock states.
- Daily experience, missions and prompt/command library.
- Tarot, horoscope, insights and other discovery/insight screens.
- Radio room and audio controls.
- Private media vault and media upload/viewing states.
- Lovense control screen and connection/status states.
- Social studio and shareable branded assets.
- Monetization and membership-related screens, preserving current business logic and copy.
- Legal center, settings, language selection and account screens.
- Admin dashboard, character studio, badge showcase and all admin tools.
- Loading, empty, error, offline, success, confirmation and recovery states.

Inspect the actual current source tree before implementation. Do not assume every item above has a separate route. Update the existing implementation where it lives; do not create duplicate screens just to match this list.

### Main home/dashboard
- Give the screen a clear premium hero area with the approved brand identity used at an appropriate scale.
- Make the primary experience action unmistakable.
- Present secondary features as a curated collection of elegant feature cards.
- Keep consent/safety status visible and easy to understand without making the screen feel clinical.
- Ensure the dashboard feels like entering a private digital experience, not opening an admin panel.

### Experience and game screens
- Use cinematic command presentation with strong hierarchy.
- Keep the timer, round progress and current task readable at a glance.
- Make PAUSE, PASS and STOP consistently positioned and immediately available.
- Use gold for progress/reward and restrained purple for atmosphere.
- Keep safety information visually clear and never subordinate it to decoration.

### Profile, levels and ranks
- Give the profile a premium identity treatment with the compact AH mark where appropriate.
- Make rank, level, XP and progress visually meaningful.
- Give the seven approved ranks a coherent visual progression:
  1. THE CURIOUS
  2. THE INITIATE
  3. THE DEVOTED
  4. THE DISCIPLINED
  5. THE ENTHRALLED
  6. THE BOUND
  7. AFTER HOURS
- Use increasingly refined frames, gold detailing and violet atmosphere as visual rewards. Do not alter rank names, thresholds, XP or progression logic.
- Keep achievement and collection cards consistent with the same rank/brand system.

### Tarot, Horoscope and Insights
- Treat these as premium editorial experiences.
- Use dark, atmospheric surfaces, elegant typography and subtle ornamental details.
- Make cards feel tactile and considered.
- Avoid generic horoscope templates, childish mystical clip art or excessive decorative stars.

### Radio room
- Create an atmospheric listening room with restrained purple light, warm gold details and clear playback controls.
- Keep playback state and controls readable and accessible.
- Do not alter audio functionality or add copyrighted music.

### Aftercare and safety
- Make these screens feel calm, grounded, reassuring and private while staying inside the AFTER HOURS design language.
- Use clear information hierarchy, readable text, generous spacing and unmistakable actions.
- Do not make safety feel like a decorative feature.
- Never hide or soften STOP, consent status, boundaries or safety controls.

### Media vault
- Use a discreet private-gallery visual language.
- Clearly distinguish photos, videos, audio and upload states.
- Preserve privacy, access rules and all existing storage behavior.
- Avoid exposing private media through decorative previews or unintended public links.

### Admin
- Use the same design system with a more information-dense but still premium layout.
- Tables, filters, forms, status labels and actions must be readable and consistent.
- Preserve every admin permission and existing workflow.

---

## 7. Responsive and accessibility requirements

The design must be polished at:
- Small iPhones and other narrow phones.
- Large iPhones and Android phones.
- iPad and Android tablets, portrait and landscape.
- Desktop and wide screens.

Requirements:
- No horizontal overflow.
- Respect safe-area insets.
- Keep navigation usable and consistent.
- Maintain readable font sizes and contrast.
- Keep touch targets comfortable.
- Avoid desktop layouts simply squeezed onto a phone.
- Use responsive spacing and purposeful breakpoints.
- Keep forms and cards easy to use on small screens.
- Respect reduced motion and keyboard navigation.
- Preserve semantic labels and accessible names for controls.
- Do not use color as the only way to communicate success, warning, danger or selection.

---

## 8. Implementation approach

1. Inspect the full existing project and identify the current shared CSS, app shell, page components and reusable UI elements.
2. Inspect the supplied logo and icon assets. Use the approved existing assets, not approximations.
3. Establish the shared CSS variables and consistent typography, surface, spacing, border, button, card and state tokens.
4. Update shared components and the main shell first.
5. Apply the same system to every existing screen and module listed above.
6. Check that each screen's loading, empty, error, selected, disabled and active states also match.
7. Remove conflicting legacy visual declarations only when safe. Do not remove functional styles, responsive rules or focus states.
8. Do not create a second competing design system or leave individual modules with their old unrelated appearance.
9. Keep changes scoped to presentation unless a tiny markup adjustment is essential to achieve the approved layout.
10. Run the existing production build and test suite. Fix all visual-change regressions before finishing.

If a requested visual treatment conflicts with an existing safety or accessibility requirement, safety and accessibility win. If a brand asset is missing or cannot be verified, preserve the current approved asset and do not fabricate a substitute.

---

## 9. Definition of done

This task is complete only when all of the following are true:

- [ ] The whole application uses one consistent approved AFTER HOURS visual identity.
- [ ] The palette is based on the locked black, aubergine, violet and warm-gold tokens.
- [ ] The official logo, crescent, AH monogram and wordmark remain unchanged.
- [ ] Main shell, navigation, home, experiences, profile, ranks, insights, radio, aftercare, safety, media, admin and all other existing modules have been visually reconciled.
- [ ] The interface feels premium, cinematic, mature, private and consent-first.
- [ ] No screen looks like an unrelated template or an unfinished legacy module.
- [ ] English and Dutch language support still works, with English as the default.
- [ ] Existing features, interactions, data, authentication, Supabase, session logic, timer, XP, ranks, media and safety controls still work.
- [ ] iPhone, Android, tablet and desktop layouts have been checked.
- [ ] Accessibility, reduced motion, contrast and touch targets have been checked.
- [ ] Production build and existing tests pass.
- [ ] A concise completion report lists the screens updated, files changed, build/test results and anything genuinely blocked.

**Do not respond that the task is complete merely because global colors or the homepage changed. Apply the full visual system across the existing app.**
