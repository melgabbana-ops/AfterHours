# AFTER HOURS — Brand Asset Lock

Status: APPROVED / REQUIRED FOR ALL BUILDS

## Official master logo

The approved AFTER HOURS master logo is the corrected centered version with:
- centered emblem and AFTER HOURS wordmark
- clean capital H with no decorative curl crossing the middle
- black / deep-purple / champagne-gold treatment
- exact proportions and composition approved by the product owner

Master PNG export:
https://photoshop-api.adobe.io/v2/short-url/urn:aaid:ps:US:faa8c9ac-1f67-4c32-abc2-71943c29162d

Adobe asset:
urn:aaid:sc:EU:f5da1501-9de7-468e-8aec-ee12a388a670

## Non-negotiable logo rules

1. This master logo is the single source of truth for AFTER HOURS branding.
2. All current and future app builds must use the approved logo.
3. Teaser videos, trailers, social assets, marketing assets, splash screens, loading screens, auth screens, profile surfaces and Control Room branding must use the same master.
4. Never regenerate, redraw, reinterpret or ask generative AI to recreate the logo.
5. Never alter the H, emblem geometry, typography, spacing, proportions or decorative elements.
6. Only controlled derivatives are allowed: transparent-background, light/dark presentation, icon/monogram and responsive size exports, all derived from the same master.
7. Any derivative must preserve the exact logo identity and must be visually QA-checked against the master.
8. A build is not release-ready if it contains an AI-generated or visually inconsistent logo.
9. When replacing an existing logo asset, the replacement must be propagated to every current logo reference before release review.
10. Video end cards and logo reveals must use the master asset as an overlay/source, never generated logo text.

## Release QA

Before every release:
- Search the codebase for legacy logo assets/references.
- Verify the rendered logo against the master.
- Verify teaser/trailer end cards.
- Verify responsive scaling and safe areas.
- Confirm no AI-generated logo remains in production-facing assets.
