# AFTER HOURS visual and functional audit

## Approved visual direction
- Deep black and warm near-black surfaces.
- Champagne-gold and bronze accents, fine ornamental borders, cinematic photography and refined serif headings.
- No purple interface palette.
- Mobile-first layout with safe-area spacing and compact screen rhythm.

## Changes in this branch
- Replaced the final violet palette layer with a black/champagne design lock.
- Updated the AFTER HOURS wordmark, crown emblem and matching PNG iOS/PWA icons using the supplied 512 × 512 icon artwork.
- Refined the Character Studio portrait and retained its customization controls: character presentation, skin tone, hair colour and style, outfit, mask, collar/chain detail and accessories. Character appearance is saved locally per profile on the device.
- Added the supplied Spotify playlist as a branded external action. The app itself does not render Spotify profile metadata or the account avatar.
- Replaced the earlier notification motif with an original four-note locally synthesized AFTER HOURS signature and separate message, check-in and safety variants.
- Updated Kinky Tarot and Oracle card reveals, branded card faces and corrected localization in three-card spreads.
- Tightened mobile layouts and safe-area spacing; added cinematic image treatments using the committed AFTER HOURS visual assets.

## Existing features reviewed
- Kinky Tarot: 12 BDSM/consent-oriented reflection cards, single-card draw and three-card spread.
- Oracle: six reflective prompts and random draw.
- Astrology: date-based zodiac selection and daily reflection.
- Session experience: consent gate, rounds, timer, pause/stop, check-ins and aftercare are present in the existing app flow.
- Radio: opens the supplied playlist externally without rendering Spotify account identity inside AFTER HOURS.

## Verification status
- GitHub Actions workflow **AFTER HOURS build** completed successfully on commit `943ed6661dd2b6983d22a8045db9426f4cf15358`.
- GitHub Actions workflow **AFTER HOURS Build Watch** completed successfully on the same commit.
- The Vercel status checks failed because the connected Vercel project reported a build-rate-limit / upgrade prompt. No paid upgrade, deployment action or production release was initiated.
- No physical iPhone visual test has been performed. A browser build passing does not prove every screen has been visually verified on-device.
- Keep this work on the review branch until the Vercel limit is resolved and a manual iPhone/PWA pass is completed.

## Important platform limits
- Web Audio is unlocked after a user gesture and plays while the app is active. A browser/PWA cannot promise a custom iOS system push-notification sound when the app is suspended. That requires a native notification implementation and platform-specific notification assets.
- Spotify playlist embeds and Spotify itself can expose creator metadata. The app uses a custom branded link instead of an embed. Full separation requires a separate AFTER HOURS Spotify account and a playlist owned by that account.
- The app uses the committed AFTER HOURS photo assets in its interface. The uploaded icon artwork is used for the app icon, not as a replacement for every in-app photograph.
- iOS may cache an earlier home-screen icon; reinstalling the PWA may be needed to refresh it.
