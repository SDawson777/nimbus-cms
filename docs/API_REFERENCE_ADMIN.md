# Admin API Reference

This document summarizes the protected `/api/admin/*` routes exposed by the CMS API. All routes require:

- An `admin_token` HTTP-only cookie issued via `POST /admin/login`.
- A valid CSRF token for state-changing requests: include `X-CSRF-Token` header with the value from the `admin_csrf` cookie.
- Role + scope permissions as documented in [`docs/RBAC_MATRIX.md`](./RBAC_MATRIX.md).

Unless noted otherwise, the base URL is the CMS origin (e.g. `https://cms.example.com`). Responses are JSON.

## Authentication helpers

### `POST /admin/login`

Authenticate an admin using email/password (plus optional brand/store hints). Returns `{ok, csrfToken}` and sets session cookies. See [`server/src/routes/adminAuth.ts`](../server/src/routes/adminAuth.ts) for accepted fields.

### `GET /admin/me`

Returns `{admin}` where `admin` contains `email`, `role`, and scope slugs (organization, brand, store). Used by the Admin SPA for capability gating.

### `GET /admin/logout`

Clears auth + CSRF cookies.

---

## Analytics

### `GET /api/admin/analytics/summary`
- **Role:** `VIEWER`
- **Purpose:** Returns the most recent analytics aggregate payload metadata plus a lightweight preview object.
- **Query params:**
  - `segment` (optional): label for cache partitioning.
  - `cacheBust` (optional): when set, forces the API to bypass in-memory cache.
- **Response:**
```json
{
  "lastRefreshedAt": "2025-01-18T04:12:11.231Z",
  "ttlMs": 30000,
  "source": "HIT" | "MISS" | "PERSISTED",
  "preview": {
    "topArticles": [ {"contentSlug": "a1", "views": 120, "clickThroughs": 12} ],
    "topProducts": [ ... ],
    "storeEngagement": [ ... ],
    "productDemand": [ {"slug": "p1", "status": "risingDemand", "demandScore": 402 } ]
  }
}
```

### `POST /api/admin/analytics/summary`
- **Role:** `ORG_ADMIN`
- **Purpose:** Forces a fresh aggregation and persists it for the current org scope.
- **Body:** `{ query?: Record<string, any> }` (optional knobs mirrored from GET `/analytics/overview`).
- **Response:** `{ ok: true, lastRefreshedAt: ISODate, preview: { ...same as GET... } }`.

### `GET /api/admin/analytics/overview`
- **Role:** `ORG_ADMIN`
- **Purpose:** Full analytics dashboard payload (top content, demand curves, store rollups).
- **Query params:** `limit`, `page`, `perPage`, `cacheBust` (mirrors server defaults).
- **Response:**
```json
{
  "topArticles": [{"contentSlug": "welcome", "views": 542, "clickThroughs": 54}],
  "topFaqs": [...],
  "topProducts": [...],
  "productDemand": [{"slug": "sku-1", "demandScore": 283, "status": "steady"}],
  "productSeries": [{"slug": "sku-1", "series": [{"date": "2025-01-01", "views": 12, "clickThroughs": 1}]}],
  "storeEngagement": [{"storeSlug": "store-1", "views": 120, "clickThroughs": 14}]
}
```
- Adds `X-Analytics-Overview-Cache` header (`HIT`, `MISS`, `PERSISTED`).

### `GET /api/admin/analytics/content-metrics`
- **Role:** `VIEWER`
- **Purpose:** Raw per-content metrics (scoped to the caller via brand/store filters).
- **Query params:** `limit` (default 50).
- **Response:** Array of metric docs with `{contentSlug, contentType, views, clickThroughs, lastUpdated}`.

### `GET /api/admin/analytics/settings`
- **Role:** `ORG_ADMIN`
- Fetches saved tuning knobs (`windowDays`, weights, thresholds) for the caller's org.

### `POST /api/admin/analytics/settings`
- **Role:** `ORG_ADMIN`
- Saves tuning knobs. Body must satisfy `analyticsSettingsSchema` (see server source). On success returns `{ok, settings}`.

---

## Compliance

### `GET /api/admin/compliance/overview`
- **Role:** `ORG_ADMIN`
- **Query params:** `brand` (slug), `types[]` (required doc types override).
- **Response:** Array of store rows with `storeSlug`, `stateCode`, `complianceScore`, `missingTypes`, `currentLegalDocs[]`. Includes `snapshotTs` when data came from a cached snapshot.

### `POST /api/admin/compliance/snapshot`
- **Role:** `ORG_ADMIN`
- **Body:** `{ brand?: string, store?: string, types?: string[] }`. When omitted, defaults to caller's scope.
- **Response:** `{ ok: true, id: "complianceSnapshot-org-brand-<ts>", ts, studioUrl? }`.

### `GET /api/admin/compliance/history`
- **Role:** `ORG_ADMIN`
- **Query params:** `brand`, `limit` (default 25).
- **Response:** Array of recent snapshot metadata including `studioUrl` shortcuts.

---

## Theme management

### `GET /api/admin/theme`
- **Role:** `VIEWER`
- **Query params:** `brand` (required), `store` (optional).
- **Response:** Flattened theme config `{brand, store?, primaryColor, secondaryColor, surfaceColor, typography, logoUrl}`.

### `POST /api/admin/theme`
- **Role:** `EDITOR`
- **Body:** Theme payload defined in the page schema (colors, typography, brand/store slugs). Scope is validated via `ensureBrandScope`/`ensureStoreScope`.
- **Response:** `{ok: true, theme}` with the persisted Sanity doc.

### `GET /api/admin/theme/configs`
- **Role:** `VIEWER`
- **Query params:** `page`, `perPage`, `brand`, `store`.
- **Response:** `{items, total, page, perPage}` where each item contains brand/store names, color palette, and optional `studioUrl` shortcut.

### `POST /api/admin/theme/config`
- **Role:** `EDITOR`
- **Purpose:** Upserts the deterministic `themeConfig-<brand>[-store-<slug>]` document. Body mirrors the Theme editor form.

### `DELETE /api/admin/theme/config/:id`
- **Role:** `EDITOR`
- Deletes a specific config after verifying scope.

### `POST /api/admin/upload-logo`
- **Role:** `EDITOR`
- **Body:** `{ filename, data, brand? }` where `data` is a base64 data URL.
- **Response:** `{ ok: true, url, assetId }`.

### `POST /api/admin/upload-logo-multipart`
- **Role:** `EDITOR`
- **Body:** multipart form (`file` field) plus optional `brand`. Same response as JSON upload. Both paths enforce file type/size limits and brand scope.

---

## Personalization

### `GET /api/admin/personalization/rules`
- **Role:** `VIEWER`
- Lists all `personalizationRule` docs visible to the caller. Each rule includes `_id`, `name`, `enabled`, `conditions`, and `actions`.

### `POST /personalization/apply`
- **Role:** Public (signed clients)
- **Body:** `{ context, contentType, slugs?, limit? }`.
- **Response:** `{ items, metadata }` where items include `score` and `reasons[]`. Although this endpoint is public, it is documented here because the Admin SPA simulator consumes it.

---

## Compliance + legal utilities

### `GET /api/admin/legal`
- **Role:** `VIEWER`
- Lists legal documents (terms/privacy/etc.) for the caller's scope. Optional `channel` filter.

### `GET /api/admin/legal/current`
- **Role:** `VIEWER`
- Query params: `type` (required), `state` (optional). Returns the currently effective legal doc, including `bodyHtml` for drop-in embeds.

---

## Product + recall endpoints

### `GET /api/admin/products`
- **Role:** `EDITOR`
- Returns scoped `product` docs, excluding recalled products unless `includeRecalled=true`.

### `GET /api/admin/products/recalled-count`
- **Role:** `VIEWER`
- Returns `{count}` for the caller's tenant scope.

### `POST /api/admin/products/:id/recall`
- **Role:** `EDITOR`
- **Body:** `{ isRecalled?: boolean, recallReason?: string, reason?: string, operatorReason?: string }`. Automatically writes a `recallAudit` document.

---

## Common errors

| HTTP Status | Code | Meaning |
| --- | --- | --- |
| 400 | `INVALID_*` | Payload failed validation (see `details`). |
| 401 | `UNAUTHORIZED` | Missing/expired `admin_token` cookie. |
| 403 | `FORBIDDEN` | Role too low or scope mismatch. |
| 404 | `NOT_FOUND` | Resource missing or out of scope. |
| 429 | `RATE_LIMITED` | Login throttling triggered. |
| 500 | `FAILED` | Unexpected error—check logs. |

Keep this reference in sync with `docs/RBAC_MATRIX.md` whenever endpoints change.
