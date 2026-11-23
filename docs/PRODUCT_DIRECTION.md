# AFTER HOURS product direction

**Locked on 24 November 2026.** This document is the current source of truth for design and product acceptance. It supersedes earlier palette instructions in old prompts, archived briefs, branches and pull requests.

## Brand and visual system

- Base: obsidian black and warm near-black (#050505, #090807).
- Surfaces: charcoal and warm dark brown-black (#100D0A, #17120C, #20170E).
- Signature accents: champagne and metallic gold (#C89445, #D7A84F, #F3D49A).
- Text: warm ivory and neutral warm greys (#F4EBDD, #E5D8C4, #B9AD9D).
- STOP/danger may use a clear semantic danger color. It must never be confused with a decorative brand accent.
- **No purple, aubergine, plum, violet or lilac anywhere in the interface.** This also prohibits purple smoke, glows, gradients, overlays, borders, selected states, rank effects and media frames.
- Use elegant serif display typography, clear sans-serif controls, fine gold borders, restrained warm highlights and dark photographic surfaces. Avoid over-decoration and preserve legible contrast.

## Product and interaction principles

- Mobile-first and responsive for iPhone/Safari, Android/Chrome, iPad and other tablets. Respect safe areas, touch target sizes, reduced-motion preferences, keyboard use and screen readers.
- Dutch is the default interface language. English remains available through a clear, persistent language selector; changing language must not reset consent, session state or user data.
- Consent is explicit, informed, voluntary, specific to the experience and revocable. No experience starts before the required consent is persisted and confirmed.
- PAUSE and STOP remain immediately available. STOP is authoritative and must not wait for animation, media upload or a remote request. Safewords and pause signals are private, profile-scoped, never sent to analytics, and must remain distinct from each other.
- Aftercare is supportive and non-judgmental. It never penalizes a pause, pass, stop or changed boundary.
- Keep private notes, mood history, media and account data owner-scoped. Do not claim encryption, remote deletion, synchronization or server protection unless verified in the actual implementation and backend policies.
- Use free, open-source and already available infrastructure. Prefer GitHub Actions and GitHub Pages. Do not add paid services, subscriptions, or new infrastructure without explicit approval.
- Never modify production data, secrets, accounts or live database configuration as part of ordinary feature work.

## Reference-screen interpretation

The supplied reference images are visual and information-architecture inspiration for Home, Consent & Safety, active Experience, Aftercare, Completion, Tarot, Horoscope, Radio, Profile & Ranks and Game Selection. They are not proof that every depicted interaction is implemented. Do not present sample timers, XP amounts, track names, profile identities or progress percentages as real user data. Use actual state or clearly labelled demo content.

## Change acceptance

Every change must preserve this direction, Dutch/English parity, accessibility, consent, safewords, privacy and mobile support. Add regression tests for the changed behavior, run the relevant checks and distinguish CI/build success from real-browser and physical-device verification.
