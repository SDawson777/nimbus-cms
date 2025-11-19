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
- The Admin SPA uploads logos using a multipart-first strategy with a JSON dataURL fallback so environments without `multer` still work.

## Admin SPA and RBAC

- The Admin SPA talks to protected `/api/admin/*` endpoints guarded by a JWT cookie (`admin_token`) and role-based middleware (`requireRole`). The server uses a `createWriteClient()` helper to centralize write client creation for Sanity.

## Analytics & content metrics

- The server collects lightweight content metrics and exposes endpoints to record and query analytics counters for articles and content. The analytics subsystem is intentionally decoupled so it can be swapped for a third-party provider.

## Legal/versioning

- Legal documents (terms, privacy, accessibility, ageGate) are versioned and time-windowed with `effectiveFrom` and optional `effectiveTo`. The API returns the most recent applicable document per-request and supports `state` scoping for US-state-specific legal content.

## Environment variables

Key env vars (see `.env.example`):

- `SANITY_PROJECT_ID`, `SANITY_DATASET`
- `SANITY_API_TOKEN`, `SANITY_PREVIEW_TOKEN`
- `JWT_SECRET` (admin token signing)

## Handoff and governance notes

- Focus on `server/`, `apps/studio/`, and `apps/admin/` when onboarding a buyer.
- Keep legacy folders (`jars-cms/`, `jars-cms-api/`, `jars-mobile-app/`) as archives; they are not the canonical runtime.

If you need an architecture diagram, a simple flow is: Studio → Sanity → CMS API → Mobile / Admin SPA
