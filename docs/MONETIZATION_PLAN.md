# AFTER HOURS — Monetization Plan

Status: OFFER AND PRICING UI IMPLEMENTED; CHECKOUT NOT LIVE.

## Principles
- Start at €0 with no mandatory subscription.
- No ads.
- Consent, boundaries, Pause, PASS, STOP, the safety plan and aftercare remain available without payment.
- Use one-time purchases for optional premium experiences.
- Never make rank progression, safety, consent or stopping power pay-to-win.
- Do not ship private PayPal/Tikkie as a substitute for a compliant production checkout.
- Select a payment provider only after confirming in writing that it explicitly permits adult BDSM-related digital experiences/content.
- Payment creation, confirmation, refunds and entitlements must be server-side; never trust client-side success or expose service-role secrets.

## Offers
1. **Free Access — €0**
   - Account/profile and a safe introduction.
   - Consent and safety tools, Pause/PASS/STOP, aftercare.
   - Core insights and an introductory experience.
2. **Single Experience — €9.99**
   - One selected premium interactive experience.
   - Multi-round flow, timer and progress.
   - Consent and aftercare included.
3. **The 3-Game Collection — €24.99**
   - Three selected premium experiences.
   - Three separate games at the bundle price.
   - Three singles cost €29.97; the bundle saves €4.98 (about 16.6%).
4. No required subscription and no automatic renewal.

## Initial validation goal
Aim for the first 25 paying customers before adding recurring plans or complex upsells. This is a validation target, not a forecast.

Illustrative gross revenue before payment fees, refunds, tax and other costs:
- 25 single purchases: 25 × €9.99 = €249.75.
- 25 bundle purchases: 25 × €24.99 = €624.75.
- A 50/50 mix rounded to 12 singles and 13 bundles: €119.88 + €324.87 = €444.75.

These are scenarios only, not guaranteed earnings.

## Implemented in the app
- A bilingual Collections & Pricing screen with Free Access, Single Experience and The 3-Game Collection.
- Transparent prices and bundle savings.
- Interest buttons save only a local preference on that device and explicitly state that no payment has started.
- The screen explains that payment checkout is not live and that safety is not behind a paywall.

## Required before taking real money
1. Choose a payment provider that explicitly allows the content category and the seller's legal setup.
2. Complete the required seller/tax/legal checks for the Netherlands and the markets served.
3. Implement server-side checkout sessions, verified signed webhooks, idempotency and refund handling.
4. Create server-side entitlements for each single game and the three-game bundle. Never unlock a purchase from a client redirect alone.
5. Store only the minimum order metadata needed; keep payment records separate from private session notes and safety reports.
6. Add a clear purchase confirmation, terms, privacy notice, cancellation/refund policy and support route.
7. Test successful payment, canceled checkout, failed payment, duplicate webhook, refund, account switching, restore-purchase and network failure.
8. Only then replace the local-interest buttons with real checkout actions.

## Next-stage experiments (not currently charged or enabled)
- A free introductory experience to demonstrate quality.
- The 3-game bundle as the default highlighted offer.
- Optional future seasonal cosmetic collections, avatar frames and Oracle-card designs, provided progression remains non-pay-to-win.
- No subscription until repeat usage and willingness to pay have been validated with real customers.
