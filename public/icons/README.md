# AFTER HOURS icon artwork

The canonical scalable app mark is `after-hours-master.svg`. It is the exact vector monogram artwork in `public/after-hours-logo.svg`. The approved full brand lockup is a separate asset at `public/after-hours-brand-logo.svg`; it must not be replaced by the monogram.

The browser tab can select a seasonal or holiday SVG by local date. The PWA manifest uses the canonical mark for scalable SVG entries and retains the existing 192×192 and 512×512 PNG files as compatibility fallbacks. The iOS home-screen touch icon remains the dedicated 180px PNG.

**Platform distinction:** the date-based switch affects the browser-tab favicon only. iOS home-screen icons and Android installed-app icons remain the existing PNG assets. Seasonal installed icons require separate raster exports, safe-zone review, and device testing before being enabled.

Seasonal browser favicon artwork:
- `after-hours-spring.svg`
- `after-hours-summer.svg`
- `after-hours-autumn.svg`
- `after-hours-winter.svg`
- `after-hours-halloween.svg`
- `after-hours-christmas.svg`
- `after-hours-valentines.svg`
- `after-hours-new-year.svg`

These seasonal SVGs are first-pass, brand-inspired artwork and are not pixel-exact replacements for the approved full brand lockup. Review artwork at small sizes and against the approved source before release.

**Master artwork rule:** `after-hours-master.svg` must remain an exact copy of `public/after-hours-logo.svg`. Do not redraw, regenerate, or stylize the master mark. Keep the separate full lockup at `public/after-hours-brand-logo.svg` intact. Seasonal browser favicons may use seasonal art, but neither canonical asset should be replaced by seasonal artwork.
