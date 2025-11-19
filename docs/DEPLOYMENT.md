# Deployment and Local Runbook

This document explains how to run and build the API, Studio, and Admin SPA, plus notes for Docker and migration scripts.

## Quick local run

1. Copy env file and fill in required values:

```bash
cp .env.example .env
# fill SANITY_PROJECT_ID, SANITY_DATASET, SANITY_API_TOKEN, SANITY_PREVIEW_TOKEN, JWT_SECRET

> SECURITY NOTE: Do NOT commit real tokens. Create real secrets in your deployment environment and
> add them to your environment or secret manager. Rotate any tokens that may have been exposed.
```

2. Install dependencies:

```bash
npm install
```

3. Start the Studio and API in development (parallel):

```bash
npm run dev
```

4. Start Admin SPA (admin UI) in dev:

```bash
npm run dev:admin
```

5. Start API only in dev (watch + ts-node):

```bash
npm run dev:api
```

6. Build & run production API locally:

```bash
npm run build:api
npm run start:api
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
docker build -f server/Dockerfile -t jars-cms-server:latest .
```

Run with env file:

```bash
docker run -p 4010:4010 --env-file .env jars-cms-server:latest
```

Notes:

- The Dockerfile expects the server to be built with `npm run build:api` (which outputs `server/dist`) before the image is used, or the Dockerfile may build inside the image depending on its config.
- Ensure `SANITY_*` env vars and `SANITY_API_TOKEN` with write permissions are provided when running migrations or import scripts.

### Build the server Docker image

From repository root (after `npm run build:api`):

```bash
docker build -f server/Dockerfile -t jars-cms-server:latest .
```

If you want to test the Docker image locally:

```bash
docker run -p 4010:4010 --env-file .env jars-cms-server:latest
```

## Export / Import / Promote scripts

- `npm run cms:export` — export a snapshot of documents to `backups/`
- `npm run cms:import` — import a snapshot into the configured `SANITY_DATASET`
- `npm run cms:promote` — promote documents from one dataset to another (set `SANITY_SOURCE_DATASET` and `SANITY_TARGET_DATASET`)

Safety flags supported by those scripts: `--dry-run`, `--force`.

### Examples and step-by-step

1. Export current dataset to a backup file

```bash
# ensure env vars are set in your shell or .env
export SANITY_PROJECT_ID=yourProject
export SANITY_DATASET=production
export SANITY_API_TOKEN=xxxx

# run export (writes backups/export-YYYYMMDD.json)
npm run cms:export
```

2. Import into a dataset (dry-run first)

```bash
# target dataset configured via SANITY_DATASET
export SANITY_PROJECT_ID=yourProject
export SANITY_DATASET=staging
export SANITY_API_TOKEN=xxxx

# run a dry-run to see what would change
npm run cms:import -- ./backups/export-20251119.json --dry-run

# To actually apply and force replacements of existing docs
npm run cms:import -- ./backups/export-20251119.json --force
```

3. Promote from one dataset to another (dry-run first)

```bash
# set source and target datasets
export SANITY_PROJECT_ID=yourProject
export SANITY_SOURCE_DATASET=staging
export SANITY_TARGET_DATASET=production
export SANITY_API_TOKEN=xxxx

# dry-run to preview changes
npm run cms:promote -- --dry-run

# perform promotion (use --force to overwrite existing ids)
npm run cms:promote -- --force
```

### Caveats and notes

- These scripts assume `SANITY_API_TOKEN` has the appropriate permissions (read for export, write for import/promote). Prefer creating a token with minimal necessary scopes.
- The export script pages results to avoid loading very large datasets into memory. It still writes a single JSON file that can be large for big datasets — consider compressing the file after export.
- The import script attempts to preserve deterministic ids when possible (uses `_id` or generates ids from slugs) to keep imports idempotent. When importing into a dataset that already contains documents with the same ids, use `--force` to replace.
- All scripts include basic retry logic for Sanity calls and will fail fast if required environment variables are missing.
- For large migrations consider using official Sanity import/export tooling or run the promote script in batches.

## Troubleshooting

- If multipart uploads fail, ensure `multer` is installed (it's used by the server multipart upload route). The server includes a JSON dataURL fallback path to allow uploads when `multer` isn't available.
- For preview/draft content make sure `SANITY_PREVIEW_TOKEN` is set and use `X-Preview: true` or `?preview=true` when calling endpoints.

## New security & runtime configuration

The server now supports additional environment variables to harden runtime behavior. These should be set in your deployment environment (not committed to source control).

- `CORS_ORIGINS` (comma-separated list) — when set, the API will only accept requests from the listed origins. Example: `https://app.example.com,https://studio.example.com`. If not set, a safe development default of `http://localhost:3000,http://localhost:5173` is used.
- `JWT_SECRET` — secret used to sign admin session tokens. Must be provided in production and rotated regularly.
- `ADMIN_LOGIN_RATE_LIMIT_WINDOW_MS` & `ADMIN_LOGIN_RATE_LIMIT_MAX` — configure the admin login rate limiter window (ms) and max requests per window. Defaults: `60000` (1 minute) and `8` respectively.
- `ANALYTICS_RATE_LIMIT_WINDOW_MS` & `ANALYTICS_RATE_LIMIT_MAX` — configure rate limiting for analytics event ingestion. Defaults: `60000` (1 minute) and `60` respectively.

Analytics tuning

- `ANALYTICS_WINDOW_DAYS` — historic window (days) used to compute demand metrics and series. Default: `30`.
- `ANALYTICS_RECENT_DAYS` — recent window (days) used to weight recent activity. Default: `7`.
- `ANALYTICS_WEIGHT_RECENT_CLICKS`, `ANALYTICS_WEIGHT_RECENT_VIEWS`, `ANALYTICS_WEIGHT_HISTORIC_CLICKS`, `ANALYTICS_WEIGHT_HISTORIC_VIEWS` — numeric weights applied when computing the demandScore. Defaults: `2.5`, `0.2`, `1`, `0.05` respectively.
- `ANALYTICS_THRESHOLD_RISING`, `ANALYTICS_THRESHOLD_STEADY`, `ANALYTICS_THRESHOLD_FALLING` — thresholds for classifying demand status. Defaults: `200`, `40`, `10`.

You can also pass query parameters to the overview endpoint `/api/admin/analytics/overview` to override window sizes and weights per-request:

- `windowDays`, `recentDays`, `wRecentClicks`, `wRecentViews`, `wHistoricClicks`, `wHistoricViews`

Example: `/api/admin/analytics/overview?windowDays=14&recentDays=3&wRecentClicks=3`

Recommendation: Configure these vars in your host's secret manager (Vercel, Netlify, Docker secrets, Kubernetes secrets) and avoid placing them in `.env` committed files. If you suspect a secret was committed, rotate it immediately.
