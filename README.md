# Nimbus Cannabis OS CMS (Sanity + Express)

A multi-tenant, cannabis-focused CMS tailored for mobile and web apps. Provides a Sanity-backed content API, Admin SPA, and Studio for editorial workflows.

## Quick marketing blurb

Multi-tenant CMS with Sanity at its core, offering brand and store scoping, legal/versioned content, analytics hooks, and a simple Admin SPA for theming and asset management.

## Quickstart

1. Clone the repo:

```bash
git clone <repo-url>
cd nimbus-cms
```

2. Copy env and install:

```bash
cp .env.example .env
# fill env vars: SANITY_PROJECT_ID, SANITY_DATASET, SANITY_API_TOKEN,
# SANITY_PREVIEW_TOKEN, JWT_SECRET, PREVIEW_SECRET, ANALYTICS_INGEST_KEY
npm install
```

3. Run locally (Studio + API):

```bash
npm run dev
```

4. Start Admin SPA in dev:

```bash
npm run dev:admin
```

## Overview (text diagram)

Studio → Sanity → CMS API → Mobile / Admin SPA

- Editors use Studio to author & publish
- CMS API queries Sanity and returns mobile-friendly JSON
- Admin SPA talks to protected `/api/admin/*` endpoints for theme and asset management

## Available npm scripts

Here are the important scripts (root `package.json`):

- `npm run dev` — start Studio and API in parallel
- `npm run dev:api` — start API in dev (ts-node + nodemon)
- `npm run dev:studio` — run Studio dev server
- `npm run dev:admin` — run Admin SPA in dev
- `npm run build:api` — compile server TypeScript (outputs to `server/dist`)
- `npm run start:api` — run compiled API
- `npm run build:admin` — build Admin SPA for production
- `npm run start:admin` — preview built Admin SPA
- `npm test` — run test suite (vitest)
- `npm run test:a11y` — run pa11y against a running admin preview (serve `apps/admin/dist` on port 8080 first)
- `npm run cms:export` / `cms:import` / `cms:promote` — content migration helpers

## Deployment Verification (Docker + CI)

- The production artifact ships through a three-stage Docker build: `admin-builder` compiles the Vite Admin SPA, `api-builder` compiles the Express API and embeds the admin assets, and `runtime` (node:20-slim) publishes only the compiled output.
- The Admin SPA is validated at build time—if `apps/admin/dist` is missing or empty, the Docker build fails immediately, blocking regressions.
- GitHub Actions (`.github/workflows/docker-build.yml`) automatically runs `docker build`, spins up a throwaway container, and inspects `/app/server/admin-dist` to guarantee the admin bundle ships with the API image.
- The workflow copies `admin-dist` out of the container to prove the assets exist and are non-empty, preventing broken console deploys from reaching buyers.
- Keeping the Admin SPA inside the final runtime image—and checking for it in CI—protects production stability and ensures every release is verifiable end-to-end.

Buyers can run the same checks locally before promotion:

```bash
docker build -t jars-cms-prod .
docker run -p 4010:4010 jars-cms-prod
```

## Analytics ingestion security

- Configure `ANALYTICS_INGEST_KEY` (or a comma-separated list of keys) in your environment.
- Every POST to `/analytics/event` must include:
	- `X-Analytics-Key`: one of the configured keys.
	- `X-Analytics-Signature`: `hex(HMAC_SHA256(rawBody, X-Analytics-Key))`.
- Requests without a valid key/signature are rejected with 401 and still counted toward the fallback rate limit.

Example client snippet:

```ts
import crypto from 'crypto'

const body = JSON.stringify({type: 'view', contentType: 'article', contentSlug: 'welcome'})
const key = process.env.ANALYTICS_INGEST_KEY!
const signature = crypto.createHmac('sha256', key).update(body).digest('hex')

await fetch('https://cms.example.com/analytics/event', {
	method: 'POST',
	headers: {
		'Content-Type': 'application/json',
		'X-Analytics-Key': key,
		'X-Analytics-Signature': signature,
	},
	body,
})
```

## Notes for buyers

- Ensure you set up a Sanity project and tokens. Use `SANITY_PREVIEW_TOKEN` for draft previews.
- Admin endpoints require an `admin_token` cookie (JWT) with appropriate roles.
- Review [`docs/RBAC_MATRIX.md`](./docs/RBAC_MATRIX.md) for the complete endpoint × role matrix before issuing admin credentials to partners.

For more details see `docs/ARCHITECTURE.md`, `docs/MOBILE_CONTRACT.md`, `docs/DEPLOYMENT.md`, `docs/STUDIO.md`, `docs/BUYER_OVERVIEW.md`, [`docs/API_REFERENCE_ADMIN.md`](./docs/API_REFERENCE_ADMIN.md), and [`docs/SECURITY_NOTES.md`](./docs/SECURITY_NOTES.md).
