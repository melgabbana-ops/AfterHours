# AFTER HOURS

Official AFTER HOURS project.

Premium, mobile-first interactive experience with a cinematic black-and-gold visual system.

## Included

- 18+ access gate
- Consent and safety state
- Guided three-round experience
- Session timer with pause/reset
- Stop-session flow
- Profile, level and XP presentation
- Control-room interface
- Responsive iPhone, Android phone, iPad and tablet layout
- Safe-area and touch-target support for mobile browsers
- iOS/iPadOS standalone web-app metadata
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

The current client is the visual/interaction foundation. Authentication, persistent profiles, database-backed sessions and payment infrastructure should be connected before public production launch.

## Architecture

The client now has typed backend-ready contracts in `src/types.ts`, centralized persistence in `src/storage.ts`, and a documented production data model in `src/data-model.md`. Local storage is only an offline prototype layer and must not contain authentication secrets, payment credentials, or server authorization data.


## Supabase setup

Copy `.env.example` to your local environment and configure:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

The app uses Supabase Auth with magic links when configured. Without those variables it stays in offline/local mode.

The browser must only receive the public anon key. Never place a Supabase service-role key in Vite environment variables.

## Deployment

This is a Vite production build and is ready for a Git-connected deployment platform. Set the two Supabase variables in the deployment environment before enabling remote persistence.
