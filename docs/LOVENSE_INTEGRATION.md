# AFTER HOURS × Lovense integration

Status: integration code scaffolded; external setup and real-device tests pending. This is not yet a verified live connection.

## Chosen architecture

For a web app/PWA, Lovense recommends the official Basic JS SDK. The first integration slice loads that SDK only after an explicit connect action, and uses an authenticated Supabase Edge Function to mint a per-user auth token. The Lovense developer token never goes to the browser.

Official documentation:
- Basic JS SDK: https://developer.lovense.com/docs/cam-solutions/basic-js-sdk
- Standard Socket API and server-side token flow: https://developer.lovense.com/docs/standard-solutions/socket-api
- Official live demo: https://developer.lovense.com/standard-js-demo
- App Gallery option inside Lovense Remote: https://developer.lovense.com/docs/remote/overview/development

The Edge Function calls Lovense at https://api.lovense-api.com/api/basicApi/getToken. It returns only the per-user auth token, user id and registered platform name. The response is marked no-store.

## Required external setup

1. Register AFTER HOURS in the Lovense Developer Dashboard and get approval for the intended use case.
2. In Supabase Edge Function secrets, configure:
   - LOVENSE_DEVELOPER_TOKEN (secret, server only)
   - LOVENSE_PLATFORM_NAME (must match the registered platform name)
   - LOVENSE_ALLOWED_ORIGINS (comma-separated exact app origins, including production and any approved preview origin)
3. Deploy the function at supabase/functions/lovense-auth-token/index.ts to the correct Supabase project. Do not use VITE_ variables for developer credentials.
4. Verify the production Content Security Policy permits the minimum official SDK/API sources needed. Lovense documents api.lovense-api.com, *.lovense.com, *.lovense-api.com and *.lovense.club where required. Prefer narrower rules when possible.
5. Test current iOS Safari/PWA, Android Chrome/PWA and Lovense Remote/Connect pairing with actual supported toys. Do not assume a normal browser can directly pair a toy by Bluetooth.

## Safety UX in this first slice

- User must be signed in.
- User explicitly opts in before the SDK loads and separately enables manual device control.
- Initial test pulse is limited to strength 1–5 for five seconds, and only starts by a direct button action.
- No command is sent automatically by story, surprise, XP, mood, camera, recording or monetization.
- STOP NOW invokes the SDK stop action and never requires a confirmation modal.
- Toy name/status may be displayed, but the app must not log device identifiers or auth tokens.
- Leaving the screen stops the current action and destroys the SDK instance.
- Disconnect/reset is available.

## Not done yet

- No real Lovense developer token, account approval, Supabase function deployment or hardware test is available in this code-only change.
- Game-round orchestration is not linked to toys. Any future orchestration must be opt-in per session, respect hard/soft limits, bound every action by a short maximum duration, and stop immediately on pause, overwhelm, STOP, disconnection, session end or consent revocation.
- Do not market this as a working live integration until the external setup and end-to-end tests succeed.
