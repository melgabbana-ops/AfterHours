# AFTER HOURS

Official AFTER HOURS project.

Premium, mobile-first interactive experience with a cinematic black-and-gold visual system.

## Included

- 18+ access gate
- Consent and safety state
- Guided three-round experience
- Server-authoritative active-time accounting for completed sessions
- Session timer with pause/reset
- Stop-session flow
- Profile, level and XP presentation
- Control-room interface
- Responsive iPhone, Android phone, iPad and tablet layout
- Safe-area and touch-target support for mobile browsers
- iOS/iPadOS standalone web-app metadata
- Installable PWA with network-first offline fallback
- GitHub Actions production build check

## Development

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
```

Authentication, account-bound profiles, database-backed sessions, consent RPCs, session completion and password recovery are implemented when Supabase is configured. Payment functionality is intentionally absent from the client. Do not enable public sales until a compliant payment provider, server-side checkout/webhook flow, and required legal/business setup are in place.

## Architecture

The client has typed backend-ready contracts in `src/types.ts`, centralized persistence in `src/storage.ts`, and a documented production data model in `src/data-model.md`.

Local storage is an offline prototype layer only. Offline sessions are not a trusted source for server-side XP, history, consent, or authorization.

The PWA service worker caches same-origin application resources using a network-first strategy. Fresh resources are preferred whenever the network is available; cached resources are used as the fallback when a request fails. Third-party origins are not intercepted by the service worker.

## Supabase setup

Copy `.env.example` to your local environment and configure:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Provider configuration (Google/Apple), email confirmation and password-reset redirect URLs must be configured in Supabase Auth. Payment secrets must never be exposed as `VITE_*` browser variables.

The app supports Supabase Auth with magic links, email/password, Google and Apple provider sign-in when the corresponding Supabase providers are configured. Password reset is also supported. Without the Supabase variables it stays in offline/local mode.

The browser must only receive the public anon key. Never place a Supabase service-role key in Vite environment variables.

## Deployment: GitHub Pages only

GitHub Actions is the build and deployment pipeline, and GitHub Pages is the only approved hosting target for AFTER HOURS. Do not add, configure, invoke or rely on Vercel or any other external deployment platform. Do not add paid hosting, build minutes, subscriptions or infrastructure.

The Pages workflow builds the Vite application and publishes its artifact from the approved GitHub branch. Pull-request workflows may build and upload an artifact, but must not publish production. Configure the two Supabase public browser variables only through the repository's approved GitHub Actions environment when remote persistence is intentionally enabled. Never expose service-role keys.

The PWA service worker is registered from the app shell and is safe to use without Supabase. Remote session state, consent, history, XP and authorization remain server-authoritative when Supabase is configured.
