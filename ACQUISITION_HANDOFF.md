<!-- Acquisition handoff playbook for prospective buyers evaluating Nimbus Cannabis OS CMS -->

# Acquisition Handoff

## 1. Executive Summary
- Nimbus Cannabis OS CMS is a production-ready, multi-tenant content platform built on Sanity Studio, an Express API, and a hardened Admin SPA.
- It powers cannabis retail use cases (articles, deals, compliance assets) while preserving strict API compatibility with the mobile app contract documented in `docs/MOBILE_CONTRACT.md`.
- The codebase now ships with verifiable Docker + CI workflows so buyers can prove builds, assets, and API behavior before closing.

## 2. CMS Architecture Overview
- **Sanity Studio (`apps/studio`)** authoring surface for editors with schemas under `apps/studio/schemaTypes`.
- **Express API (`server/`)** exposes mobile and admin endpoints, reading from Sanity and local fallbacks when necessary.
- **Admin SPA (`apps/admin`)** React/Vite experience for operators (themes, personalization, uploads) secured via admin JWT cookies.
- **Shared content contracts** live under `docs/` and `schemaTypes/` to enforce consistency across Studio, API, and mobile.

## 3. Folder-by-Folder Explanation
| Path | Purpose |
| --- | --- |
| `apps/studio` | Sanity Studio config, schema modules, and preview helpers. |
| `apps/admin` | Vite-based Admin SPA with pages for analytics, compliance, personalization, and theming. |
| `server/` | Express API source (`server/src`), middleware, routes, and static admin fallback assets. |
| `schemaTypes/` | Build target exporting Studio schema arrays for other packages. |
| `docs/` | Architecture, deployment, buyer overview, release notes, and contracts. |
| `tests/` | Vitest suites covering admin settings, analytics, uploads, and cart actions. |
| `static/` | Shared static assets exposed by the API. |

## 4. Deployment Methods (Vercel + Railway + Docker)
- **Vercel:** Deploy `apps/studio` via `sanity deploy` or `npm run studio:deploy`. Preview callbacks route through `sanity.config.ts`.
- **Railway:** Use the new three-stage `server/Dockerfile` with `node:20-slim` runtime. Railway automatically builds the Docker image and runs `node server/dist/server.js` on port 4010.
- **Docker Anywhere:** `docker build -t nimbus-cms-prod .` emits a runtime image where `/app/server/admin-dist` ships inside the API container for easy static hosting. `docker run -p 4010:4010 nimbus-cms-prod` exposes the API.

## 5. CI/CD Validation Overview
- `.github/workflows/docker-build.yml` runs on pushes/PRs to `main`.
- Steps: checkout → Docker Buildx → `docker build` → container extraction → admin-dist validation → success message.
- Failures are descriptive (`::error::`) and block merges until the admin bundle is present and non-empty, ensuring reproducible releases across GitHub Actions and Railway.

## 6. Environment Variables Matrix
| Variable | Component | Required | Description |
| --- | --- | --- | --- |
| `SANITY_PROJECT_ID` | Server + Studio | Yes | Sanity project identifier (defaults to `ygbu28p2` locally).
| `SANITY_DATASET` | Server + Studio | Yes | Dataset name (`staging` / `production`).
| `SANITY_API_TOKEN` | Server | Yes | Read token for GROQ queries.
| `SANITY_PREVIEW_TOKEN` | Studio + API | Optional | Enables draft preview endpoints.
| `PREVIEW_SECRET` / `VITE_PREVIEW_SECRET` | Admin SPA + API | Optional | Token for preview URLs in admin flows.
| `VITE_STUDIO_URL` | Admin SPA | Optional | Deep links Admin SPA back into Studio.
| `JWT_SECRET` | Server | Yes | Signs admin session cookies.
| `ANALYTICS_INGEST_KEY` | Server | Optional | HMAC secret for analytics ingestion.
| `NODE_ENV` | All | Yes in prod | Toggles prod behaviors.
| `PORT` | Server | Optional | API listen port (defaults to 4010 via Docker CMD/expose).

## 7. Studio / Admin / Server Startup Instructions
- **Studio:** `npm run dev:studio` (or `npm run studio:build` for CI). Uses schemas in `apps/studio/schemaTypes`.
- **Admin SPA:** `npm run dev:admin` for Vite dev server, `npm run build:admin` + `npm run start:admin` for previewing built assets.
- **Server/API:** `npm run dev:api` for ts-node dev, `npm run build:api && npm run start:api` for compiled runs. Dockerized runtime automatically runs the compiled server.

## 8. API Contract Compatibility With Jars Mobile App
- The Express routes under `server/src/routes/content/*` adhere to payload structures documented in `docs/MOBILE_CONTRACT.md` and validated via `tests/*.test.ts`.
- Mobile apps can continue calling `/content/articles`, `/content/deals`, `/content/faq`, etc., without modification because no schema or route changes were required for this audit.

## 9. How to Use the Admin Console
1. Obtain an admin JWT cookie via the existing auth route (`/api/admin/login`).
2. Launch `npm run dev:admin` (local) or visit the hosted Admin SPA served from `/server/admin-dist` in production.
3. Manage themes, personalization rules, analytics toggles, and compliance snapshots in the respective pages.
4. All mutating requests automatically include CSRF tokens via `apps/admin/src/lib/csrf.ts`.

## 10. How to Manage Content in Sanity Studio
- Editors work inside `apps/studio`, using desk structure definitions in `apps/studio/sanity/deskStructure.ts` (see docs).
- New schemas are added under `apps/studio/schemaTypes/__cms` or `__admin`, then exported via `index.ts`.
- Publish flows respect Sanity roles; preview URLs rely on `PREVIEW_TOKEN_ENV` gating to avoid accidental exposure.

## 11. How Personalization Rules Work
- The `personalizationRule` schema captures `conditions` and `actions` used by the Admin SPA simulator (`apps/admin/src/pages/Personalization.jsx`).
- Operators can test rule outcomes via `/personalization/apply`, which echoes prioritized content plus rule metadata, ensuring deterministic scoring before deploying campaigns.

## 12. How Legal Packs / Compliance Work
- Compliance job code lives in `server/src/jobs/complianceSnapshotJob.ts`, writing `complianceSnapshot` documents for audit history.
- Legal packs (`legalPage` schemas) include versioning fields (`effectiveFrom`, `effectiveTo`, `stateCode`), and the API selects the latest effective document per state.
- Admin SPA compliance views expose toggle history to guarantee regulators can trace each change.

## 13. Buyer Checklist (Fast Validation)
1. `npm install` → `npm run test` (Vitest) to ensure unit coverage.
2. `npm run build:admin` and confirm `apps/admin/dist` exists.
3. `npm run studio:build` to validate schema wiring.
4. `docker build -t nimbus-cms-prod .` and check `/app/server/admin-dist` inside the image.
5. Hit `/status` and `/content/articles` after `docker run -p 4010:4010 nimbus-cms-prod`.
6. Review docs: `docs/ARCHITECTURE.md`, `docs/DEPLOYMENT.md`, `docs/MOBILE_CONTRACT.md`.

## 14. Recommended Long-Term Enhancements
- Add Playwright smoke tests for Admin SPA personalization journeys.
- Implement automated dataset promotion (staging → production) via Sanity webhooks.
- Adopt incremental static regeneration for public marketing pages backed by the API.
- Expand CI with security scans (npm audit, Snyk) and DAST coverage for admin endpoints.

## 15. Support & Documentation Expectations
- Core documentation resides in `/docs` (architecture, deployment, contracts, studio guidance).
- Release cadence and CMS change logs are maintained in `docs/CMS_RELEASE_NOTES.md`.
- Production handovers should include Sanity project ownership transfer, API token rotation, and environment variable verification per Section 6.
- Buyers can contact the original maintainers via the channels listed in project documentation or migrate ownership by following the Sanity/Vercel/Railway transfer steps outlined above.
