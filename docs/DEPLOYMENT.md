# Deployment and Local Runbook

This document explains how to run and build the API, Studio, and Admin SPA, plus notes for Docker and migration scripts.

## Quick local run

1. Copy env file and fill in required values:

```bash
cp .env.example .env
# fill SANITY_PROJECT_ID, SANITY_DATASET, SANITY_API_TOKEN,
# SANITY_PREVIEW_TOKEN, PREVIEW_SECRET, JWT_SECRET, ANALYTICS_INGEST_KEY

> SECURITY NOTE: Do NOT commit real tokens. Create real secrets in your deployment environment and
> add them to your environment or secret manager. Rotate any tokens that may have been exposed.
```

2. Install dependencies:

```bash
# Prefer pnpm in this workspace.
# If you don't have pnpm installed, this repo works fine with:
#   npx -y pnpm@9.15.0 install --frozen-lockfile
pnpm install --frozen-lockfile
```

3. Start the Studio and API in development (parallel):

```bash
pnpm studio:dev
pnpm server:dev
```

4. Start Admin SPA (admin UI) in dev:

```bash
pnpm admin:dev
```

5. Start API only in dev (watch + ts-node):

```bash
pnpm server:dev
```

6. Build & run production API locally:

```bash
pnpm server:build
pnpm -C server start
```

## Build Admin SPA

- Build the Admin SPA (Vite/React) for production:

```bash
pnpm admin:build
```

- Preview the built Admin SPA (runs the preview server from the admin app):

```bash
pnpm -C apps/admin preview
```

## Build Admin SPA

- Build the Admin SPA (Vite/React) for production:

```bash
npm run build:admin
```

- Preview the built Admin SPA (runs the preview server from the admin app):

```bash
npm run start:admin
```

## Docker (server)

From repository root you can build a Docker image for the compiled server:

```bash
docker build -f server/Dockerfile -t nimbus-cms-server:latest .
```

Run with env file:

```bash
docker run -p 4010:4010 --env-file .env nimbus-cms-server:latest
```

Notes:

- The Dockerfile expects the server to be built with `npm run build:api` (which outputs `server/dist`) before the image is used, or the Dockerfile may build inside the image depending on its config.
- Ensure `SANITY_*` env vars and `SANITY_API_TOKEN` with write permissions are provided when running migrations or import scripts.

### Build the server Docker image

From repository root (after `npm run build:api`):

```bash
docker build -f server/Dockerfile -t nimbus-cms-server:latest .
```

If you want to test the Docker image locally:

```bash
docker run -p 4010:4010 --env-file .env nimbus-cms-server:latest
```

## Export / Import / Promote scripts

- `pnpm cms:export` — export a snapshot of documents to `backups/`
- `pnpm cms:import` — import a snapshot into the configured `SANITY_DATASET`
- `pnpm cms:promote` — promote documents from one dataset to another (set `SANITY_SOURCE_DATASET` and `SANITY_TARGET_DATASET`)

Safety flags supported by those scripts: `--dry-run`, `--force`.

### Examples and step-by-step

1. Export current dataset to a backup file

```bash
# ensure env vars are set in your shell or .env
export SANITY_PROJECT_ID=yourProject
export SANITY_DATASET=production
export SANITY_API_TOKEN=xxxx

# run export (writes backups/export-YYYYMMDD.json)
pnpm cms:export
```

2. Import into a dataset (dry-run first)

```bash
# target dataset configured via SANITY_DATASET
export SANITY_PROJECT_ID=yourProject
export SANITY_DATASET=staging
export SANITY_API_TOKEN=xxxx

# run a dry-run to see what would change
pnpm cms:import -- ./backups/export-20251119.json --dry-run

# To actually apply and force replacements of existing docs
pnpm cms:import -- ./backups/export-20251119.json --force
```

3. Promote from one dataset to another (dry-run first)

```bash
# set source and target datasets
export SANITY_PROJECT_ID=yourProject
export SANITY_SOURCE_DATASET=staging
export SANITY_TARGET_DATASET=production
export SANITY_API_TOKEN=xxxx

# dry-run to preview changes
pnpm cms:promote -- --dry-run

# perform promotion (use --force to overwrite existing ids)
pnpm cms:promote -- --force
```

### Caveats and notes

- These scripts assume `SANITY_API_TOKEN` has the appropriate permissions (read for export, write for import/promote). Prefer creating a token with minimal necessary scopes.
- The export script pages results to avoid loading very large datasets into memory. It still writes a single JSON file that can be large for big datasets — consider compressing the file after export.
- The import script attempts to preserve deterministic ids when possible (uses `_id` or generates ids from slugs) to keep imports idempotent. When importing into a dataset that already contains documents with the same ids, use `--force` to replace.
- All scripts include basic retry logic for Sanity calls and will fail fast if required environment variables are missing.
- For large migrations consider using official Sanity import/export tooling or run the promote script in batches.

## Troubleshooting

- If multipart uploads fail, ensure `multer` is installed (it's used by the server multipart upload route). The server includes a JSON dataURL fallback path to allow uploads when `multer` isn't available.
- If logo uploads fail with `UNSUPPORTED_FILE_TYPE` or `FILE_TOO_LARGE`, verify the file is PNG/JPG/SVG/WebP and under the `MAX_LOGO_BYTES` limit (defaults to 2 MB). Increase the env var and matching Admin SPA copy if you want to allow larger assets.
- For preview/draft content make sure `SANITY_PREVIEW_TOKEN` is set and use `X-Preview: true` or `?preview=true` when calling endpoints.

## New security & runtime configuration

The server now supports additional environment variables to harden runtime behavior. These should be set in your deployment environment (not committed to source control).

- `CORS_ORIGINS` (comma-separated list) — required in production. The API rejects boot if the variable is missing or empty outside local development. Example: `https://app.example.com,https://studio.example.com`. Locally the server falls back to `http://localhost:3000,http://localhost:5173` for convenience.
- `JWT_SECRET` — secret used to sign admin session tokens. Must be ≥32 random characters; production boot now fails if the secret is weak or missing. Rotate regularly.
- `PREVIEW_SECRET` — secret compared against the `X-Preview-Secret` header or `?secret=` query param before draft content is returned. Required when preview mode is exposed.
- `ADMIN_LOGIN_RATE_LIMIT_WINDOW_MS` & `ADMIN_LOGIN_RATE_LIMIT_MAX` — configure the admin login rate limiter window (ms) and max requests per window. Defaults: `60000` (1 minute) and `8` respectively.
- `ANALYTICS_RATE_LIMIT_WINDOW_MS` & `ANALYTICS_RATE_LIMIT_MAX` — configure rate limiting for analytics event ingestion. Defaults: `60000` (1 minute) and `60` respectively.
- `ANALYTICS_FALLBACK_RATE_WINDOW_MS` & `ANALYTICS_FALLBACK_RATE_MAX` — IP scoped limiter applied before writes hit Sanity in case API keys/signatures leak. Defaults: `60000` and `120`.
- `ANALYTICS_INGEST_KEY` — comma-separated list of shared secrets. Clients must send `X-Analytics-Key` and `X-Analytics-Signature` (HMAC-SHA256 raw body) with every `/analytics/event` POST.
- `MAX_LOGO_BYTES` — maximum allowed bytes for logo uploads (defaults to 2 MB). The Admin SPA enforces the same limit client-side. Adjust if you expect larger SVGs and ensure `JSON_BODY_LIMIT` comfortably exceeds the encoded payload size.
- `JSON_BODY_LIMIT` — override the limit used by `express.json` (default `4mb`). Increase if you allow larger base64 uploads.
- `ENABLE_COMPLIANCE_SCHEDULER` — set to `true` on exactly one instance to run the scheduled compliance snapshot job on boot. Requires write access to Sanity; leave `false` (or unset) on all other replicas to avoid duplicate runs.
- `COMPLIANCE_OVERVIEW_CACHE_TTL_MS` — optional override for the admin compliance overview cache TTL (default `60000`).

### Running the compliance scheduler safely

- Choose a single "leader" instance (for example: the first ECS task, a specific Kubernetes StatefulSet ordinal, or a singleton worker) and set `ENABLE_COMPLIANCE_SCHEDULER=true` only there. All other replicas should omit the flag so they don't start duplicate snapshot jobs.
- Surface an `INSTANCE_ID` (or rely on `HOSTNAME`) so logs show which node is running the scheduler. The API now logs this value on boot when the scheduler starts.
- Wire your monitoring/alerting to watch for `admin.compliance.snapshot_run` logs or the `complianceMonitor` Sanity document so you can confirm the single instance is executing snapshots as expected.
- `LOG_LEVEL` — optional; set to `debug` to include debug-level logs. Defaults to emitting info/warn/error only.

Analytics tuning

- `ANALYTICS_WINDOW_DAYS` — historic window (days) used to compute demand metrics and series. Default: `30`.
- `ANALYTICS_RECENT_DAYS` — recent window (days) used to weight recent activity. Default: `7`.
- `ANALYTICS_WEIGHT_RECENT_CLICKS`, `ANALYTICS_WEIGHT_RECENT_VIEWS`, `ANALYTICS_WEIGHT_HISTORIC_CLICKS`, `ANALYTICS_WEIGHT_HISTORIC_VIEWS` — numeric weights applied when computing the demandScore. Defaults: `2.5`, `0.2`, `1`, `0.05` respectively.
- `ANALYTICS_THRESHOLD_RISING`, `ANALYTICS_THRESHOLD_STEADY`, `ANALYTICS_THRESHOLD_FALLING` — thresholds for classifying demand status. Defaults: `200`, `40`, `10`.

You can also pass query parameters to the overview endpoint `/api/admin/analytics/overview` to override window sizes and weights per-request:

- `windowDays`, `recentDays`, `wRecentClicks`, `wRecentViews`, `wHistoricClicks`, `wHistoricViews`

Example: `/api/admin/analytics/overview?windowDays=14&recentDays=3&wRecentClicks=3`

Recommendation: Configure these vars in your host's secret manager (Vercel, Netlify, Docker secrets, Kubernetes secrets) and avoid placing them in `.env` committed files. If you suspect a secret was committed, rotate it immediately.

## Observability and log forwarding

- The API emits newline-delimited JSON logs via `server/src/lib/logger.ts`. Use your platform's log drains (e.g., CloudWatch, Datadog, Logtail) to ingest them without additional agents.
- Incoming requests automatically receive a `requestId`. If you already add an `X-Request-Id` or `X-Correlation-Id` header at the edge/load-balancer, the middleware will reuse it so you can correlate across services.
- Each request surfaces lifecycle events (`request.start`, `request.complete`, `request.aborted`) with latency, status code, and response byte size, which makes it easy to build RED dashboards.
- All route handlers call `req.log.*` so structured error fields (e.g., `error.message`, `stack`) stay machine-readable. Avoid `console.*` outside of the logger to maintain consistent output.
- Flip `LOG_LEVEL=debug` temporarily during incidents to capture verbose insights; remember to remove it or revert to the default level after debugging to keep logs lean.

## Staging deploy checklist (Demo/Preview)

This repo supports a "demo" (`nimbus_demo`) and "preview" (`nimbus_preview`) staging posture.
See `ENV_VARIABLES.md` for the recommended URL/dataset mapping.

**API (Railway) – demo/preview**

- Set `APP_ENV` to `demo` or `preview`.
- Set `SANITY_PROJECT_ID` and `SANITY_DATASET` to match (e.g. `nimbus_demo`).
- Ensure `CORS_ORIGINS` includes your Vercel Admin + Vercel Studio hosts.
- Ensure `DATABASE_URL` is set (Railway Postgres) and run migrations (`prisma migrate deploy`).
- If using Redis-backed caching/rate-limits, set `REDIS_URL`.

**Admin (Vercel) – demo/preview**

- Set `VITE_NIMBUS_API_URL` to your Railway API base (example: `https://<railway-host>/api/v1/nimbus`).
- Deploy using the repo-root `vercel.json` (configured for `apps/admin`).

**Studio (Vercel) – demo**

- Set `SANITY_STUDIO_PROJECT_ID` and `SANITY_STUDIO_DATASET=nimbus_demo`.
- In Vercel, set the Project Root Directory to `apps/studio`.

### Verification

Run the smoke check against your deployment:

```bash
pnpm smoke:check -- https://your-api-host
# or without installing pnpm globally:
# npx -y pnpm@9.15.0 smoke:check -- https://your-api-host
```

### One-shot local staging loop (Docker)

If you have Docker Desktop installed, this repo includes a single command to:
bring up Postgres+Redis+API, run Prisma migrate/seed, and smoke-check `/healthz`,
`/api/v1/status`, and `/admin`.

```bash
./scripts/run-local-staging-check.sh
```

### Seeding (demo)

Seed Sanity demo content (products, legal docs, theme):

```bash
export SANITY_PROJECT_ID=yourProject
export SANITY_DATASET=nimbus_demo
export SANITY_WRITE_TOKEN=yourWriteToken
pnpm seed:sanity:demo
```

Seed relational DB (if used):

```bash
pnpm install
pnpm prisma migrate deploy
pnpm prisma db seed
```
