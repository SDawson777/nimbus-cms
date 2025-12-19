# Environment variables

## Admin (Vercel / local Vite)

- `VITE_NIMBUS_API_URL` – Base URL for the API (e.g., `https://nimbus-cms.up.railway.app`); required for live login, banner, analytics, and preferences.
- `VITE_APP_ENV` – `development` | `production` (optional UI hints).
- `VITE_NIMBUS_HEATMAP_MAPBOX_TOKEN` – Optional Mapbox static token for 2D heatmap overlays; hide heatmap when unset.
- `VITE_NIMBUS_HEATMAP_MAPBOX_TOKEN` – Deprecated for sensitive tokens. Do NOT store private Mapbox tokens in `VITE_...` variables; these are bundled into client code and can leak. Use the server-side `MAPBOX_TOKEN` (see API section) and the server proxy endpoints instead.

NOTE: The following server-side variables exist to avoid exposing secrets to the browser. Do not set private API keys as `VITE_` envs.
- `PREVIEW_SECRET` – Server-only secret used to gate preview mode. Do NOT set preview secrets as `VITE_...` (client-side): any `VITE_` env will be bundled into frontend code and could leak. Use `PREVIEW_SECRET` only on the API/server.

## Studio (Vercel)

- `SANITY_STUDIO_PROJECT_ID` – Sanity project ID (e.g., `ygbu28p2`).
- `SANITY_STUDIO_DATASET` – Dataset name (e.g., `production`).

## API (Railway/Docker)

- `NODE_ENV` – `production` or `development`.
- `PORT` – HTTP port (defaults to 3000 if unset by platform).
- `JWT_SECRET` – Required; 24+ chars in production.
- `CORS_ORIGINS` – Comma-separated allowlist (e.g., `https://admin.example.com,https://studio.example.com`).
- `SANITY_PROJECT_ID` / `SANITY_DATASET` / `SANITY_API_TOKEN` – Required for content + analytics writes.
- `ANALYTICS_INGEST_KEY` – Comma-separated keys for `/analytics/event` HMAC verification.
- `OPENAI_API_KEY` – Optional; enables AI concierge/insights endpoints.
- `OPENAI_MODEL` – Optional; overrides the concierge model (default `gpt-4o-mini`).
- `JSON_BODY_LIMIT` – Optional body size limit (default `4mb`).
- `ADMIN_LOGIN_RATE_LIMIT_MAX` / `ADMIN_LOGIN_RATE_LIMIT_WINDOW_MS` – Optional overrides for login throttling.
- `WEATHER_API_URL` / `WEATHER_API_KEY` – Optional; used by the admin banner endpoint to proxy weather without exposing keys.
- `OPENWEATHER_API_KEY` or `WEATHER_API_KEY` – Server-only API key for OpenWeather (or equivalent). Do not expose this as `VITE_...`.
- `MAPBOX_TOKEN` or `MAPBOX_SECRET` – Server-only Mapbox token for static imagery/tiles; do not use `VITE_NIMBUS_HEATMAP_MAPBOX_TOKEN` for private tokens.
- `ALLOW_PREVIEW_CORS` / `CORS_PREVIEW_SUFFIX` / `ADMIN_ORIGIN` / `STUDIO_ORIGIN` / `PUBLIC_ORIGIN` / `MOBILE_ORIGIN` – Configure CORS allowlists for admin/studio/mobile/preview hosts.

## Optional services

- `REDIS_URL` – If using external rate-limit/backing store (not required by default).
- `DATABASE_URL` – If enabling relational persistence beyond Sanity.

## Platform notes

- **Vercel**: set Admin root to `apps/admin` and Studio root to `apps/studio`; `pnpm` is supported natively.
- **Railway/Docker**: supply all API variables via service settings or `.env`; never commit secrets.
