# Jars CMS (Sanity + Express)

A multi-tenant, cannabis-focused CMS tailored for mobile and web apps. Provides a Sanity-backed content API, Admin SPA, and Studio for editorial workflows.

## Quick marketing blurb

Multi-tenant CMS with Sanity at its core, offering brand and store scoping, legal/versioned content, analytics hooks, and a simple Admin SPA for theming and asset management.

## Quickstart

1. Clone the repo:

```bash
git clone <repo-url>
cd jars-cms
```

2. Copy env and install:

```bash
cp .env.example .env
# fill env vars: SANITY_PROJECT_ID, SANITY_DATASET, SANITY_API_TOKEN, SANITY_PREVIEW_TOKEN, JWT_SECRET
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
- `npm run cms:export` / `cms:import` / `cms:promote` — content migration helpers

## Notes for buyers

- Ensure you set up a Sanity project and tokens. Use `SANITY_PREVIEW_TOKEN` for draft previews.
- Admin endpoints require an `admin_token` cookie (JWT) with appropriate roles.

For more details see `docs/ARCHITECTURE.md`, `docs/MOBILE_CONTRACT.md`, `docs/DEPLOYMENT.md`, `docs/STUDIO.md`, and `docs/BUYER_OVERVIEW.md`.
