# AFTER HOURS add-on implementation: Aftercare Journal + Roulette of Desire

## Scope and integration
- Added two lazy-loaded, independently routed screens: `journal` and `roulette`.
- Both are reachable from Home > Explore more and support direct links through the app's existing screen router.
- Existing Aftercare screen, note component, mood history, consent flow and session completion flow are unchanged.

## Aftercare Journal
- Standalone private reflection journal with title, current feeling, needs and free-form reflection.
- Uses Web Crypto PBKDF2-SHA-256 (210,000 iterations) to derive an AES-256-GCM key from a user passphrase. A fresh salt and IV are generated for each save.
- Encrypted payload only is stored in browser localStorage. No server upload, third-party API or paid service.
- Passphrase is not recoverable. Data is device/browser-local and does not sync across devices. Clearing browser storage loses the journal.
- Journal locks by clearing the in-memory entries and passphrase from React state.

## Roulette of Desire
- Eight built-in bilingual cards across Connection, Reflection, Play and Aftercare.
- Category filter, random non-repeating draw, choose/pass controls, progress count and reset.
- Prompts are non-prescriptive and low-risk. No card is mandatory; skip and stop are explicitly available. No XP or rewards are granted for accepting a card.

## Validation still required
- CI build, unit tests, migration ledger and mobile/palette checks must pass on the pull request.
- Manually verify Web Crypto and localStorage on physical iOS Safari and Android Chrome.
- Verify journal wrong-passphrase behavior, reload/unlock, browser-storage denial and clear-data loss messaging.
- Verify roulette category filtering, no-repeat behavior, pass/accept/reset and keyboard/screen-reader use.
- No Supabase migration is needed for this first privacy-preserving, local-only release. Account sync is intentionally out of scope until encrypted-at-rest server storage and account-level deletion/export are designed.
