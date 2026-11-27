# AFTER HOURS product direction

**Updated on 27 November 2026.** This document is the current source of truth for design and product acceptance. It supersedes earlier palette instructions in old prompts, archived briefs, branches and pull requests. The approved palette is black, charcoal, champagne-gold, white and warm grey only.

## Brand and visual system

- Base: obsidian black and warm near-black (#050505, #090807).
- Surfaces: black, warm charcoal and warm near-black (#050505, #100D0A, #17120C).
- Signature accents: champagne and metallic gold (#C89445, #D7A84F, #F3D49A).
- Text: warm ivory and neutral warm greys (#F4EBDD, #E5D8C4, #B9AD9D).
- Safety states, PAUSE and STOP use only the approved palette. Distinguish them through explicit labels, icons, placement, shape and border weight, never through an extra danger hue.
- **No purple, pink, rose, magenta, red, green, blue, aubergine, plum, violet or lilac anywhere in the interface.** This applies to text, icons, status indicators, smoke, glows, gradients, overlays, borders, selected states, rank effects and media frames.
- Use elegant serif display typography, clear sans-serif controls, fine gold borders, restrained warm highlights and dark photographic surfaces. Avoid over-decoration and preserve legible contrast.

## Product and interaction principles

- Mobile-first and responsive for iPhone/Safari, Android/Chrome, iPad and other tablets. Respect safe areas, touch target sizes, reduced-motion preferences, keyboard use and screen readers.
- Dutch is the default interface language. English remains available through a clear, persistent language selector; changing language must not reset consent, session state or user data.
- Consent is explicit, informed, voluntary, specific to the experience and revocable. No experience starts before the required consent is persisted and confirmed.
- PAUSE and STOP remain immediately available. STOP is authoritative and must not wait for animation, media upload or a remote request. The cold-open intro must expose direct safety access, PAUSE while a session is active and immediate STOP while a session is active or paused; those controls must not animate. Direct safety/STOP links bypass the intro. Privacy mode is a visual mask only, not a substitute for device security, authorization or encryption. Safewords and pause signals are private, profile-scoped, never sent to analytics, and must remain distinct from each other.
- Aftercare is supportive and non-judgmental. It never penalizes a pause, pass, stop or changed boundary.
- Keep private notes, mood history, media and account data owner-scoped. Do not claim encryption, remote deletion, synchronization or server protection unless verified in the actual implementation and backend policies.
- Use free, open-source and already available infrastructure. **GitHub Actions and GitHub Pages are the only approved CI/deployment path. Vercel is explicitly prohibited: do not configure, invoke, depend on, or add Vercel integrations, checks, actions, secrets, projects or deployments.** Do not add paid services, subscriptions or new infrastructure.
- Never modify production data, secrets, accounts or live database configuration as part of ordinary feature work.

## Screen identity and cold opening

Every screen has its own recognizable composition, information hierarchy, atmosphere and purpose-built components while sharing typography, spacing principles, navigation behavior, accessibility and the approved palette. Do not reuse one generic card grid for every screen.

- Dashboard: editorial command center with a clear next action and concise status.
- Experience Engine: immersive scene stage and active experience controls.
- Director’s Room: split composition for scene design and saved scenes.
- Black Vault: private archive with a locked-entry and encrypted-record hierarchy.
- Sensory Lab: spacious sound-control console.
- Secret Invitation: invitation-led composition with preview, acceptance and a clear history.
- Dominion: personal dynamics dossier with boundaries prominent.
- Ritual Deck: focused card-reveal stage and a separate creation/history area.
- Midnight Club: membership overview, real progress and milestones.
- Profile: identity dossier, progress and private media.
- Settings: preference index for language, privacy, motion and account access.
- Consent, Safety and Aftercare: dedicated layouts that prioritize clarity, immediate control and calm recovery.
- Administration: restricted management console with explicit loading, unavailable, denied and empty states.

The normal cold opening shows a restrained cinematic intro with the 18+ self-declaration integrated into its entry action; the dashboard remains inaccessible until that declaration is made. It appears once per app opening, not on internal navigation. Direct safety and STOP routes bypass it. The intro uses no flashing or distracting motion and respects reduced-motion preferences.

## Reference-screen interpretation

The supplied reference images are visual and information-architecture inspiration for Home, Consent & Safety, active Experience, Aftercare, Completion, Tarot, Horoscope, Radio, Profile & Ranks and Game Selection. They are not proof that every depicted interaction is implemented. Do not present sample timers, XP amounts, track names, profile identities or progress percentages as real user data. Use actual state or clearly labelled demo content.

## Change acceptance

Every change must preserve this direction, Dutch/English parity, accessibility, consent, safewords, privacy and mobile support. Add regression tests for the changed behavior, run the relevant checks and distinguish CI/build success from real-browser and physical-device verification.
