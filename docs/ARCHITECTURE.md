# Project Architecture and Canonical Locations

This document clarifies which folders are canonical and which are legacy/archived copies. It is intended for buyers and maintainers to avoid confusion.

Canonical (current)

- `server/` — The canonical TypeScript Express CMS API. This is the production API used by the mobile app and should be considered the source of truth for API routes, preview handling, and content responses.
- `apps/studio/` — The canonical Sanity Studio for editors. This is the admin UI that talks to the same Sanity project/dataset as the `server/` API.
- `docs/` — Documentation for architecture, studio setup, and migration notes.

# Project architecture and canonical locations

This document explains where the canonical code and responsibilities live, how the pieces fit together, and highlights the multi-tenant model, admin SPA, analytics, and theming support.

## Canonical components

- `server/` — The TypeScript Express CMS API. This is the canonical runtime that serves the mobile-friendly `/content/*` endpoints and the admin `/api/*` endpoints. It wires to Sanity using `@sanity/client`, supports preview mode, deterministic writes, RBAC, and theming.
- `apps/studio/` — The Sanity Studio where editors/publishers manage content, legal packs, and brand/store documents. Studio schemas live here and are the source of truth for document shapes.
- `apps/admin/` — The Admin SPA (React + Vite) used by product and marketing teams to edit theme settings, upload assets, and manage administrative workflows.

## Multi-tenant model

The codebase supports optional multi-tenant scoping at the org/brand/store level. The API accepts optional query params and request fields (e.g. `org`, `brand`, `store`) and resolves those slugs into Sanity references when writing/updating documents. Theme documents are created with deterministic `_id` patterns (for idempotent upserts) like `themeConfig-<brand>` or `themeConfig-<brand>-store-<store>`.

## Theming and assets

- Themes are stored as `themeConfig` documents in Sanity and include colors, typography, and `logo` (image reference). The server persists canonical Sanity asset references (asset id) and `logo.alt` for accessibility.
- Themes are stored as `themeConfig` documents in Sanity and include colors, typography, and `logo` (image reference). Each `themeConfig` can be brand-level or a store-level override. The server persists canonical Sanity asset references (asset id) and `logo.alt` for accessibility.
- The theme engine resolves configuration using the precedence: store-level override -> brand-level theme -> global default (no brand/store). The `/content/theme` endpoint returns a flattened contract designed for multi-frontend consumption (mobile, web, kiosks).
- The Admin SPA uploads logos using a multipart-first strategy with a JSON dataURL fallback so environments without `multer` still work. Uploads are validated server- and client-side for file type (PNG/JPG/SVG/WebP) and size (`MAX_LOGO_BYTES`, defaults to 2 MB) to enforce branding policies.

## Live Retail Intelligence Dashboard

- The Admin Dashboard aggregates content metrics, per-store engagement, top content, and product demand signals. It's powered by the analytics subsystem and now hydrates directly from `/api/admin/analytics/overview`, showing cache status and day-over-day deltas for top-demand products out of the box.

## Compliance automation

- A compliance engine evaluates required legal documents per-store and computes a compliance score. The engine prefers state-scoped documents and supports snapshotting for audit.
- The admin compliance overview endpoint now memoizes live computations for 60 seconds (`COMPLIANCE_OVERVIEW_CACHE_TTL_MS` override) and falls back to cached snapshots when available, exposing the cache mode via `X-Compliance-Cache` headers (`SNAPSHOT`, `MISS`, `HIT`).

## Advanced theming and omnichannel

- The system supports channel-aware content (channels: mobile, web, kiosk, email, ads) and admin previews per channel. Themes are resolved by store->brand->global precedence and provided as a flattened contract for clients.

## Retail operations automations (scheduling, recall)

- Content documents (articles, deals, promos) support optional `schedule` objects (publishAt, unpublishAt, isScheduled) evaluated at read-time so editors can schedule visibility windows without separate jobs.
- Products support recall flags (`isRecalled`, `recallReason`). Admin endpoints and UI default to hiding recalled products; a recall audit document is written when recalls are toggled.

## Personalization engine

- Admin-authored `personalizationRule` documents allow editors to declare condition -> action mappings that boost priority for matching content. The server exposes `POST /personalization/apply` which evaluates enabled rules against a user context and returns scored, ordered candidates. Rules are simple, extendable, and stored in Sanity so editors can manage them in Studio.

## Admin SPA and RBAC

- The Admin SPA talks to protected `/api/admin/*` endpoints guarded by a JWT cookie (`admin_token`) and role-based middleware (`requireRole`). Requests also require a CSRF token (`admin_csrf` cookie + `X-CSRF-Token` header) issued by the API, aligning SPA fetches and Vitest suites with the same middleware.
- A complete endpoint × role matrix lives in [`docs/RBAC_MATRIX.md`](./RBAC_MATRIX.md) so buyers can see exactly which routes are available per role and how brand/store scope is enforced.

### Role hierarchy

| Role | Scope | Typical permissions |
| --- | --- | --- |
| OWNER | Global | Full superuser control across every tenant. |
| ORG_ADMIN | Organization | Analytics + compliance across their org (and its brands/stores). |
| BRAND_ADMIN | Brand | Manage one brand and all of its stores. |
| EDITOR | Brand | Author content + theming for their assigned brand and its stores. |
| STORE_MANAGER | Store | Operate only on their specific store overrides. |
| VIEWER | Scoped read | Read-only dashboards scoped by their token (often brand/store). |

### Theme API scope enforcement

Theme endpoints now enforce tenant scope in addition to the minimum role. Brand/store slugs baked into the admin token must match the brand/store being queried or mutated, unless the user is an OWNER/ORG_ADMIN (global) or BRAND_ADMIN (brand-wide).

| Endpoint | Minimum role | Scope behavior |
| --- | --- | --- |
| `GET /api/admin/theme` | VIEWER | Requires `brand` query to match the caller's brand; optional `store` must match their store slug (or belong to their brand). |
| `POST /api/admin/theme` | EDITOR | Caller must have access to the target brand; store overrides require brand match or the exact store slug (for store managers). |
| `GET /api/admin/theme/configs` | VIEWER | Rejects brand/store filters outside the caller's scope and automatically narrows results to their brand/store when no filters are provided. |
| `POST /api/admin/theme/config` | EDITOR | Enforces brand + store scope before writing Sanity documents. |
| `DELETE /api/admin/theme/config/:id` | EDITOR | Loads the target config, verifies ownership, and only then deletes it. |

Helpers (`ensureBrandScope`/`ensureStoreScope`) wrap these checks, so future theme endpoints inherit the same RBAC guarantees without duplicating logic.

## Analytics & content metrics

- `/analytics/event` ingestion requires an `X-Analytics-Key` from `ANALYTICS_INGEST_KEY` and an `X-Analytics-Signature` header (HMAC-SHA256 of the raw JSON body). Requests pass through a shared-key limiter and an IP fallback limiter before Sanity writes.
- Aggregated overview responses are cached in-memory and persisted in Sanity (`analyticsOverviewCache` docs) so multi-instance deployments stay in sync and can report cache hits to the dashboard via `X-Analytics-Overview-Cache`.
- The analytics subsystem remains decoupled and can be swapped for an external provider by replacing `server/src/routes/analytics.ts`.

## Observability & logging

- The Express server emits structured JSON logs via `server/src/lib/logger.ts`. Every log entry includes a timestamp, level, process metadata, and any structured fields you pass.
- A request-scoped middleware (`requestLogger`) assigns a `requestId` (honoring inbound `X-Request-Id`/`X-Correlation-Id` headers when supplied) and attaches `req.log`, a child logger enriched with `requestId`, `method`, and `path` for the lifetime of the request.
- Request lifecycle events (`request.start`, `request.complete`, `request.aborted`) automatically record duration, status code, and response size so dashboards can ingest latency/error metrics without additional agents.
- All route handlers and background jobs should call `req.log`/`logger` instead of `console.*`; this keeps stack traces and metadata structured for observability platforms.
- Enable verbose debug logs by setting `LOG_LEVEL=debug` (defaults to info/warn/error only).

## Legal/versioning

- Legal documents (terms, privacy, accessibility, ageGate) are versioned and time-windowed with `effectiveFrom` and optional `effectiveTo`. The API returns the most recent applicable document per-request and supports `state` scoping for US-state-specific legal content.

## Compliance engine

- The server includes a lightweight compliance engine that evaluates per-store compliance with required legal document types (for example: `terms`, `privacy`, `accessibility`, `ageGate`).
- Implementation details:
  - `server/src/lib/compliance.ts` fetches stores and currently effective `legalDoc` documents and prefers state-specific documents with a fallback to a global `legalDoc` (no `stateCode`).
  - For tie-breaking between multiple current legal docs the engine prefers a numeric `version` (if parseable) otherwise the latest `effectiveFrom` date.
  - The engine computes a `complianceScore` (0–100) = percentage of required types present, lists `missingTypes`, and returns `currentLegalDocs` for quick inspection.
  - The admin endpoint `GET /api/admin/compliance/overview` exposes per-store compliance (protected with `ORG_ADMIN` role) and supports an optional `types` query parameter to customize required types.

  ## Personalization engine (rule-based)

  This project includes a lightweight, admin-driven personalization engine that lets editors define rules which map user attributes to prioritized content. Rules are stored in Sanity as `personalizationRule` documents and are evaluated at request-time by the server.

  Key points:
  - Rules are authored in Studio and include `conditions` (key/operator/value) and `actions` (targetType, targetSlugOrKey, priorityBoost, optional channel).
  - Operators supported: `equals`, `in`, `lessThan`, `greaterThanOrEqual`.
  - The server exposes a public endpoint `POST /personalization/apply` that accepts a user context and content type and returns a score-sorted list of content candidates.
  - Evaluation is best-effort and read-only; personalization does not change canonical content documents.
  - Admins can list rules via `GET /api/admin/personalization/rules` and simulate results in the Admin SPA.

## Studio and schema notes

- The canonical Sanity schema for legal documents is `legalDoc` (document). Fields include `title`, `slug`, `type` (terms/privacy/accessibility/ageGate/disclaimer), `stateCode` (optional), `version`, `effectiveFrom`, optional `effectiveTo`, `body`, and internal `notes`.
- The Studio desk structure groups legal documents by type and state and provides quick access to global vs state-scoped docs.

## Environment variables

Key env vars (see `.env.example`):

- `SANITY_PROJECT_ID`, `SANITY_DATASET`
- `SANITY_API_TOKEN`, `SANITY_PREVIEW_TOKEN`, `PREVIEW_SECRET`
- `JWT_SECRET` (admin token signing)
- `ANALYTICS_INGEST_KEY` (comma-separated shared keys for analytics clients)
- `MAX_LOGO_BYTES`, `JSON_BODY_LIMIT` (govern logo upload size / JSON payload parsing)
- `ENABLE_COMPLIANCE_SCHEDULER` (set to `true` on exactly one instance to run the scheduled compliance snapshot job)
- `COMPLIANCE_OVERVIEW_CACHE_TTL_MS` (optional; defaults to 60s)
- `LOG_LEVEL` (optional; set to `debug` to emit debug-level logs)

## Reference docs

- [`docs/RBAC_MATRIX.md`](./RBAC_MATRIX.md) — endpoint × role matrix plus scope expectations.
- [`docs/API_REFERENCE_ADMIN.md`](./API_REFERENCE_ADMIN.md) — request/response contracts for `/api/admin/*` routes.
- [`docs/SECURITY_NOTES.md`](./SECURITY_NOTES.md) — threat model, scheduler guidance, and secret hygiene checklist.
- [`docs/PERSONALIZATION_CLIENT_GUIDE.md`](./PERSONALIZATION_CLIENT_GUIDE.md) — deep dive on `/personalization/apply` usage.

## Handoff and governance notes

- Focus on `server/`, `apps/studio/`, and `apps/admin/` when onboarding a buyer.
- Keep legacy folders (`jars-cms/`, `jars-cms-api/`, `jars-mobile-app/`) as archives; they are not the canonical runtime.

If you need an architecture diagram, a simple flow is: Studio → Sanity → CMS API → Mobile / Admin SPA
