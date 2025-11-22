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
- Analytics hooks: hardened, HMAC-authenticated ingestion API with persistent caching for dashboard queries.
- Import/export/promote scripts for dataset migrations and snapshots.
- Security posture: mandatory secrets, CSRF protection on all admin routes, and audit-friendly logging on preview/admin actions.

## Key value props for buyers

- Multi-tenant cannabis CMS: support multiple organizations, brands, and store-level overrides to run different brands or regions from a single codebase.
- Compliance engine: automated checks for required legal documents per store with versioning and snapshot capabilities for audits.
- Live retail intelligence dashboards: aggregated content and product demand analytics for marketing and ops.
- Omnichannel content delivery: channel-aware content (mobile/web/kiosk/email/ads) with previewing and targeted delivery.
- Personalization & analytics: admin-managed personalization rules and delivery-time evaluation for prioritized recommendations.

## How it integrates with mobile/web

- Editors use Sanity Studio to create and publish content.
- The CMS API reads from Sanity and serves JSON to mobile/web clients.
- Mobile apps call `/content/*` endpoints; Admin SPA and integrations call `/api/admin/*`.
- Preview support: set `X-Preview: true` or `?preview=true` and the API will use `SANITY_PREVIEW_TOKEN`.

## What a buyer needs to configure

- A Sanity project with a dataset. Set `SANITY_PROJECT_ID` and `SANITY_DATASET`.
- API tokens: `SANITY_API_TOKEN` (read+write) and optionally `SANITY_PREVIEW_TOKEN`.
- Secrets: `JWT_SECRET` (admin token signing) and `PREVIEW_SECRET` (preview gating with matching headers/queries).
- Analytics ingest key(s): `ANALYTICS_INGEST_KEY` (comma-separated list) used to HMAC-sign `/analytics/event` payloads. Clients must send `X-Analytics-Key` and `X-Analytics-Signature` on every request.
- Upload guardrails: optional `MAX_LOGO_BYTES` (defaults to 2 MB) and matching client-side validation so buyers can enforce branding policies.
- Hosting for the API (Node host or Docker) and static hosting for Admin SPA (optional preview server included).
- CI that installs `multer` if you plan to use multipart uploads in CI integration tests.
- Hosting for the API (Node host or Docker) and static hosting for Admin SPA (optional preview server included).
- CI that installs `multer` if you plan to use multipart uploads in CI integration tests.

## Quick win deployment checklist

- Create Sanity project and dataset, create API tokens.
- Copy `.env.example` → `.env` and fill values.
- Run `npm install`, `npm run build:api`, `npm run build:admin`.
- Deploy `server/dist` or build and run Docker image `server/Dockerfile`.
- Provide analytics ingest keys to trusted clients (mobile/web) and rotate them during handoff.
- (Optional) Enable the compliance snapshot scheduler by setting `ENABLE_COMPLIANCE_SCHEDULER=true` on exactly one instance and following the runbook in `docs/DEPLOYMENT.md`.
