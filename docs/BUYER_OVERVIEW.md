# Buyer overview

This is a concise summary you can hand to a buyer evaluating the CMS.

## What the CMS does

- Provides a content API (Express + TypeScript) that serves mobile-first endpoints under `/content/*` and admin endpoints under `/api/admin/*`.
- Uses Sanity as the content store and Sanity Studio for editorial workflows.
- Supports theming (colors, typography, logo), legal/versioned documents, articles, FAQs, filters, and product-listing admin endpoints.

## Key features

- Multi-tenant support: optional `org`, `brand`, and `store` scoping for content and themes.
- Admin SPA: React-based admin UI for theme editing, asset uploads, and quick admin workflows.
- Theming: deterministic theme documents with asset reference persistence and accessible `logo.alt` support.
- Legal pack & versioning: legal documents support state scoping and effective date ranges.
- Analytics hooks: lightweight content metrics and hooks for recording views and counters.
- Import/export/promote scripts for dataset migrations and snapshots.

## How it integrates with mobile/web

- Editors use Sanity Studio to create and publish content.
- The CMS API reads from Sanity and serves JSON to mobile/web clients.
- Mobile apps call `/content/*` endpoints; Admin SPA and integrations call `/api/admin/*`.
- Preview support: set `X-Preview: true` or `?preview=true` and the API will use `SANITY_PREVIEW_TOKEN`.

## What a buyer needs to configure

- A Sanity project with a dataset. Set `SANITY_PROJECT_ID` and `SANITY_DATASET`.
- API tokens: `SANITY_API_TOKEN` (read+write) and optionally `SANITY_PREVIEW_TOKEN`.
- `JWT_SECRET` used for admin token signing.
- Hosting for the API (Node host or Docker) and static hosting for Admin SPA (optional preview server included).
- CI that installs `multer` if you plan to use multipart uploads in CI integration tests.

## Quick win deployment checklist

- Create Sanity project and dataset, create API tokens.
- Copy `.env.example` → `.env` and fill values.
- Run `npm install`, `npm run build:api`, `npm run build:admin`.
- Deploy `server/dist` or build and run Docker image `server/Dockerfile`.
