# AFTER HOURS | Visual system implementation

Source of truth:
- Design tokens and page registry: `src/design-system/after-hours.design.ts`
- Shared visual layer loaded by the app shell: `public/after-hours-design.css`
- Approved logo asset: `public/after-hours-logo.svg`

## Brand and art direction
Use a cinematic, premium black and aubergine foundation, restrained warm gold for hierarchy and calls to action, and selective neon-purple light for active states. Display typography uses Cinzel with a serif fallback; body copy uses DM Sans with a system sans-serif fallback. Use layered dark cards, subtle gold borders, generous spacing and carefully limited glow. Avoid applying neon to every element.

## Official logo
Always use the approved asset at `/after-hours-logo.svg`. Do not redraw, replace, or approximate it with text or generated artwork. Preserve the source asset unchanged. On brand-gate pages, size it responsively and preserve its aspect ratio.

## Page-specific design map
- Intro / age gate: centered cinematic brand gate, logo, Dutch copy, clear 18+ action and legal information.
- Home: personalized dashboard, prominent start action, mood check and tidy feature shortcut grid.
- The Deck: filter chips and separate experience cards with category, intensity, duration and selection state.
- Active experience: progress hierarchy, readable timer, pause and unmistakable stop control.
- Safety: clear consent, boundaries, safeword, check-in and stop controls.
- Radio Room: immersive player, track metadata, transport controls, volume and mood selection.
- Character Studio: preview area, grouped customization options and save action.
- Missions: category filters, progress, rewards and completion state.
- Tarot / Horoscope / Insights: distinct editorial card layouts and tab states.
- Media Vault: upload affordance, private media grid, consent and locked states.
- Profile: rank, XP, achievements and grouped account actions.
- Settings: calm grouped rows and privacy/account sections.
- Daily Ritual: one focused daily practice with streak and completion state.
- Social Studio: editor/preview hierarchy and copy/export actions.

## Shared implementation contract
1. Reuse the central tokens rather than duplicating colors and spacing values.
2. Apply styles to real routed components, not just to a promotional image.
3. Preserve current routing, component behavior, consent and safety logic.
4. Mobile-first: safe-area-aware layout, visible focus states, minimum 44px touch targets, reduced-motion support.
5. Build and test after integration changes.
6. A successful build does not prove visual parity. Verify the actual deployed mobile UI before claiming the redesign is live.
