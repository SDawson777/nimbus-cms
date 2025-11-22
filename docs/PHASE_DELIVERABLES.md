# Blueprint Phases – Remaining Deliverables

> Living checklist distilled from the "FINAL HARDEN + POLISH" blueprint. Tracks every outstanding implementation, test, and documentation artifact across Phases 1–5 plus validation.

## Scope assumptions
- Brand scope is derived from the `x-brand` header for API clients and from selected brand context within the admin SPA; falling back to the authenticated user's `brands` array.
- Store scope is optional and only enforced when endpoints touch store-specific resources (inventory, orders, personalization rollouts).
- Existing endpoints must remain backwards-compatible; feature flags default to current behavior until env overrides are toggled.
- All new caching must be in-memory per instance (no shared Redis) unless explicitly stated otherwise in the blueprint.

## Phase 1 – RBAC & Scoping
- [x] Enforce `canAccessBrand` / `ensureBrandScope` for all brand-aware admin routes (`/api/admin/theme`, `/api/admin/content`, `/api/admin/personalization`, `/api/admin/compliance`, `/api/admin/products`, `/api/admin/stores`).
- [x] Enforce `canAccessStore` / `ensureStoreScope` wherever per-store data is fetched (inventory, orders, personalization rolls).
- [x] Harden upload endpoints to ensure brand-bound assets only.
- [x] Produce `docs/RBAC_MATRIX.md` detailing roles × endpoints × required scopes, including sample payloads.
- [x] Update `docs/ARCHITECTURE.md` and admin README to link to RBAC guidance.

## Phase 2 – Compliance Caching & Scheduler Flag
- [x] Add short-lived cache (60s) around compliance overview aggregation.
- [x] Rename env flag to `ENABLE_COMPLIANCE_SCHEDULER` (server + docs) and ensure scheduler only starts once per cluster.
- [x] Document single-instance scheduler strategy plus operational checks.
- [x] Ensure `/api/admin/compliance/overview` honors `?brand=` / `?store=` filters with new caching layer.

## Phase 3 – Tests & Edge Cases
- [x] Extend Vitest coverage: compliance snapshot edge cases, invalid personalization rules, analytics aggregation fallback.
- [x] Add fixtures for zero-state compliance + partially-paused personalization rules.
- [x] Document mobile/web client guidance for personalization API usage (webhook cadence, cache TTL, fallback UX).

## Phase 4 – Admin SPA Polish
- [x] Add consistent loading/error/empty states to Analytics, Compliance, Personalization, and Theme pages.
- [x] Wire analytics page to show last-refresh + manual refresh button (uses `/api/admin/analytics/summary`).
- [x] Add optimistic badge for theme preview & accessible form validation messaging.
- [x] Ensure `apps/admin` consumes new RBAC-aware scope metadata (disable actions when unauthorized).

## Phase 5 – Documentation Suite
- [x] `docs/RBAC_MATRIX.md` – endpoint coverage and examples.
- [x] `docs/API_REFERENCE_ADMIN.md` – request/response contracts for `/api/admin/*`.
- [x] `docs/SECURITY_NOTES.md` – threat model, authn/z, scheduler guidance, secrets hygiene.
- [x] Update root `README.md` + `docs/ARCHITECTURE.md` with deployment steps, admin SPA instructions, buyer enablement notes.

## Validation & Handoff
- [x] Run full test suite (`npm run test --workspaces` or equivalent) and lint.
- [x] Provide release notes summarizing deltas per phase and any migration instructions (env flag rename, scheduler notes).
