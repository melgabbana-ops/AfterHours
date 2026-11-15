# AFTER HOURS visual and functional audit

## Approved visual direction
- Deep black and warm near-black surfaces.
- Champagne-gold and bronze accents, fine ornamental borders, cinematic photography and refined serif headings.
- No purple interface palette in the approved experience.
- Mobile-first layout with safe-area spacing and compact screen rhythm.

## Changes in this branch
- Applied a final black/champagne design layer across core screens, cards, controls, focus states and responsive layouts.
- Updated the AFTER HOURS wordmark, crown emblem and matching PNG iOS/PWA icon artwork using the supplied 512 × 512 source image.
- Refined Character Studio with a more mature editorial portrait illustration. All original customization controls remain: presentation, skin tone, hair colour/style, outfit, mask, collar/chain detail and accessories. Palette labels now match the black/bronze direction. Character appearance is saved locally per profile on the device.
- Added the supplied Spotify playlist as a branded external action. The app itself does not render Spotify profile metadata or the account avatar.
- Added an original four-note locally synthesized AFTER HOURS notification signature with separate message, check-in and safety variants.
- Updated Kinky Tarot and Oracle card reveals, branded card faces, corrected localization in three-card spreads and added a staggered reveal animation for the three-card layout.
- Tightened mobile layouts and safe-area spacing; added cinematic image treatments using the committed AFTER HOURS visual assets.\n- Localized Dutch navigation, mission categories, mission descriptions, Lovense emergency-stop label and PWA home-screen shortcut labels.\n- Made the three-card Tarot spread remount each draw so the staggered reveal animation replays reliably.
- Refined Dutch navigation labels and mission copy for more natural wording.

## Existing features reviewed in source
- Kinky Tarot: 12 BDSM/consent-oriented reflection cards, single-card draw and three-card spread.
- Oracle: six reflective prompts and random draw.
- Astrology: date-based zodiac selection and daily reflection.
- Session experience: consent gate, rounds, timer, pause/stop, check-ins and aftercare are present in the existing app flow.
- Radio: opens the supplied playlist externally without rendering Spotify account identity inside AFTER HOURS.

## Verification status
- GitHub Actions **AFTER HOURS build** passed on commit `fddc10a0d245cc1b2a5da8f1e5c7505e44d3c046`, including dependency audit, reproducible dependency install, Supabase migration ledger check, canonical brand asset check, unit tests and production build.
- GitHub Actions **AFTER HOURS Build Watch** also passed on that commit.
- The subsequent commits after `e18851f705ed7053bb8bc9a27107d599e11cc943` contain mission and navigation copy, PWA shortcut labels, Character Studio palette labels, a Tarot reveal replay fix and a Lovense stop-label correction. Their own workflow result has not yet been confirmed.
- Vercel reports a build-rate-limit / upgrade prompt. GitHub Actions is the independent build and test route; no paid Vercel upgrade, deployment action or production release was initiated.
- No physical iPhone visual test has been performed. A successful browser build does not prove every screen has been visually verified on-device.
- PR #97 remains a draft on the review branch. Do not merge or publish without explicit approval.

## Important platform limits
- Web Audio is unlocked after a user gesture and plays while the app is active. A browser/PWA cannot promise a custom iOS system push-notification sound when the app is suspended. That requires a native notification implementation and platform-specific notification assets.
- Spotify opens externally rather than embedding the playlist. AFTER HOURS itself does not render profile metadata, but Spotify may still show the playlist owner. Full separation requires a separate AFTER HOURS Spotify account and a playlist owned by that account.
- The app uses the committed AFTER HOURS photo assets in its interface. The uploaded icon artwork is used for app branding, not as a replacement for every in-app photograph.
- iOS may cache an earlier home-screen icon; reinstalling the PWA may be needed to refresh it.
