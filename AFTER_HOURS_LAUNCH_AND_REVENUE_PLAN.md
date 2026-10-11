# AFTER HOURS · Launch & Revenue Plan

Last reviewed: 11 October 2026

## Current product and pricing in the app

- **Free Access · €0:** profile, consent, boundaries, safety plan, pause/stop and aftercare.
- **Single Experience · €9.99:** one premium interactive game.
- **The 3-Game Collection · €24.99:** three games. Compared with three individual purchases at €9.99, this is a €4.98 saving.
- **No forced subscription and no ads.** Safety tools remain free.

The Store screen is deliberately **not a checkout** yet. Its purchase buttons only save a preference in the current browser. They do not send a lead to the owner, take payment, unlock a product, or record an order. Do not advertise these buttons as accepting payment.

## Recommended revenue sequence

### 1. Validate demand without taking payment

Keep the free experience usable, show the two clearly priced offers, and promote the teaser. Before opening paid checkout, collect actual opt-in interest in a server-side table or waitlist with an explicit privacy notice. The current local-only preference is not enough to measure demand from visitors or across devices.

### 2. Keep the one-time packs as the first paid product

Use the current €9.99 single-game and €24.99 three-game prices as the initial test. Add more themed game packs only after the first pack has been tested with real users. Make any future subscription optional and add it only if members repeatedly want new releases. Do not introduce a paywall around consent, safety, pause/stop or aftercare.

**Illustrative gross sales (not a forecast):**

| Purchases | Gross revenue |
| --- | ---: |
| 25 three-game packs | €624.75 |
| 100 three-game packs | €2,499.00 |
| 250 three-game packs | €6,247.50 |

These are before VAT, processor fees, refunds, chargebacks, tax and other operating costs.

### 3. Payment-provider decision

This app is positioned as an 18+ BDSM-themed interactive experience, so a general-purpose processor may classify it as an adult product even where individual prompts are non-explicit. Obtain written approval for the exact product and sales model before integrating checkout.

- **First specialist to ask: [Verotel](https://www.verotel.com/en/index.html).** Verotel explicitly serves adult/high-risk digital businesses and documents one-time FlexPay purchases and subscription flows. Its public Dutch pricing page currently advertises a Basic account with a €500 annual registration fee, a 15.5% per-transaction rate and a 10% six-month rolling reserve. Those terms would be expensive for a small test; confirm the current offer directly, and ask specifically about iDEAL, direct-debit availability, payout timing, refunds and onboarding requirements before committing. Sources: [Verotel adult/high-risk overview](https://www.verotel.com/en/index.html), [Verotel pricing](https://www.verotel.com/nl/pricechart.html), [FlexPay purchase docs](https://controlcenter.verotel.com/flexpay-doc/purchase.html).
- **Second specialist to compare: [CCBill](https://ccbill.com/industries/adult-business).** It offers adult-merchant payment processing and discusses EU-oriented 3-D Secure/PSD2 support. Request a written quote, minimums, reserve, payment options and merchant eligibility before making a decision.
- **Do not wire in Stripe, PayPal or Paddle as the default.** Stripe's restricted-business guidance and PayPal's acceptable-use terms restrict adult-content categories; Paddle explicitly prohibits adult and age-restricted products/services. Sources: [Stripe restricted-business FAQ](https://support.stripe.com/questions/prohibited-and-restricted-business-list-faqs), [PayPal Acceptable Use Policy](https://www.paypal.com/nl/legalhub/acceptableuse-full), [Paddle AUP](https://www.paddle.com/help/start/intro-to-paddle/what-am-i-not-allowed-to-sell-on-paddle).

No payment integration is active. The product needs an approved merchant account and a server-side checkout + verified webhook before an order may unlock any paid game. Never place provider secrets or service-role keys in frontend code. Confirm business, tax, consumer-rights and adult-content obligations with a qualified Dutch adviser before trading.

## Music

The Radio screen links out to Spotify searches rather than streaming inside AFTER HOURS. Keep that architecture unless Spotify grants written approval: its Developer Policy prohibits integrating Spotify content into a game and restricts commercial streaming integrations, including e-commerce initiated via a streaming app. Source: [Spotify Developer Policy](https://developer.spotify.com/policy).

## WhatsApp

The app now has a user-initiated **Invite via WhatsApp** action. It shares only the public teaser URL and a short invitation. It is not a WhatsApp Business API integration, bulk messaging, automated notification system, or customer-support inbox. A true Business integration requires an approved WhatsApp Business account, a server-side token, templates where required, opt-in and privacy controls.

## Release checklist and known blockers

- [x] Official after-hours-logo.svg is used throughout the app, teaser and maintenance screen.
- [x] Seven approved rank names restored: THE CURIOUS, THE INITIATE, THE DEVOTED, THE DISCIPLINED, THE ENTHRALLED, THE BOUND, AFTER HOURS.
- [x] Dutch and English fallback session content and game controls.
- [x] Dutch and English Tarot, Oracle and daily astrology copy.
- [x] Hand-operated WhatsApp share link that does not include private user data.
- [x] Supabase schema source includes row-level security, server-authoritative session/consent procedures and private media storage rules.
- [x] Idempotent migration for localized experience-round content: supabase/migrate_localized_experience_rounds.sql.
- [x] Role-protected admin console source with aggregate metrics, bilingual round editor and server-side audit logging.
- [x] Admin migration source with allowlist table, restricted grants and audit trail: supabase/migrate_admin_dashboard.sql.
- [ ] **Run both SQL migrations in the correct production Supabase project.** The localized-round and admin-console SQL are committed, but are not deployed merely because their files exist. After the admin migration, add the verified owner auth UUID to public.app_admins from the SQL Editor; never expose a self-service admin grant.
- [ ] **Confirm production Supabase configuration and provider login callbacks.** The Vercel environment-variable endpoint denied access to the current connector, so production environment values and Supabase readiness could not be verified from this session.
- [ ] **Confirm the public production URL opens without Vercel team SSO.** Earlier project metadata showed SSO protection on non-custom deployment domains. Current Vercel project settings could not be re-checked because the Vercel connector returned a scope/authorization 403. Do not send the teaser QR to a public audience until that external access setting is verified.
- [ ] **Select and approve the adult-compatible payment processor**, implement the server-side checkout and signed webhooks, and test cancellations/refunds before switching the Store from “interest only” to “buy”.
- [ ] **Activate the admin console in production.** Its React interface and server-side authorization/audit SQL are now in source. It will remain closed until the SQL migration runs and the owner auth UUID is allowlisted.
- [ ] **Age verification review.** The current 18+ gate is a self-declaration, not identity or third-party age verification. Choose a privacy-preserving approach that meets the actual legal and platform requirements before a full public adult launch. The European Commission published its age-verification blueprint and marked it feature-ready in April 2026: [EU age-verification approach](https://digital-strategy.ec.europa.eu/en/policies/eu-age-verification).
- [x] Updated QR invite card and a 9-second branded motion teaser with the official logo end card; its QR opens the app-entry route and was decoded successfully in seven sampled video frames.
- [ ] **Full physical scan animation remains a separate creative task.** The current teaser is a motion-graphics treatment of a generated cinematic still, not a sequence of distinct filmed/AI-generated frames showing the hand movement and the app opening in real time. No extra Runway/Picsart credits were purchased.

## Safe launch order

1. Confirm public URL and age-gate requirements.
2. Apply the localized-round SQL migration, then verify authentication, consent, stop/revoke, private media and persisted XP in the real Supabase project.
3. Complete the actual role-protected admin console and release monitoring.
4. Obtain written processor approval, wire checkout/webhooks, and test purchase/refund/failed payment cases.
5. Replace the QR teaser only when the destination is publicly reachable and the cinematic scan-to-app video is genuinely finished.
