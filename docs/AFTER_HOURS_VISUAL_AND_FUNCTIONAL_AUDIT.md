# AFTER HOURS visual and functional audit

## Approved visual direction
- Deep black and warm near-black surfaces.
- Champagne-gold and bronze accents, fine ornamental borders, cinematic photography and refined serif headings.
- No purple interface palette.
- Mobile-first layout with safe-area spacing and compact screen rhythm.

## Changes in this branch
- Replaced the final violet palette layer with a black/champagne design lock.
- Updated the AFTER HOURS wordmark, crown emblem and matching PNG iOS/PWA icons.
- Added photo-led Character Atelier and profile identity.
- Added the supplied Spotify playlist as a branded external action. The app itself does not render Spotify profile metadata.
- Replaced the earlier notification motif with an original four-note locally synthesized AFTER HOURS signature and separate message, check-in and safety variants.
- Updated Kinky Tarot and Oracle card reveals, and corrected localization in three-card spreads.
- Tightened mobile layouts and safe-area spacing.

## Existing features reviewed
- Kinky Tarot: 12 BDSM/consent-oriented reflection cards, single-card draw and three-card spread.
- Oracle: six reflective prompts and random draw.
- Astrology: date-based zodiac selection and daily reflection.
- Session experience: consent gate, rounds, timer, pause/stop, check-ins and aftercare are present in the existing app flow.
- Radio: opens the supplied playlist externally.

## Important platform limits
- Web Audio is unlocked after a user gesture and plays while the app is active. A browser/PWA cannot promise a custom iOS system push-notification sound when the app is suspended. That requires a native notification implementation and platform-specific notification assets.
- Spotify playlist embeds and Spotify itself can expose creator metadata. The app uses a custom branded link instead of an embed. Full separation requires a separate AFTER HOURS Spotify account and a playlist owned by that account.
- The supplied images are treated as visual references; the app uses its existing licensed/committed AFTER HOURS photo assets in the UI.

## Verification
- Run the GitHub Actions build and test workflows for this branch before merging.
- Confirm iOS home-screen icon appearance after reinstalling the PWA; iOS may cache an earlier icon.
- Test the notification motif on a real iPhone after the first tap unlocks audio.
