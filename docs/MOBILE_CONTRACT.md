# Mobile API contract (canonical + mobile usage)

This document lists the canonical CMS API endpoints and the mobile app contract. The mobile app uses the `/content/*` paths; the admin surface uses `/api/admin/*`.

All endpoints return JSON. Preview (draft) mode is enabled by supplying the header `X-Preview: true` or the query param `?preview=true`.

## Canonical mobile endpoints

- GET /content/legal
  - Query params: `type` (one of `terms`, `privacy`, `accessibility`, `ageGate`), optional `state` (US state code)
  - Response: { title: string; body: PortableText | string; type: string; stateCode?: string; version?: string | number; effectiveFrom?: string }
  - Cache: public, max-age=86400

- GET /content/faqs (aliases: /content/faq)
  - Response: Array of FAQ items
  - Shape: [{ id: string; question: string; answer: PortableText | string }]
  - Cache: public, max-age=86400

- GET /content/articles
  - Query params: `page` (number), `limit` (number), `tag` (string), `channel` (optional string: `mobile|web|kiosk|email`)
  - Response: { items: CMSArticle[]; page: number; limit: number; total: number; totalPages: number }
  - CMSArticle fields: { id, title, slug, excerpt?, body?, cover?: { src, alt }, tags?, author?, publishedAt?, featured? }

- GET /content/articles/:slug
  - Response: CMSArticle or 404 { error: 'NOT_FOUND' }

- GET /content/theme
  - Query params: `brand` (required slug), optional `store` (slug)
  - Response: { brand: string; primaryColor?: string; secondaryColor?: string; backgroundColor?: string; textColor?: string; logoUrl?: string; logoAssetId?: string; logoAlt?: string }

- GET /content/filters
  - Response: ShopFilter[] (e.g. [{ id: string; label: string }])

## Admin endpoints (selected)

- POST /api/admin/theme
  - Body: { brand: string; store?: string; primaryColor?: string; secondaryColor?: string; backgroundColor?: string; textColor?: string; logoAssetId?: string; logoAlt?: string }
  - Auth: `admin_token` cookie (JWT) with `EDITOR` role required
  - Behavior: creates or updates deterministic `themeConfig` document for brand (and optional store override). When `logoAssetId` is provided the server writes a Sanity image reference with `logo.alt` when `logoAlt` is present.

- POST /api/admin/upload-logo
  - JSON fallback path: accepts { filename: string; data: string } where `data` is a dataURL/base64 string. Returns { ok: true, url, assetId }

- POST /api/admin/upload-logo-multipart
  - Multipart FormData path (field name `file`) — preferred when available. Returns { ok: true, url, assetId }

## Legacy canonical endpoints

The same functionality is also exposed under legacy paths like `/api/v1/content/*` for internal compatibility. Both mount to the same handlers.

## Errors and cache

- Errors are returned as JSON with appropriate HTTP status codes.
- Cache-Control header examples: legal and faqs use 86400, filters use 43200, articles use shorter TTLs.

## Multi-tenant extensions

Optional query params: `org`, `brand`, `store`. When provided, endpoints will attempt to filter or resolve referenced brand/store documents. These parameters are backward-compatible; omitting them returns global content.

## Notes for integrators

- Mobile app reads the CMS base URL from `EXPO_PUBLIC_CMS_API_URL`.
- For previewing draft content set `X-Preview: true` or `?preview=true`.
