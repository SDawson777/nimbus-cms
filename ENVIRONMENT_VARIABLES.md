# Environment variables

## Admin (Vercel / local Vite)
- `VITE_NIMBUS_API_URL` – Base URL for the API (e.g., `https://nimbus-cms.up.railway.app`); required for live login, banner, analytics, and preferences.
- `VITE_APP_ENV` – `development` | `production` (optional UI hints).
- `VITE_NIMBUS_HEATMAP_MAPBOX_TOKEN` – Optional Mapbox static token for 2D heatmap overlays; hide heatmap when unset.
- `VITE_WEATHER_API_URL` – Optional weather endpoint proxy for the admin banner (e.g., your server wrapper).
- `VITE_WEATHER_API_KEY` or `VITE_OPENWEATHER_API_TOKEN` – Optional key passed to the weather proxy when needed.

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
- `ALLOW_PREVIEW_CORS` / `CORS_PREVIEW_SUFFIX` / `ADMIN_ORIGIN` / `STUDIO_ORIGIN` / `PUBLIC_ORIGIN` / `MOBILE_ORIGIN` – Configure CORS allowlists for admin/studio/mobile/preview hosts.

## Optional services
- `REDIS_URL` – If using external rate-limit/backing store (not required by default).
- `DATABASE_URL` – If enabling relational persistence beyond Sanity.

## Platform notes
- **Vercel**: set Admin root to `apps/admin` and Studio root to `apps/studio`; `pnpm` is supported natively.
- **Railway/Docker**: supply all API variables via service settings or `.env`; never commit secrets.
