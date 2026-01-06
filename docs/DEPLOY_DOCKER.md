# Deploy with Docker (Nimbus CMS)

This guide explains how to run Nimbus CMS via Docker for local development or production-like deployments.

## What you can deploy with Docker in this repo

- **API only** using root `Dockerfile` (port `8080`)
- **API + Admin SPA bundled** using `server/Dockerfile` (port `4010`)

Local dev is provided via `infra/docker-compose.yml`.

## Option A: Local dev with Docker Compose (recommended)

Uses:
- API + bundled Admin build (`server/Dockerfile`)
- Postgres (`postgres:16-alpine`)
- Redis (`redis:7-alpine`)

From repo root:

```bash
docker compose -f infra/docker-compose.yml up --build
```

Defaults:
- API: `http://localhost:4010`
- Postgres: `postgresql://postgres:postgres@localhost:5432/nimbus?schema=public`
- Redis: `redis://localhost:6379`

Notes:
- The compose file sets `DATABASE_URL` and `REDIS_URL` defaults for the API container.
- For Sanity-backed content endpoints, you must also provide Sanity env vars to the API container (see “Required env” below).

## Option B: Production-like single container (API + Admin bundled)

Build:

```bash
docker build -f server/Dockerfile -t nimbus-cms:bundle .
```

Run (minimum example):

```bash
docker run --rm -p 4010:4010 \
  -e NODE_ENV=production \
  -e PORT=4010 \
  -e DATABASE_URL="postgresql://..." \
  -e JWT_SECRET="..." \
  -e SANITY_PROJECT_ID="..." \
  -e SANITY_DATASET_DEFAULT="..." \
  -e SANITY_API_TOKEN="..." \
  -e CORS_ORIGIN_ADMIN="https://your-admin.example.com" \
  nimbus-cms:bundle
```

- Admin SPA (bundled): `http://localhost:4010/admin`
- API health: `http://localhost:4010/healthz`
- API readiness: `http://localhost:4010/ready`

## Option C: API-only container

Build:

```bash
docker build -t nimbus-cms:api .
```

Run:

```bash
docker run --rm -p 8080:8080 \
  -e NODE_ENV=production \
  -e PORT=8080 \
  -e DATABASE_URL="postgresql://..." \
  -e JWT_SECRET="..." \
  -e SANITY_PROJECT_ID="..." \
  -e SANITY_DATASET_DEFAULT="..." \
  -e SANITY_API_TOKEN="..." \
  -e CORS_ORIGIN_ADMIN="https://your-admin.example.com" \
  nimbus-cms:api
```

## Required env (API)

Minimum to boot:
- `DATABASE_URL`
- `JWT_SECRET`

Required for Sanity-backed content in production-like environments:
- `SANITY_PROJECT_ID`
- `SANITY_DATASET_DEFAULT` (or `SANITY_STUDIO_DATASET`)
- `SANITY_API_TOKEN`

CORS:
- The CORS middleware uses per-client allowlists:
  - `CORS_ORIGIN_ADMIN`
  - `CORS_ORIGIN_MOBILE`
- Preview-mode allowlist controls:
  - `APP_ENV=preview`
  - `PREVIEW_ALLOW_ALL=true` (avoid in production)
  - `PREVIEW_ALLOWED_ORIGINS=https://...,https://...`

Note: `server/src/middleware/validateEnv.ts` also validates `CORS_ORIGINS` (comma-separated). Align your deployment with the values used by `server/src/middleware/cors.ts`.

## Database migrations / Prisma

The Docker images include Prisma runtime dependencies and copy `prisma/schema.prisma` into the image. Apply migrations using your standard Prisma flow (deployment-specific), or run Prisma commands in a one-off container with the same env vars.

## Verification checklist

- `curl -i http://localhost:4010/healthz` → `200`
- `curl -i http://localhost:4010/ready` → `200` (requires DB + Sanity connectivity)
- Admin (bundled image): open `http://localhost:4010/admin`

## Reference artifacts

- API-only Dockerfile: `Dockerfile`
- Bundle Dockerfile: `server/Dockerfile`
- Local compose: `infra/docker-compose.yml`
