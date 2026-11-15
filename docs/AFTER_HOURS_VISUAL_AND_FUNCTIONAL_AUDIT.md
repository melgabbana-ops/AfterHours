# AFTER HOURS visual and functional audit

## Approved visual direction
- Deep black and warm near-black surfaces.
- Champagne-gold and bronze accents, fine ornamental borders, cinematic photography and refined serif headings.
- No purple interface palette in the approved experience.
- Mobile-first layout with safe-area spacing and compact screen rhythm.

## Changes in this branch
- Applied a final black/champagne design layer across core screens, cards, controls, focus states and responsive layouts.
- Updated the AFTER HOURS wordmark, crown emblem and matching PNG iOS/PWA icon artwork using the supplied 512 × 512 source image. The PWA manifest uses a scalable SVG icon declared at 192 × 192 plus the 512 × 512 PNG maskable icon; the mislabeled duplicate PNG was removed.
- Refined Character Studio with a more mature editorial portrait illustration. Feminine and masculine presentation now have distinct facial contours and details. All original customization controls remain: presentation, skin tone, hair colour/style, outfit, mask, collar/chain detail and accessories. Stored appearance values are normalized against approved options to avoid invalid or malformed local settings. Character appearance is saved locally per profile on the device.
- Added the supplied Spotify playlist as a branded external action. The app itself does not render Spotify profile metadata or the account avatar.
- Added an original four-note locally synthesized AFTER HOURS notification signature with separate message, check-in and safety variants.
- Updated Kinky Tarot and Oracle card reveals, branded card faces, corrected localization in three-card spreads and added a staggered reveal animation for the three-card layout.
- Tightened mobile layouts and safe-area spacing; added cinematic image treatments using the committed AFTER HOURS visual assets.
- Localized Dutch navigation, mission categories, mission descriptions, Lovense emergency-stop label and PWA home-screen shortcut labels.
- Made the three-card Tarot spread remount each draw so the staggered reveal animation replays reliably.\n- Connected horoscope shortcuts to open the astrology tab directly, and Tarot shortcuts to open Tarot directly rather than dropping users into whichever tab was last selected.

## Existing features reviewed in source
- Kinky Tarot: 12 BDSM/consent-oriented reflection cards, single-card draw and three-card spread.
- Oracle: six reflective prompts and random draw.
- Astrology: date-based zodiac selection and daily reflection.
- Session experience: consent gate, rounds, timer, pause/stop, check-ins and aftercare are present in the existing app flow.
- Radio: opens the supplied playlist externally without rendering Spotify account identity inside AFTER HOURS.

## Verification status
- GitHub Actions **AFTER HOURS build** and **AFTER HOURS Build Watch** both passed on the latest verified code commit `8d5dd9bf18d874e4cc2d700602932c4ecf99283b`.
- The successful run included a clean dependency audit (0 reported vulnerabilities), reproducible dependency install, Supabase migration ledger check, canonical brand asset check, all 151 unit tests and the production build.\n- Follow-up Character Studio appearance validation tests cover valid options, malformed stored values and rejected CSS-like values. CI passed on commit `595bf29526ee6800c10b1d334a9284cde652a53d` after the Character Studio and PWA icon guard changes. The subsequent direct-tab navigation changes are awaiting their own CI result.
- An intermediate build exposed a literal escaped newline in the Tarot spread state declaration. The issue was fixed in `8d5dd9b`; the latest build and test workflows completed successfully.
- Vercel reports a build-rate-limit / upgrade prompt. GitHub Actions is the independent build and test route; no paid Vercel upgrade, deployment action or production release was initiated.
- No physical iPhone visual test has been performed. A successful browser build does not prove every screen has been visually verified on-device.
- PR #97 remains a draft on the review branch. Do not merge or publish without explicit approval.

## Important platform limits
- Web Audio is unlocked after a user gesture and plays while the app is active. A browser/PWA cannot promise a custom iOS system push-notification sound when the app is suspended. That requires a native notification implementation and platform-specific notification assets.
- Spotify opens externally rather than embedding the playlist. AFTER HOURS itself does not render profile metadata, but Spotify may still show the playlist owner. Full separation requires a separate AFTER HOURS Spotify account and a playlist owned by that account.
- The app uses the committed AFTER HOURS photo assets in its interface. The uploaded icon artwork is used for app branding, not as a replacement for every in-app photograph.
- iOS may cache an earlier home-screen icon; reinstalling the PWA may be needed to refresh it.
