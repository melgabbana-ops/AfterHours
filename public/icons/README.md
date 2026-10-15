# AFTER HOURS seasonal icon artwork

The default browser favicon now uses `after-hours-master.svg`; the browser tab selects a seasonal or holiday SVG by local date. The PWA manifest includes that master SVG while retaining the existing 192×192 and 512×512 PNG files as compatibility fallbacks.

**Important platform distinction:** the date-based switch affects the browser-tab favicon only. iOS home-screen icons and Android installed-app icons remain the existing PNG assets. Seasonal installed icons require separate raster exports, safe-zone review, and device testing before being enabled.

- `after-hours-master.svg`
- `after-hours-spring.svg`
- `after-hours-summer.svg`
- `after-hours-autumn.svg`
- `after-hours-winter.svg`
- `after-hours-halloween.svg`
- `after-hours-christmas.svg`
- `after-hours-valentines.svg`
- `after-hours-new-year.svg`

The SVGs are first-pass, brand-inspired artwork and are not a pixel-exact replacement for the approved master logo. Review the artwork at small sizes and against the approved source before final release.

**Master artwork rule:** `after-hours-master.svg` is an exact copy of the approved `public/after-hours-logo.svg`. Do not redraw, regenerate, or stylize the master mark. Seasonal browser favicons may use seasonal art, but the canonical master and core app logo must remain the approved artwork.
