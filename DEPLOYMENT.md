# Deployment guide

## Admin SPA (Vercel)

- **Root directory**: `apps/admin`
- **Install**: `pnpm install --frozen-lockfile`
- **Build**: `pnpm run build`
- **Output**: `apps/admin/dist`
- **Env**: `VITE_NIMBUS_API_URL`, `VITE_APP_ENV`, optional `VITE_NIMBUS_HEATMAP_MAPBOX_TOKEN`, `VITE_WEATHER_API_URL`, `VITE_WEATHER_API_KEY`.
- **Notes**: SPA routing relies on Vercel rewrites (configured in `vercel.json`). Analytics are 2D-only with micro-motion.

## Sanity Studio (Vercel)

- **Root directory**: `apps/studio`
- **Install**: `pnpm install --frozen-lockfile`
- **Build**: `pnpm run build`
- **Output**: `apps/studio/dist` (copied to repo `dist/` for Netlify previews via root `studio:build`).
- **Env**: `SANITY_STUDIO_PROJECT_ID`, `SANITY_STUDIO_DATASET`.

## API Server (Railway/Docker)

- **Root directory**: `server`
- **Install**: `pnpm install --frozen-lockfile`
- **Build**: `pnpm run build`
- **Start**: `node dist/index.js`
- **Env**: `JWT_SECRET`, `CORS_ORIGINS`, `SANITY_PROJECT_ID`, `SANITY_DATASET`, `SANITY_API_TOKEN`, `ANALYTICS_INGEST_KEY`, optional `OPENAI_API_KEY`, `WEATHER_API_URL`, `WEATHER_API_KEY`.
- **Container**: `server/Dockerfile` available; expose `PORT` (defaults to 3000). Health routes `/healthz` and `/status`.

## External services

- **Sanity**: project/dataset values above; content and analytics metrics stored there.
- **Postgres/Redis**: not required by default; add `DATABASE_URL` or `REDIS_URL` if extending persistence or rate limiting.
- **Mapbox**: `VITE_NIMBUS_HEATMAP_MAPBOX_TOKEN` enables the 2D static heatmap overlay in Admin.

## CI

- GitHub Actions workflow `.github/workflows/ci.yml` runs `pnpm install` then builds Admin, Studio, and API with Node 20.
