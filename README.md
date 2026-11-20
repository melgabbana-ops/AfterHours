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

## Deployment

The independent production host is GitHub Pages. GitHub Actions builds and publishes the app from the `design/reference-screen-system-nov-2026` branch. The workflow runs migration checks, brand-asset checks, unit tests, the Vite production build, and a direct HTTP smoke check of the published app shell and its JS/CSS assets.

The deployment does not require Vercel or TinyFish. GitHub is the source of truth and build/deployment runner; GitHub Pages serves the static client; Supabase provides authentication and remote data. The app is published under the repository base path, so entry links and PWA assets must remain base-path aware.

Set `VITE_SUPABASE_URL` and the public `VITE_SUPABASE_ANON_KEY` in the build environment before enabling remote persistence. Never expose a Supabase service-role key in the browser.

The PWA service worker is registered from the app shell and is safe to use without Supabase. Remote session state, consent, history, XP and authorization remain server-authoritative when Supabase is configured.
