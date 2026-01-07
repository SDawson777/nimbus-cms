# Environment Variables (Canonical)

This document is the canonical reference for Nimbus CMS environment configuration.

- API server lives in `server/`
- Admin SPA lives in `apps/admin/`
- Studio lives in `apps/studio/`

## Naming conventions

- Client-visible variables must be prefixed with `VITE_` (these are bundled into browser JavaScript). **Never put secrets in `VITE_...` env vars.**
- Server-only secrets must NOT be prefixed with `VITE_`.

## Quickstart (local)

Minimum for local API + Admin:

1) API (`server/.env`)

- `DATABASE_URL`
- `JWT_SECRET`
- `CORS_ORIGINS` (comma-separated)
- Sanity (optional depending on what you exercise): `SANITY_PROJECT_ID`, `SANITY_DATASET`, `SANITY_API_TOKEN`

2) Admin (`apps/admin/.env`)

- `VITE_NIMBUS_API_URL=http://localhost:<PORT>/api/v1/nimbus` (or leave empty for same-origin dev setups)
- `VITE_APP_ENV=development`

## Admin (Vercel / local Vite)

- `VITE_NIMBUS_API_URL` – Base URL for the API namespace (example: `https://<api-host>/api/v1/nimbus`).
  - Legacy alias: `VITE_API_URL` (supported for compatibility; prefer `VITE_NIMBUS_API_URL`).
- `VITE_APP_ENV` – Environment label used for UI hints (example: `development`, `preview`, `production`).
- `VITE_APP_VERSION` – Optional version string for display/diagnostics.
- `VITE_SENTRY_DSN` – Optional: browser Sentry DSN for Admin SPA.
- `VITE_NIMBUS_THEME` – Optional: theme name.
- `VITE_NIMBUS_HEATMAP_MAPBOX_TOKEN` – Optional **public** Mapbox token for client-side heatmap visuals.
  - Do not use secret Mapbox tokens here; anything in `VITE_...` is public.

## Studio (Vercel)

- `SANITY_STUDIO_PROJECT_ID` – Sanity project id.
- `SANITY_STUDIO_DATASET` – Dataset name.

## API (Railway/Docker)

Core:

- `NODE_ENV` – `production` or `development`.
- `PORT` – HTTP port.
- `DATABASE_URL` – Postgres connection string.
- `JWT_SECRET` – Required; use 24+ chars in production.

CORS:

- `CORS_ORIGINS` – Comma-separated allowlist of origins (example: `https://admin.example.com,https://studio.example.com`).
  - Note: the server expects `CORS_ORIGINS` (plural). There is no `CORS_ORIGIN`.

Sanity:

- `SANITY_PROJECT_ID`
- `SANITY_DATASET`
- `SANITY_API_TOKEN` – Server-side token for reads/writes.
  - Legacy alias supported in some codepaths: `SANITY_TOKEN` (prefer `SANITY_API_TOKEN`).

Admin auth throttling (optional):

- `ADMIN_LOGIN_RATE_LIMIT_MAX`
- `ADMIN_LOGIN_RATE_LIMIT_WINDOW_MS`

AI (optional):

- `OPENAI_API_KEY`
- `OPENAI_MODEL`

Observability (optional):

- `SENTRY_DSN`
- `SENTRY_ENVIRONMENT`
- `SENTRY_RELEASE`
- `SENTRY_TRACES_SAMPLE_RATE`
- `SENTRY_PROFILES_SAMPLE_RATE`

Maps/weather proxying (optional):

- `MAPBOX_TOKEN` – Server-side Mapbox token (keep secret).
- `WEATHER_API_URL`
- `WEATHER_API_KEY`
- `OPENWEATHER_API_KEY` – Some deployments use this alias.

Preview mode (optional):

- `PREVIEW_SECRET` – Server-only secret for preview gating.
- `ALLOW_PREVIEW_CORS` – Comma-separated allowlist for preview-related origins.

## Deployment mapping (examples)

These are typical patterns; set actual values per environment.

- DEMO
  - API base: `https://<api-demo-host>/api/v1/nimbus`
  - Sanity dataset: `nimbus_demo`

- PREVIEW
  - API base: `https://<api-preview-host>/api/v1/nimbus`
  - Sanity dataset: `nimbus_preview`

- PRODUCTION
  - API base: `https://<api-prod-host>/api/v1/nimbus`
  - Sanity dataset: `production` (or your chosen production dataset)
