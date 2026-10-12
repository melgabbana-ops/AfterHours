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
4. Optional AFTER HOURS Club membership is proposed at €8.99/month or €79.99/year. These are draft prices for validation, not active offers. Recurring billing stays disabled until processor underwriting, legal review, server-side entitlements, renewal disclosure and self-serve cancellation work end to end.

## Initial validation goal
Aim for the first 25 paying customers before adding recurring plans or complex upsells. This is a validation target, not a forecast.

Illustrative gross revenue before payment fees, refunds, tax and other costs:
- 25 single purchases: 25 × €9.99 = €249.75.
- 25 bundle purchases: 25 × €24.99 = €624.75.
- A 50/50 mix rounded to 12 singles and 13 bundles: €119.88 + €324.87 = €444.75.

These are scenarios only, not guaranteed earnings.

## Implemented in the app
- A bilingual Collections & Pricing screen with Free Access, Single Experience and The 3-Game Collection.
- An optional Club membership proposal: €8.99/month and €79.99/year (draft prices, no active checkout). Interest is stored locally only.
- Daily After Hours provides one rotating daily ritual and a local completion streak. The daily ritual is free; server-backed mission progress is separate from XP.

## Daily engagement and recurring value plan
- Free daily ritual + daily/weekly missions; a missed day must never remove privileges or impose a penalty.
- Club value should be delivered continuously: a 30-day daily ritual archive, weekly themed drops, seasonal story chapters, expanded Tarot/Oracle reflection packs, and additional cosmetic frames. Only market each entitlement after its implementation is live.
- One-time purchase remains available for users who do not want a subscription: €9.99 single experience or €24.99 three-game bundle.
- Never paywall consent, limits, PAUSE/PASS/STOP, stopping control, basic aftercare, account deletion or support. No ads in this privacy-sensitive product.
- Example gross monthly scenarios at €8.99/month: 100 members = €899; 250 = €2,247.50; 500 = €4,495. These are arithmetic scenarios before processor fees, refunds, VAT, chargebacks, marketing and content costs, not forecasts.

## Payment-provider shortlist (not approved / not integrated)
- Stripe's official policy says it cannot work with businesses that sell or offer adult content/services. Do not build production billing on Stripe for this product without written confirmation that the exact business model is permitted: https://support.stripe.com/questions/prohibited-and-restricted-business-list-faqs
- Verotel describes adult/high-risk billing and recurring subscription products: https://www.verotel.com/en/index.html and https://www.verotel.com/en/paymentprocessing.html
- Segpay describes adult, membership and subscription payment services: https://segpay.com/ and https://segpay.com/verticals/subscriptions/
- Treat Verotel and Segpay as candidates to apply to, not guaranteed approvals. Submit the exact app flows, content taxonomy, Lovense device-controls scope, refund process, countries and business entity for underwriting, then pick the provider only after written approval.
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
