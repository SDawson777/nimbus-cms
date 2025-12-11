# Personalization API – replay protection and safety

This document complements [`PERSONALIZATION_CLIENT_GUIDE.md`](./PERSONALIZATION_CLIENT_GUIDE.md) by focusing on **replay protection**, **idempotency**, and **admin-side security** for the personalization endpoints.

It is aimed at backend engineers and integrators wiring clients to `/personalization/apply` and admin features to `/api/admin/personalization/*`.

## Overview

The personalization engine is rule-based:

- Rules are stored in Sanity as `personalizationRule` documents.
- Public clients call `POST /personalization/apply` with a user context and content type.
- The API evaluates enabled rules and returns scored candidates; it does **not** mutate any content.

Even though `/personalization/apply` is read-only, you should still defend it against abuse (replay, scraping, or amplification attacks).

Admin-facing personalization endpoints (`/api/admin/personalization/*`) require JWT + CSRF and are additionally protected by RBAC.

## Replay protection for `/personalization/apply`

The public apply endpoint can be called freely by frontends, but integrators may choose to add replay protection on the **client side** and/or via an API gateway.

Recommended pattern:

- Include a **timestamp** (`ts`) in the request body (for example, milliseconds since epoch).
- Optionally include a **nonce** (random string) when requests originate from a backend or privileged environment.
- Enforce a **freshness window** at the edge (for example, reject requests where `now - ts > 5 minutes`).

Example request body with replay fields:

```json
{
  "type": "article",
  "context": {
    "userId": "abc123",
    "locale": "en-US",
    "storeId": "store-nyc-001"
  },
  "ts": 1732239079123,
  "nonce": "53987b89-fcb9-4f2b-9d7e-4fe1e418c91c"
}
```

On the server or gateway side you can:

- Reject requests where `ts` is too far in the past or future.
- Optionally maintain a short-lived cache of seen nonces per user/session to drop exact replays.

Because `/personalization/apply` is read-only, the CMS core does not persist or validate nonces by default, but the contract leaves room for consumers to add strict replay protection if desired.

## Idempotency expectations

The key idempotency expectations are:

- **Apply endpoint**: multiple identical calls with the same body are safe. They may return different scores over time if rules change, but no server-side state is mutated by the call itself.
- **Admin rule management** (`/api/admin/personalization/rules`): writes are deterministic and should treat the rule document `_id` as the idempotency key.
  - Creating/updating a rule with the same `_id` simply overwrites the rule, which is safe for retries.
  - Admin UI and API consumers should avoid creating many distinct ids for semantically identical rules.

If you build your own write endpoints on top of the rule documents, consider:

- Accepting an optional `idempotencyKey` in the payload and storing it on the rule document.
- Rejecting duplicate writes where the same `idempotencyKey` has already been processed.

## Admin security: JWT + CSRF + RBAC

All admin personalization routes live under `/api/admin/personalization/*` and are protected by the same layers as other admin APIs:

- **JWT auth** – `admin_token` cookie signed with `JWT_SECRET` identifies the admin user and roles.
- **CSRF protection** – `admin_csrf` cookie + `X-CSRF-Token` header are required for state-changing requests.
- **RBAC** – middleware enforces that only authorized roles (typically `EDITOR` and above) can list or mutate rules.

Implications:

- A stolen admin JWT alone is not enough to perform rule changes from a third-party origin; the attacker also needs the CSRF token or must bypass browser protections.
- Admin UI code should **always** use the shared `csrfFetch` helper so that cookies and CSRF headers are wired correctly.
- Rule changes are auditable via logs; every request is tied to a `requestId` and (if you add it) an `adminId` field in `req.log`.

See [`docs/RBAC_MATRIX.md`](./RBAC_MATRIX.md) for more detail on which roles may access personalization routes.

## Example: safe admin rule update

A typical safe pattern for rule updates over `/api/admin/personalization/rules` (exact route shape may vary):

- Client (Admin SPA) sends:

```json
{
  "_id": "rule:vip-store-boost",
  "conditions": [
    { "field": "storeId", "op": "equals", "value": "store-nyc-001" },
    { "field": "segment", "op": "in", "value": ["vip", "whale"] }
  ],
  "action": {
    "targetType": "article",
    "targetSlugOrKey": "holiday-feature",
    "priorityBoost": 25,
    "channel": "mobile"
  },
  "metadata": {
    "idempotencyKey": "vip-store-boost-v1",
    "updatedBy": "admin-123"
  }
}
```

- Server behavior:
  - Validates JWT + CSRF.
  - Verifies caller’s role (must be `EDITOR` or higher for the relevant brand).
  - Ensures the payload conforms to the schema.
  - Upserts the Sanity document with `_id = "rule:vip-store-boost"`.

If the client retries the same payload due to a network timeout, the server simply performs another upsert with identical data — no duplicate rules are created.

## Recommendations for buyers

- Put `/personalization/apply` behind your standard API gateway and use its features (rate limits, WAF, JWT verification, nonce/timestamp enforcement) where appropriate.
- Consider signing personalization requests from your own backend when they include sensitive context; the CMS does not require a signature but works well behind a signed edge.
- Add custom logging fields (for example, `segment`, `experimentId`) to `req.log` in personalization routes so you can analyze rule effectiveness over time.

For request/response shape details, see [`PERSONALIZATION_CLIENT_GUIDE.md`](./PERSONALIZATION_CLIENT_GUIDE.md).
