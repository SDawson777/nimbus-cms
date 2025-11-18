# Mobile API Contract (canonical + mobile usage)

This document lists the canonical CMS API endpoints and the mobile app contract (the mobile app uses the `/content/*` paths where possible). The canonical documented contract (legacy) lives under `/api/v1/content/*` and the mobile app uses `/content/*` and `/api/admin/products`.

## Summary of endpoints (mobile-first)

- GET /content/legal
  - Query params: `type` (one of `terms`, `privacy`, `accessibility`)
  - Preview: `X-Preview: true` header OR `?preview=true`
  - Response: { title: string; body: any }

- GET /content/fa_q (aliases: /content/faqs, /content/faq)
  - Response: Array of FAQ items
  - Shape: [{ id: string; question: string; answer: string }]
  - Cache: public, max-age=86400

- GET /content/articles
  - Query params: `page` (number), `limit` (number), `tag` (string optional)
  - Response: { items: CMSArticle[]; page: number; limit: number; total: number; totalPages: number }
  - CMSArticle fields (high level): { id, title, slug, excerpt?, body?, cover?: { src, alt }, tags?, author?, publishedAt?, featured? }

- GET /content/articles/:slug
  - Response: CMSArticle (single object) or 404 { error: 'NOT_FOUND' }

- GET /content/filters
  - Response: ShopFilter[]
  - Shape: [{ id: string; label: string }]

- GET /api/admin/products
  - Response: CMSProduct[]
  - Shape: [{ \_\_id: string; name: string; slug: string; price: number; type: string; effects?: string[]; image: { url: string; alt?: string } }]

## Legacy canonical endpoints

The same functionality is exposed at the legacy canonical endpoints used by docs and tests:

- GET /api/v1/content/legal
- GET /api/v1/content/faqs
- GET /api/v1/content/articles
- GET /api/v1/content/articles/:slug
- GET /api/v1/content/filters
- ... and others (copy, deals)

Both the legacy and mobile endpoints are wired to the same route handlers to avoid duplication. Preview handling is a single source of truth: either `?preview=true` or the `X-Preview: true` header enables draft preview mode.

## Errors and cache

- Errors: endpoints return JSON errors with appropriate HTTP status codes (4xx/5xx) — never raw HTML/text.
- Cache headers: endpoints set Cache-Control values; generally public caching with reasonable TTLs (examples in code: legal and faqs use 86400 seconds, filters use 43200, articles use 300).

## Notes for integrators

- The mobile app reads CMS base URL from `EXPO_PUBLIC_CMS_API_URL` and calls the `/content/*` paths. Ensure your deployed API exposes those paths (the server mounts both `/api/v1/content` and `/content`).
- For previewing draft content set `X-Preview: true` on requests.

## Multi-tenant extensions

This CMS supports optional multi-tenant scoping via query parameters. These are optional and backward-compatible with the mobile app.

- Query params: `org`, `brand`, `store` (provide slug values)
- Example: GET /content/articles?brand=jars&store=jars-detroit

When provided, endpoints will attempt to filter content to documents referencing the given brand/store/organization. If omitted, global content is returned as before.

Note: These params are optional — existing mobile clients that don't send them will continue to receive the same responses.
