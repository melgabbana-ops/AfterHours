# Daily engagement and recurring revenue

Status: daily ritual UI is in the feature branch; Club offers are proposed UI only. Checkout, provider approval, subscription entitlements and recurring billing are not live.

## User value loop

1. Free account: safety plan, consent/limits, PAUSE/PASS/STOP, core aftercare and one fresh daily ritual.
2. Daily habit: a brief, opt-in 1–3 minute ritual, local completion streak and shortcuts to missions or insights. No penalty for missing a day.
3. Weekly rhythm: weekly missions, a themed reflection drop and rotating story content.
4. Optional Club: proposed €8.99/month or €79.99/year. Intended benefits include a 30-day ritual archive, weekly thematic drops, additional story chapters, expanded Tarot/Oracle collections, and cosmetic frame/character drops. Each benefit must be implemented before sale.
5. One-off route: retain €9.99 single-game and €24.99 three-game bundle for customers who do not want a recurring charge.
6. Later, if supported by the product economics and provider approval: seasonal cosmetics, gift passes, and a disclosed affiliate/partner programme. Do not depend on Lovense referral revenue until an official agreement exists.

## Pricing math (gross only, not a forecast)

- 100 monthly members × €8.99 = €899/month gross.
- 250 × €8.99 = €2,247.50/month gross.
- 500 × €8.99 = €4,495/month gross.
- €79.99 annual is about 26% below 12 × €8.99 (€107.88).

Net contribution must subtract payment processing, refunds/chargebacks, VAT/tax, compliant age/legal operations, customer support, content production, creator royalties (if any), infrastructure and marketing.

## Adult payment processor and recurring billing requirements

Stripe's official restricted-business FAQ states that it cannot currently work with businesses that sell or offer adult content or services: https://support.stripe.com/questions/prohibited-and-restricted-business-list-faqs

Potential candidates to apply to, not guaranteed approvals:
- Verotel: https://www.verotel.com/en/index.html and https://www.verotel.com/en/paymentprocessing.html
- Segpay: https://segpay.com/ and https://segpay.com/verticals/subscriptions/

The processor must approve the exact interactive adult/BDSM-related product and Lovense-control use case in writing. Before the first charge, implement server-created checkout, signed webhook verification, idempotent subscription state, failed-renewal/retry handling, receipts, customer-initiated cancellation, refund/dispute handling, access revocation at period end, restore access, consent logs and country-specific VAT/consumer disclosures.

## Must stay free

Consent, hard and soft limits, PAUSE/PASS/STOP, stopping control, safety plan, core aftercare, support/complaints and account/data-deletion rights are never subscription perks. Privacy features must not depend on payment status.

## Source links

- Lovense Basic JS SDK for the website integration: https://developer.lovense.com/docs/cam-solutions/basic-js-sdk
- Lovense Standard Socket API and server-side developer-token flow: https://developer.lovense.com/docs/standard-solutions/socket-api
- Stripe restricted business FAQ: https://support.stripe.com/questions/prohibited-and-restricted-business-list-faqs
- Verotel recurring billing: https://www.verotel.com/en/paymentprocessing.html
- Segpay subscriptions: https://segpay.com/verticals/subscriptions/
