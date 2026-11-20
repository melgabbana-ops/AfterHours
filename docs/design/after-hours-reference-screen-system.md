# AFTER HOURS | Reference screen system

Status: design specification for the branch `design/reference-screen-system-nov-2026`.

## Visual contract

Use the uploaded ten-screen reference board as the visual north star:
- Obsidian / near-black surfaces, espresso shadows, warm bronze borders, champagne-gold highlights, ivory text.
- No purple, violet, magenta, aubergine or neon-pink accents.
- Cinematic, low-key photography with warm practical lights; keep text readable over images with dark overlays.
- Elegant editorial serif for page titles; restrained sans-serif for controls, labels and body copy.
- Thin metallic borders, subtle corner radii, restrained glow, generous spacing and touch targets of at least 44px.
- Keep the existing AFTER HOURS brand mark and real application behavior. Mockup imagery must never replace functional controls, consent logic, timer logic, account state or accessibility semantics.
- Mobile-first layout; respect iOS safe areas, Android viewport behavior, reduced-motion preferences, keyboard focus and desktop breakpoints.

## Ten reference screens and their application destinations

| Reference | Existing screen / feature | Page-specific composition |
|---|---|---|
| 01 Home | `home` | Editorial hero with AFTER HOURS mark, welcome/profile greeting, one dominant Start Experience action, four compact shortcuts, safety/consent status and persistent bottom navigation. |
| 02 Consent & Safety | `safety` and consent gate | Dark photographic header, plain-language consent checklist, boundary editor entry, explicit consent action and always-visible revoke/stop affordance. Consent is never pre-checked by the design. |
| 03 Experience | `game` | Focused session canvas, circular timer, pause and visually distinct stop controls, current task card, progress indicator and discreet safety access. |
| 04 Aftercare | `aftercare` | Calm candlelit hero, hydration / relaxation / grounding / music / talk / notes options, selected-state feedback and a clear start-routine action. |
| 05 Completion | `complete` | Warm celebratory portrait/texture, earned XP and verified session/task/completion stats, concise reflection and continue action. Never fabricate progress values. |
| 06 Tarot | `insights` with initial tab `tarot` | Full-width editorial card artwork, draw/reveal action, readable interpretation and accessible card-reveal animation. |
| 07 Horoscope | `insights` with initial tab `astro` | Zodiac wheel or sign artwork, daily reading, selected sign and a full-reading action. Keep date and sign data real. |
| 08 Radio | `radio` | Cinematic audio-room artwork, now-playing metadata, waveform, playback/volume controls only where supported, and a clear external Spotify hand-off where applicable. |
| 09 Profile | `profile` | Portrait/avatar, display name, role/rank, XP progress, verified session stats, Progress, Ranks, Settings, Privacy and Edit Profile destinations. |
| 10 Game Selection | `gameSelect` | Four image-led category cards (e.g. Discipline, Submission, Control, Sensory), concise descriptions, clear selected state and safe start action. |

## Additional application pages

Every route below receives its own composition while sharing the visual contract above. Do not force every page into the ten-screen template.

| Screen | Dedicated design direction |
|---|---|
| `onboarding` | Step-based welcome and account setup, age confirmation, privacy explanation and progress indicator. |
| `prompts` | Editorial prompt library with category filters, searchable prompt cards, detail view and save/favourite state. |
| `store` | Premium catalogue with product/benefit cards, transparent prices and clear purchase state; do not imply a payment provider is configured unless it is. |
| `admin` | Operational dashboard with compact metric cards, user/session moderation tables and clear destructive-action confirmation. |
| `controlroom` | Session-control workspace with participant/status panels, consent summary and prominent pause/stop controls. |
| `missions` | Mission catalogue with category chips, difficulty, duration, progress and completion states. |
| `legal` | Calm reading layout with document navigation, section hierarchy, updated-date metadata and print-friendly styling. |
| `social` | Profile/content cards with privacy-first sharing controls and explicit visibility states. |
| `lovense` | Device connection and control panel with connection status, supported controls, safe stop and clear disconnected/error states. |
| `daily` | Daily check-in and reflection dashboard with mood selection, short prompts and history access. |
| `capture` | Focused media-capture/upload workflow with preview, permissions, progress, retry and delete confirmation. |
| `admin / business tools` | Role-gated, data-dense workspace distinct from the consumer-facing cinematic pages. |

## Shared component rules

- Primary action: champagne-gold fill with dark text; secondary action: transparent dark surface with bronze outline.
- Stop/destructive action: reserved muted red, never gold; confirm destructive actions.
- Cards: near-black/espresso surface, fine bronze border, subtle warm image overlay.
- Status: text + icon, never color alone.
- Navigation: fixed mobile bottom bar with Home, Games, Experience, Radio and More; selected destination receives gold emphasis.
- Image treatment: use per-page artwork as a background/hero layer, never as a flattened screenshot of the whole interface.
- Keep all text, buttons, controls, values and dynamic data as real DOM/React components. The generated PNG mockups are reference assets only.

## Asset pack

The generated design asset pack contains the overview sheet and ten cropped PNG references:
`01-home.png`, `02-consent-safety.png`, `03-experience-session.png`, `04-aftercare.png`, `05-experience-complete.png`, `06-tarot.png`, `07-horoscope.png`, `08-radio.png`, `09-profile.png`, `10-game-selection.png`.

The image pack is supplied separately in the conversation. Before adding binary images to `public/design-reference/`, review each crop and confirm the repository asset-size budget. The images are visual references, not production page screenshots or finished UI components.

## Acceptance checklist

- [ ] Each listed route has a distinct page composition, not just a shared generic card layout.
- [ ] No purple/violet/magenta pixels or tokens are introduced.
- [ ] Consent, safety, pause, stop, auth, privacy, XP and session values remain connected to existing state and backend behavior.
- [ ] Every route works at 320px, 375px, 390px, 430px, tablet and desktop widths.
- [ ] Fixed navigation does not cover content; safe-area insets are respected.
- [ ] Keyboard focus, screen-reader labels, contrast and reduced-motion behavior are retained.
- [ ] `npm test` and `npm run build` pass in GitHub Actions.
- [ ] Preview is checked on a real iPhone and Android viewport before merge.
