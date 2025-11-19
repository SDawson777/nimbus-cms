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
- The Admin SPA uploads logos using a multipart-first strategy with a JSON dataURL fallback so environments without `multer` still work.

## Live Retail Intelligence Dashboard

- The Admin Dashboard aggregates content metrics, per-store engagement, top content, and product demand signals. It's powered by the analytics subsystem and can be extended to show custom KPIs.

## Compliance automation

- A compliance engine evaluates required legal documents per-store and computes a compliance score. The engine prefers state-scoped documents and supports snapshotting for audit.

## Advanced theming and omnichannel

- The system supports channel-aware content (channels: mobile, web, kiosk, email, ads) and admin previews per channel. Themes are resolved by store->brand->global precedence and provided as a flattened contract for clients.

## Retail operations automations (scheduling, recall)

- Content documents (articles, deals, promos) support optional `schedule` objects (publishAt, unpublishAt, isScheduled) evaluated at read-time so editors can schedule visibility windows without separate jobs.
- Products support recall flags (`isRecalled`, `recallReason`). Admin endpoints and UI default to hiding recalled products; a recall audit document is written when recalls are toggled.

## Personalization engine

- Admin-authored `personalizationRule` documents allow editors to declare condition -> action mappings that boost priority for matching content. The server exposes `POST /personalization/apply` which evaluates enabled rules against a user context and returns scored, ordered candidates. Rules are simple, extendable, and stored in Sanity so editors can manage them in Studio.

## Admin SPA and RBAC

- The Admin SPA talks to protected `/api/admin/*` endpoints guarded by a JWT cookie (`admin_token`) and role-based middleware (`requireRole`). The server uses a `createWriteClient()` helper to centralize write client creation for Sanity.

## Analytics & content metrics

- The server collects lightweight content metrics and exposes endpoints to record and query analytics counters for articles and content. The analytics subsystem is intentionally decoupled so it can be swapped for a third-party provider.

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
- `SANITY_API_TOKEN`, `SANITY_PREVIEW_TOKEN`
- `JWT_SECRET` (admin token signing)

## Handoff and governance notes

- Focus on `server/`, `apps/studio/`, and `apps/admin/` when onboarding a buyer.
- Keep legacy folders (`jars-cms/`, `jars-cms-api/`, `jars-mobile-app/`) as archives; they are not the canonical runtime.

If you need an architecture diagram, a simple flow is: Studio → Sanity → CMS API → Mobile / Admin SPA
