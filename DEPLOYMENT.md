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
- **Env**: 
  - **Required**: `JWT_SECRET`, `CORS_ORIGINS`, `DATABASE_URL`, `SANITY_PROJECT_ID`, `SANITY_DATASET`, `SANITY_API_TOKEN`, `ANALYTICS_INGEST_KEY`
  - **Email (Admin Management)**: `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL`, `SENDGRID_FROM_NAME`, `ADMIN_URL`
  - **Optional**: `OPENAI_API_KEY`, `WEATHER_API_URL`, `WEATHER_API_KEY`
- **Container**: `server/Dockerfile` available; expose `PORT` (defaults to 3000). Health routes `/healthz` and `/status`.
- **Database**: Run `pnpm prisma:migrate` to apply migrations before starting

## External services

- **Sanity**: project/dataset values above; content and analytics metrics stored there.
- **Postgres**: Required for admin user management, orders, and other persistent data. Configure with `DATABASE_URL`.
- **SendGrid**: Required for admin invitation and password reset emails. Configure with `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL`, and `SENDGRID_FROM_NAME`.
- **Redis**: Optional; add `REDIS_URL` if extending rate limiting or caching.
- **Mapbox**: `VITE_NIMBUS_HEATMAP_MAPBOX_TOKEN` enables the 2D static heatmap overlay in Admin.

See [docs/SENDGRID_SETUP.md](docs/SENDGRID_SETUP.md) for email configuration details and [docs/ADMIN_USER_MANAGEMENT.md](docs/ADMIN_USER_MANAGEMENT.md) for admin management features.

## CI

- GitHub Actions workflow `.github/workflows/ci.yml` runs `pnpm install` then builds Admin, Studio, and API with Node 20.
