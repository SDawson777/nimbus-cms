# Mobile API contract (canonical + mobile usage)

This document lists the canonical CMS API endpoints and the mobile app contract. The mobile app uses the `/content/*` paths; the admin surface uses `/api/admin/*`.

All endpoints return JSON. Preview (draft) mode is enabled by supplying the header `X-Preview: true` or the query param `?preview=true`.

## Canonical mobile endpoints

- GET /content/legal
  - Query params: `type` (one of `terms`, `privacy`, `accessibility`, `ageGate`), optional `state` (US state code)
  - Response: { title: string; body: PortableText | string; bodyHtml?: string; type: string; stateCode?: string; version?: string | number; effectiveFrom?: string }
  - Notes: The endpoint returns the most-recent applicable `legalDoc` for the requested `type` and `state` (if provided). Selection rules:
    - If `state` is provided the service prefers a `legalDoc` with matching `stateCode`.
    - If no state-specific doc exists, the service falls back to a global `legalDoc` (no `stateCode`).
    - Only documents where `effectiveFrom <= now()` and `(effectiveTo is not defined OR effectiveTo > now())` are considered current.
    - When multiple current docs exist for the same (type,state), the server picks the one with a higher numeric `version` when parseable, otherwise the latest `effectiveFrom`.
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
  - Query params: `brand` (optional slug, recommended), optional `store` (slug)
  - Behavior: resolve theme using the following precedence: store-specific theme (brand+store) -> brand-level theme -> global default theme (no brand/store). If no theme exists for any scope a 404 is returned.
  - Response (flattened contract):
    {
    brand?: string;
    store?: string;
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
    backgroundColor?: string;
    surfaceColor?: string;
    textColor?: string;
    mutedTextColor?: string;
    logoUrl?: string;
    darkModeEnabled: boolean;
    cornerRadius?: string;
    elevationStyle?: string;
    }
  - Notes: Clients (mobile, web, kiosk) should fetch this endpoint at startup and apply the returned tokens. The response is intentionally flattened and contains simple primitives suitable for CSS variables or theming tokens.

- GET /content/filters
  - Response: ShopFilter[] (e.g. [{ id: string; label: string }])

## Other public content endpoints

- GET /content/deals
  - Response: array of deals (id, title, slug, description, startDate, endDate, channels?, schedule?)

- GET /content/products (if exposed)
  - Response: product-lite list (id, name, slug, price, image)

## Personalization

- POST /personalization/apply
  - Body: { context: { preference?: string; location?: string; timeOfDay?: string; lastPurchaseDaysAgo?: number; ... }, contentType: 'article' | 'deal' | 'productCategory', slugs?: string[] }
  - Response: { items: [ { id: string, slug: string, title?: string, type: string, score: number, reasons?: any[] } ] }
  - Notes: Returns candidates scored by admin-authored rules. This is opt-in and does not alter default content endpoints.

### Client guidance

- **Channels and audiences**: The API is channel-aware; include `context.channel` when requesting rules that target `web`, `mobile`, `kiosk`, or `email` content. Actions with a `channel` constraint are ignored unless the incoming context matches.
- **Payload shape**: Provide the minimal context keys required by your rules. Unrecognized keys are ignored. To keep payloads consistent across platforms, we recommend camelCased keys with primitive values (string, number, boolean).
- **Content hydration**: When `slugs` is omitted, the service will fetch candidate documents itself. When slugs are supplied (e.g., pre-filtered by a feed), the service will only score that subset.
- **Cadence and caching**:
  - Web/mobile clients should treat responses as short-lived hints and recompute no less than every 5–15 minutes per user session.
  - If an upstream CDN caches responses, include `context.userId` or `context.sessionId` in the cache key to avoid serving cross-user personalization.
  - When the personalization endpoint is unreachable, fall back to deterministic ordering (e.g., sort by published date) and log the failure for later analysis.
- **Webhook availability**: For scheduled rollouts, use the admin dashboard to configure webhook notifications. Webhooks emit whenever a `personalizationRule` toggles `enabled`, which allows clients to pre-populate caches.
- **Telemetry**: Include rule decision information (the `reasons` array) in your analytics events where possible; this helps track how often boosts actually surface in production and informs future rule tuning.

## Admin endpoints used by integrators

- POST /analytics/event
  - Purpose: record content views/clicks. Accepts `{ type: 'view'|'click', contentType: 'article'|'faq'|'legal'|'product', contentSlug, brandSlug?, storeSlug? }`.
  - Headers:
    - `X-Analytics-Key`: one of the comma-separated keys configured in `ANALYTICS_INGEST_KEY`.
    - `X-Analytics-Signature`: `hex(HMAC_SHA256(rawBody, X-Analytics-Key))`.
  - Notes: the server rejects unsigned or mismatched requests with `401 INVALID_ANALYTICS_SIGNATURE`. Raw body bytes must match exactly what is signed; most clients should stringify JSON first, compute the signature, then send that same string as the body.

- GET /api/admin/analytics/overview
  - Auth: admin_token (requires VIEWER/EDITOR roles depending on access)
  - Response: aggregated analytics payload with topArticles, topProducts, storeEngagement, productDemand, etc.

- GET /api/admin/compliance/overview
  - Auth: ORG_ADMIN required
  - Query params: optional `types` to specify required legal types
  - Response: per-store compliance summary and missingTypes list

- POST /api/admin/products/:id/recall
  - Auth: EDITOR required
  - Body: { isRecalled: boolean, recallReason?: string, reason?: string }
  - Response: { ok: true }
  - Notes: Creates a `recallAudit` document recording previous/current states and operator info.

- GET /api/admin/personalization/rules
  - Auth: VIEWER
  - Response: list of personalizationRule documents

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

## Personalization endpoint

- POST /personalization/apply
  - Body: { context: { preference?: string; location?: string; timeOfDay?: string; lastPurchaseDaysAgo?: number; ... }, contentType: 'article' | 'deal' | 'productCategory', slugs?: string[] }
  - Response: { items: [ { id: string, slug: string, title?: string, type: string, score: number, reasons?: any[] } ] }
  - Notes: The endpoint evaluates admin-authored `personalizationRule` documents and returns candidates ordered by computed `score`. This endpoint is intentionally opt-in — it does not change default content endpoints and should be called by delivery or recommendation services.
