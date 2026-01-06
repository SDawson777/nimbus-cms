# System Inventory (Nimbus CMS)

This document enumerates the production-relevant components of Nimbus CMS for buyer diligence: deployable services, data stores, third-party dependencies, and where configuration/secrets live.

## 1) Repos and Deployable Units (This Monorepo)

### API Server (primary runtime)
- Location: `server/`
- Tech: Node.js + Express + TypeScript
- Responsibilities:
  - Admin authentication (JWT cookie) and admin APIs
  - Public content APIs (reads Sanity content; mixes with Postgres data where applicable)
  - Readiness/health endpoints (`/healthz`, `/ready`)
  - Serves Admin SPA when packaged together (via `server/static` at `/admin`)
- Ports:
  - Docker bundle (`server/Dockerfile`) defaults to `PORT=4010` and exposes `4010`
  - Root API-only image (`Dockerfile`) defaults to `PORT=8080` and exposes `8080`

### Admin SPA
- Location: `apps/admin/`
- Tech: React + Vite
- Deploy modes:
  - Standalone (Vercel/Netlify) with `VITE_NIMBUS_API_URL` pointing at the API
  - Bundled into the API container (`server/Dockerfile`) and served from `/admin`

### Sanity Studio
- Location: `apps/studio/`
- Tech: Sanity Studio
- Role: Content authoring UI for CMS data (deals, theme config, legal docs, FAQs, etc.)

### Prisma (database schema and seed)
- Location: `prisma/`
- Role:
  - DB schema management for Postgres
  - Demo seeding via `prisma/seed.ts` (`pnpm run demo:seed:db`)

### Operational scripts (selected)
- Demo seed:
  - `prisma/seed.ts` (Postgres demo seed)
  - `scripts/seed-sanity-demo.ts` (Sanity demo seed)
- Sanity export/import:
  - `scripts/sanity-export-demo.mjs`
  - `scripts/sanity-import-demo-restore.mjs`
- Buyer deploy smoke-check:
  - `scripts/smoke-check-deploy.mjs`

### Mobile app folders
- `nimbus-mobile-app/` is explicitly marked legacy/reference (`nimbus-mobile-app/README.md`).

## 2) Runtime Infrastructure

### Data stores
- Postgres
  - Primary system-of-record for operational data
  - Connection: `DATABASE_URL`
  - Local/dev: `infra/docker-compose.yml` provisions `postgres:16-alpine`
- Redis (optional)
  - Local/dev: `infra/docker-compose.yml` provisions `redis:7-alpine`
  - Connection: `REDIS_URL`

### Content store
- Sanity
  - System-of-record for CMS documents (themeConfig, deals, articles, FAQs, legal docs, etc.)
  - Connection: `SANITY_PROJECT_ID`, dataset (`SANITY_DATASET_DEFAULT` or Studio dataset envs), and a token (read/write depending on operation)

## 3) Third-Party Services

### Observability
- Sentry
  - Server-side error capture (API)
  - Admin SPA capture (browser) where enabled

### AI (optional)
- OpenAI
  - Client library present in dependencies; use is deployment-specific (`OPENAI_API_KEY` mentioned in `DEPLOYMENT.md`).

### Maps/heatmap (optional)
- Mapbox
  - Used by Admin heatmap feature when configured (`VITE_NIMBUS_HEATMAP_MAPBOX_TOKEN` noted in `DEPLOYMENT.md`).

## 4) Configuration and Secrets

### Where configuration lives
- Runtime secrets and config are provided via environment variables in hosting (Railway/Vercel/Docker). Repo docs:
  - `ENV_VARIABLES.md`
  - `DEPLOYMENT.md`
  - `docs/SECURITY_NOTES.md`

### Key environment variables (high level)
- API:
  - `DATABASE_URL` (required)
  - `JWT_SECRET` (required)
  - Sanity: `SANITY_PROJECT_ID` + dataset vars + token vars
  - CORS: docs mention `CORS_ORIGINS`; server code also uses per-client origin vars in its CORS middleware (see note below)
  - Observability: `SENTRY_DSN`
  - Optional: `REDIS_URL`, `OPENAI_API_KEY`
- Admin SPA:
  - `VITE_NIMBUS_API_URL` (required)
  - Optional: Mapbox/Weather envs as noted in `DEPLOYMENT.md`
- Studio:
  - `SANITY_STUDIO_PROJECT_ID`, `SANITY_STUDIO_DATASET`

### Known env-var naming mismatch (buyer note)
- `ENV_VARIABLES.md` and `DEPLOYMENT.md` reference `CORS_ORIGINS`.
- The API’s CORS middleware is implemented to allowlist origins via `CORS_ORIGIN_ADMIN` and `CORS_ORIGIN_MOBILE` plus preview toggles (`PREVIEW_ALLOW_ALL`, `PREVIEW_ALLOWED_ORIGINS`).
- Keep these aligned in your deployment; treat `server/src/middleware/cors.ts` as the canonical source of truth.

## 5) Primary Docker Artifacts

- API-only image: `Dockerfile`
  - Builds and runs `server/` only
  - Exposes `8080` and runs `server/init_and_start.sh`
- API + Admin bundle image: `server/Dockerfile`
  - Builds `apps/admin` then builds `server` and packages Admin under `server/static`
  - Exposes `4010` and runs `node server/dist/index.js`
- Local compose: `infra/docker-compose.yml`
  - `cms-api` (builds via `server/Dockerfile`)
  - `postgres` + `redis`
