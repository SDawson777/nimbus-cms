# Deployment and Local Runbook

This document explains how to run and build the API, Studio, and Admin SPA, plus notes for Docker and migration scripts.

## Quick local run

1. Copy env file and fill in required values:

```bash
cp .env.example .env
# fill SANITY_PROJECT_ID, SANITY_DATASET, SANITY_API_TOKEN, SANITY_PREVIEW_TOKEN, JWT_SECRET
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

## Export / Import / Promote scripts

- `npm run cms:export` — export a snapshot of documents to `backups/`
- `npm run cms:import` — import a snapshot into the configured `SANITY_DATASET`
- `npm run cms:promote` — promote documents from one dataset to another (set `SANITY_SOURCE_DATASET` and `SANITY_TARGET_DATASET`)

Safety flags supported by those scripts: `--dry-run`, `--force`.

## Troubleshooting

- If multipart uploads fail, ensure `multer` is installed (it's used by the server multipart upload route). The server includes a JSON dataURL fallback path to allow uploads when `multer` isn't available.
- For preview/draft content make sure `SANITY_PREVIEW_TOKEN` is set and use `X-Preview: true` or `?preview=true` when calling endpoints.
