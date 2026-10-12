# AFTER HOURS — deep audit status
**Audit date:** 12 October 2026  
**Branch:** `audit/daily-revenue-lovense-camera`  
**Latest verified CI at report time:** build + unit tests passed on `19960614cbc97c3b06151304704e69725eed3ccb`. Subsequent changes are limited to documentation updates; re-check CI for the latest branch head before merging.  
**Production status:** no deployment or live Supabase migration was performed as part of this audit.

## Executive status

- **Daily use:** 14 bilingual rotating micro-rituals, daily mission links and a local fallback exist. Server-owned daily ritual history and idempotent completion RPC are now in code; migration still needs to be applied and verified on the correct Supabase project. The PWA has a Daily After Hours shortcut.
- **Revenue beyond games:** optional AFTER HOURS Club pricing UI exists at draft prices €8.99/month and €79.99/year. Buttons only save local interest; no payment or paid entitlement is active. Revenue cannot be collected until provider approval, backend checkout, verified webhooks, subscriptions, cancellation, refunds and VAT disclosures are implemented and tested.
- **Camera overlay:** CLEAN, AFTER HOURS and CINEMATIC frames are selectable. New in-app video uses a composited canvas stream so the frame is included in the recorded file; selected photos are composited locally before explicit save. Real-device audio/video, orientation and interruption tests remain.
- **Lovense:** optional route is under Profile → Settings → Connected devices. Official Basic JS SDK integration and server-side token endpoint are coded. Manual controls require opt-in; test command is capped at five seconds; STOP NOW disables controls. Not live until Lovense developer approval, secrets/origin configuration, Edge Function deployment, CSP and real toy tests are complete.
- **Scope inventory:** see [FEATURE_IMPLEMENTATION_MATRIX.md](./FEATURE_IMPLEMENTATION_MATRIX.md) for the full item-by-item component/status/evidence matrix and [APPROVED_FEATURE_CHECKLIST.md](./APPROVED_FEATURE_CHECKLIST.md) for the master acceptance checklist.

## Feature status by area

| Area | Status | Remaining blockers |
|---|---|---|
| Core app, profile, session screens | Partial / CI-covered | End-to-end session state, persistence and real-user QA |
| 18+ gate, consent, hard limits, PAUSE/PASS/STOP | Code present / verify thoroughly | Full approved flow and safety regression tests |
| Game modes, seven chapters, Boss Mode | UI present / partial integration | Server-owned progression and consent/session integration |
| 100+ command library | Dataset present / partial categorization | All approved categories, metadata, limit eligibility and admin editing |
| XP, ranks, combo and achievements | Partial | Full idempotent event ledger, combo rules, badges and cross-device sync |
| Missions | Server RPC code present | Migration review/application, RLS/RPC verification; points remain separate from rank XP |
| Daily After Hours | UI + server history code | Apply migration, test cross-device sync; local fallback remains |
| Photo/video/voice vault | Capture and preview code present | Storage/RLS, real device, codec, interruption and private URL tests |
| AH camera overlay | Code implemented | iOS/Android recording/audio sync, orientation and upload failure QA |
| Lovense | Integration scaffold coded | Developer approval, secrets, origins, CSP, deployed function and hardware QA |
| AFTER HOURS Club | Proposal UI only | Deliver benefits, approved adult payment provider, checkout/webhooks/entitlements/cancellation/refunds/tax |
| One-off game packs | Pricing UI only | No payment provider or checkout; do not imply purchases work |
| Tarot/Oracle/astrology/radio | Partial / requires review | Content, rights, UX and persistence verification |
| Admin / products / test mode | Partial | Server authorization, RLS, configuration and integration testing |
| Auth / Google / Apple | Partial / external config | Provider setup, email delivery, recovery and production verification |
| Legal, complaints, GDPR | Draft UI | Legal review, real complaint intake, data export/deletion and operator details |
| PWA, update notices, maintenance | Code / CI-covered | iOS/Android installation and service-worker/device tests |
| Push notifications | Not live | Subscription capture, delivery provider, unsubscribe and permission flows |
| Accessibility, mobile, performance | Partial | Screen reader/keyboard, contrast, 48px targets, target-width matrix and performance |
| Security / CSP | Partial | No repository-level CSP currently declared; implement/test before Lovense is live |
| Social studio | Text templates present | Visual exports, account persistence and publishing integrations |

## Recommended next implementation order

1. Verify latest CI against the current branch head after documentation updates.
2. Review and apply the daily ritual and mission migrations only after inspecting the target Supabase project's actual migration history; test account ownership and cross-device history.
3. Configure and validate Lovense developer approval, Supabase secrets/origin allowlist, function deployment, CSP, and real device pairing. Keep automatic game-linked control disabled until per-session consent, limits, and stop-on-disconnect behavior are verified.
4. Run physical iPhone Safari and Android Chrome tests for camera overlays, audio/video sync, orientation, permission denial, interruption, save, upload and deletion.
5. Finish authoritative XP/combo/achievement integration and verify PAUSE/PASS/STOP never incur penalties or award boundary-crossing XP.
6. Complete admin/RLS and auth-provider configuration, legal complaint intake/GDPR deletion, music licensing and accessibility QA.
7. Underwrite the exact adult/BDSM interactive product with an adult-content-permitting provider. Only then implement and test real checkout, subscription entitlements, renewals, receipts, cancellations, refunds, disputes and tax disclosures.
8. Implement paid Club benefits before offering Club for sale; never paywall consent, limits, PAUSE/PASS/STOP, core aftercare, support or deletion.
9. No production release, production migration or real billing activation until the relevant approval and end-to-end verification.

## Important distinction

A successful CI build proves that the checked-in code compiles and its automated tests pass. It does **not** prove Lovense hardware works, Supabase migrations are applied, payments can be collected, or the app is production-ready.
