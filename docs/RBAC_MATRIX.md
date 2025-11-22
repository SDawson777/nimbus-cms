# Admin RBAC Matrix

This document enumerates how admin roles map to `/api/admin/*` and selected `/content/*` routes, how org/brand/store scope is enforced, and how the system prevents privilege escalation. Every admin request is subject to:

Roles inherit permissions from roles “below” them unless stated otherwise:

`OWNER` ⟶ `ORG_ADMIN` ⟶ `BRAND_ADMIN` ⟶ `STORE_MANAGER` ⟶ `EDITOR` ⟶ `VIEWER`

## Role overview

| Role | Scope | Typical assignment | Notes |
| --- | --- | --- | --- |
| OWNER | Global | Platform engineering / super-admin | Full read/write access to every organization, brand, and store. May run compliance snapshots for any scope and change global settings. |
| ORG_ADMIN | Organization | Org program lead / operations | Full access to brands/stores inside their org. Manages analytics + compliance, brand-level configuration, and org-wide flags. Cannot see other orgs. |
| BRAND_ADMIN | Brand | Brand marketing lead | Confined to a single brand but may see every store in that brand. Manages brand themes, content, campaigns, and store-level overrides. Cannot change org-wide compliance/analytics knobs. |
| STORE_MANAGER | Store | Store ops lead | Limited to the assigned store(s). Manages store rollouts, local overrides, and recall flags for products carried by their store. Cannot modify sibling stores or brand/global settings. |
| EDITOR | Brand / Store | Content ops / copywriter | Can create and edit brand- or store-bound content and theme config within their scope. Cannot change org-wide compliance, analytics settings, or destructive configuration. |
| VIEWER | Scoped read | Analyst, finance, or read-only reviewer | Read-only access to scoped dashboards and configuration. Cannot perform mutations. |

## Admin API matrix

Legend: ✅ = allowed, ⚠️ = read-only (no mutations), ❌ = blocked.

Scope column describes how brand/store scoping is enforced. All rows assume valid CSRF + JWT; otherwise the request is rejected early.

### Products and inventory

| Capability / Endpoint | Scope enforcement | OWNER | ORG_ADMIN | BRAND_ADMIN | STORE_MANAGER | EDITOR | VIEWER |
| --- | --- | --- | --- | --- | --- | --- | --- |
| List products — `GET /api/admin/products` | Uses `buildScopeFilter` to restrict products to the caller’s org/brand/store scope. Store managers only see products sold in their store. | ✅ | ✅ | ✅ | ⚠️ | ⚠️ | ⚠️ |
| Toggle recall — `POST /api/admin/products/:id/recall` | Loads product, then verifies brand via `canAccessBrand` and store via `canAccessStore` before mutating. Store managers can only recall products carried in their store. | ✅ | ✅ | ✅ | ✅ | ✅ (brand-level only) | ❌ |
| View inventory — `GET /api/admin/inventory` | Filtered by `buildScopeFilter` for brand/store fields. | ✅ | ✅ | ✅ | ⚠️ | ⚠️ | ⚠️ |

### Theme and assets

| Capability / Endpoint | Scope enforcement | OWNER | ORG_ADMIN | BRAND_ADMIN | STORE_MANAGER | EDITOR | VIEWER |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Read theme — `GET /api/admin/theme` | Requires `brand` query; `ensureBrandScope` and `ensureStoreScope` assert caller matches brand/store when provided. | ✅ | ✅ | ✅ | ⚠️ (store-only) | ⚠️ | ⚠️ |
| List configs — `GET /api/admin/theme/configs` | Automatically narrows results to caller scope when filters are omitted; rejects requests that reference out-of-scope brands/stores. | ✅ | ✅ | ✅ | ⚠️ | ⚠️ | ⚠️ |
| Upsert theme config — `POST /api/admin/theme/config` | Before writing the `themeConfig` document, middleware uses `ensureBrandScope`/`ensureStoreScope` to enforce that the brand/store in the payload is in scope. | ✅ | ✅ | ✅ | ✅ (store overrides only) | ✅ | ❌ |
| Delete theme config — `DELETE /api/admin/theme/config/:id` | Loads the config, computes its brand/store, verifies ownership against caller’s scope, then deletes. | ✅ | ✅ | ✅ | ✅ (store overrides only) | ✅ (within brand) | ❌ |
| Theme preview — `POST /api/admin/theme/preview` | Same brand/store validations as write; mutations are ephemeral but still scoped. | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Upload logo — `POST /api/admin/upload-logo*` | Requires `brand` in body/query. Helper cross-checks brand/store against admin scope; rejects uploads that would cross tenants. | ✅ | ✅ | ✅ | ✅ (store logo overrides only) | ✅ | ❌ |

### Content catalogs (articles, FAQs, legal)

| Capability / Endpoint | Scope enforcement | OWNER | ORG_ADMIN | BRAND_ADMIN | STORE_MANAGER | EDITOR | VIEWER |
| --- | --- | --- | --- | --- | --- | --- | --- |
| List articles — `GET /api/admin/articles` | Uses `buildScopeFilter` to limit articles to caller’s brand/store. | ✅ | ✅ | ✅ | ⚠️ | ⚠️ | ⚠️ |
| List FAQs — `GET /api/admin/faqs` | Same scope filter behavior as articles. | ✅ | ✅ | ✅ | ⚠️ | ⚠️ | ⚠️ |
| List legal docs — `GET /api/admin/legal` | Returns legal docs scoped to caller’s org/brand when filters are omitted; rejects queries for out-of-scope brands/stores. | ✅ | ✅ | ✅ | ⚠️ | ⚠️ | ⚠️ |
| Mutate content — `POST /api/admin/articles|faqs|legal` routes (where implemented) | Payload brand/store fields are validated through `ensureBrandScope`/`ensureStoreScope` helpers. | ✅ | ✅ | ✅ | ✅ (store-specific content) | ✅ | ❌ |

### Analytics & compliance

| Capability / Endpoint | Scope enforcement | OWNER | ORG_ADMIN | BRAND_ADMIN | STORE_MANAGER | EDITOR | VIEWER |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Analytics overview — `GET /api/admin/analytics/overview` | Restricted to org scope; requires at least `ORG_ADMIN`. Metrics are aggregated per-store but not directly scoped by brand/store. | ✅ | ✅ | ⚠️ (org-wide read if granted) | ❌ | ❌ | ⚠️ (if explicitly granted) |
| Analytics settings (where implemented) — `POST /api/admin/analytics/*` | Restricted to org-level admins; scoped via org id in token. | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Compliance overview — `GET /api/admin/compliance/overview` | `requireRole('ORG_ADMIN')` and up. Uses org id from JWT; optional brand parameters are validated with `canAccessBrand`. | ✅ | ✅ | ⚠️ (brand-only if allowed) | ❌ | ❌ | ❌ |
| Compliance snapshots — `GET /api/admin/compliance/snapshots`, `POST /api/admin/compliance/snapshot` | Same as overview; writes are restricted to `ORG_ADMIN` and above. Snapshotting obeys org scope from token. | ✅ | ✅ | ❌ (read-only if granted) | ❌ | ❌ | ❌ |

### Personalization

| Capability / Endpoint | Scope enforcement | OWNER | ORG_ADMIN | BRAND_ADMIN | STORE_MANAGER | EDITOR | VIEWER |
| --- | --- | --- | --- | --- | --- | --- | --- |
| List rules — `GET /api/admin/personalization/rules` | Currently global; future brand fields will use `buildScopeFilter` and `ensureBrandScope`. | ✅ | ✅ | ✅ | ⚠️ | ⚠️ | ⚠️ |
| Mutate rules — `POST /api/admin/personalization/rules` (where implemented) | Restricted to editors and above in practice; payload will be brand-scoped when fields are introduced. | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |

### Admin identity and org/brand/store metadata

| Capability / Endpoint | Scope enforcement | OWNER | ORG_ADMIN | BRAND_ADMIN | STORE_MANAGER | EDITOR | VIEWER |
| --- | --- | --- | --- | --- | --- | --- | --- |
| WhoAmI — `GET /api/admin/me` | Always returns only the caller’s own identity + scope; cannot be used to enumerate other users. | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| List orgs — `GET /api/admin/organizations` | Uses `buildScopeFilter` to restrict org list; non-OWNER callers only see their own org. | ✅ | ✅ (only their org) | ❌ | ❌ | ❌ | ❌ |
| List brands — `GET /api/admin/brands` | `buildScopeFilter` restricts visible brands to the caller’s org/brand. | ✅ | ✅ | ✅ | ⚠️ (brands that contain their store) | ⚠️ | ⚠️ |
| List stores — `GET /api/admin/stores` | Same as brands, but narrowed to stores accessible to the caller. | ✅ | ✅ | ✅ | ⚠️ (their store only) | ⚠️ | ⚠️ |

## Content API (read-only) matrix

The public/mobile `/content/*` routes are read-only. They do not require admin JWTs and are not governed by the admin RBAC matrix, but they still enforce brand/store visibility and scheduled windows.

Key behaviors:

- Recalled products are suppressed by default.
- Scheduled content respects `schedule.publishAt` / `schedule.unpublishAt` on reads.
- Legal content is filtered by state/brand/org based on request parameters.

Because these are consumer-facing endpoints, the roles table above is **not** applied. Instead, they rely on unprivileged access plus content rules. The only exception is preview mode (guarded by `PREVIEW_SECRET`), which is still read-only but returns drafts.

## Enforcement and escalation prevention

The combination of middleware, JWT payloads, and helper functions prevents admins from “coloring outside the lines” even if they tamper with the client.

- **Scope in the token, not the UI** — org/brand/store identifiers live in the signed JWT. The server never trusts `org`, `brand`, or `store` supplied solely by the client without verifying them against the token.
- **Helpers centralize checks** — helpers like `ensureBrandScope`, `ensureStoreScope`, `canAccessBrand`, and `canAccessStore` are used from routes instead of hand-rolled checks, so future endpoints naturally inherit the hardened behavior.
- **Deny-by-default** — routes declare minimum roles via `requireRole('ROLE')`; if a role isn’t explicitly granted, it is considered blocked.
- **Destructive actions restricted** — destructive operations (recalls, deletions, compliance snapshots, analytics settings) require high-privilege roles (`ORG_ADMIN` or OWNER) and are never available to VIEWER or most STORE_MANAGER users.
- **Admin SPA is defensive but not authoritative** — the Admin SPA uses the same RBAC matrix to hide/disable buttons and navigation, but the server remains the enforcement source of truth.

## Multi-tenant notes

- **Org boundaries** — `ORG_ADMIN` and below never see data from other orgs; their JWT embeds a single org id.
- **Brand isolation** — `BRAND_ADMIN` and `EDITOR` are limited to a single brand id carried in their token. Even if they pass another brand slug in the request, `ensureBrandScope` rejects it.
- **Store isolation** — `STORE_MANAGER` tokens include specific store ids. Helpers verify that any referenced store belongs to both the caller’s org and, where applicable, the brand in their token.
- **Preview and mobile share the same data** — Preview and content endpoints read from the same Sanity dataset as admin writes, so RBAC errors in admin APIs won’t cause strange drift.

Refer back to this matrix when adding new `/api/admin/*` routes: decide the minimum role, then ensure you reuse the same helpers so behavior stays consistent.
# Admin RBAC Matrix

This matrix enumerates which admin roles may hit each `/api/admin/*` route and how brand/store scope is enforced. Roles inherit permissions from roles beneath them (e.g., `OWNER` > `ORG_ADMIN` > `BRAND_ADMIN` > `STORE_MANAGER` > `EDITOR` > `VIEWER`). Every request is also subject to CSRF + JWT verification.

## Role overview

| Role | Typical assignment | Notes |
| --- | --- | --- |
| OWNER | Platform engineering | Full access to every organization, brand, and store. May run compliance snapshots for any scope. |
| ORG_ADMIN | Org program lead | Full access to brands/stores inside their org. Can manage analytics settings and compliance snapshots for their org. |
| BRAND_ADMIN | Brand marketing lead | Confined to a single brand but may see every store in that brand. Can manage themes, localization, and store-specific content. |
| STORE_MANAGER | Store ops lead | Limited to the assigned store(s). May manage store rollouts, recalls, and localized theme overrides. |
| EDITOR | Content operations | Can edit brand-bound assets (articles, deals, themes) for the scoped brand/store. Cannot change global compliance or analytics settings. |
| VIEWER | Read-only analyst | Can only view scoped content/metrics. |

## Endpoint permissions

Legend: ✅ = allowed, ⚠️ = read-only (no mutations), ❌ = blocked. “Scope enforcement” details how brand/store restrictions are applied.

| Capability / Endpoint | Scope enforcement | OWNER | ORG_ADMIN | BRAND_ADMIN | STORE_MANAGER | EDITOR | VIEWER |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Products list – `GET /api/admin/products` | `buildScopeFilter` restricts products to admin brand/store references. | ✅ | ✅ | ✅ | ⚠️ (store-bound) | ⚠️ | ⚠️ |
| Recall toggle – `POST /api/admin/products/:id/recall` | Product brand and store references are checked via `canAccessBrand`/`canAccessStore`. Store managers may only recall products stocked in their store. | ✅ | ✅ | ✅ | ✅ (store) | ✅ (brand) | ❌ |
| Theme read – `GET /api/admin/theme` | Requires explicit `brand` query param; `ensureBrandScope` + `ensureStoreScope` gate access. | ✅ | ✅ | ✅ | ⚠️ (store) | ⚠️ | ⚠️ |
| Theme write – `POST /api/admin/theme`, `/theme/config`, `/theme/config/:id`, `/theme/preview` | Same as above for all mutations; editors need brand/store scope, delete restricted when brand mismatch. | ✅ | ✅ | ✅ | ✅ (store overrides only) | ✅ | ❌ |
| Theme uploads – `POST /api/admin/upload-logo*` | Must include `brand`; helper verifies request brand matches admin scope before saving assets. | ✅ | ✅ | ✅ | ✅ (store) | ✅ | ❌ |
| Content catalogs – `GET /api/admin/articles|faqs|legal` | Scoped via `buildScopeFilter` so brand/store-limited admins only see their docs. | ✅ | ✅ | ✅ | ⚠️ (store) | ⚠️ | ⚠️ |
| Analytics overview/settings – `/analytics/*` | Overview requires `ORG_ADMIN`; content metrics use scope filter; settings writes are ORG-level only. | ✅ | ✅ | ⚠️ (read-only overview) | ❌ | ❌ | ⚠️ (metrics view) |
| Compliance overview/history/snapshot – `/compliance/*` | `ORG_ADMIN` minimum. Brand args validated with `canAccessBrand`; store scope inherited from admin context. | ✅ | ✅ | ⚠️ (brand-only) | ❌ | ❌ | ❌ |
| Personalization rules – `GET /api/admin/personalization/rules` | Global read; future brand fields will reuse `buildScopeFilter`. | ✅ | ✅ | ✅ | ⚠️ | ⚠️ | ⚠️ |
| Brands/Stores/Organizations listings – `/brands`, `/stores`, `/organizations` | Always filtered through `buildScopeFilter`. | ✅ | ✅ | ✅ | ⚠️ (store) | ⚠️ | ⚠️ |

## Notes

- `ensureBrandScope` and `ensureStoreScope` return 403 immediately when a request attempts to address a brand/store outside the caller’s scope.
- Upload endpoints now require the caller to provide a `brand` value; the server cross-checks the authenticated admin’s scopes before persisting assets.
- Store managers inherit their brand scope when manipulating store overrides but cannot touch sibling stores or org-wide settings.
- High privilege roles (OWNER, ORG_ADMIN) may omit `brand` query params, but lower roles must always supply them when required.
- The Admin SPA reads scope metadata from the JWT payload and disables UI actions automatically when the role matrix denies a capability.
