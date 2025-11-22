# JARS CMS — Release Notes (Phases 1–5)

This drop completes the "FINAL HARDEN + POLISH" blueprint across all phases. Highlights and migration notes below.

## Phase 1 – RBAC & Scoping

- All brand-aware admin routes now call `ensureBrandScope`/`ensureStoreScope` so JWT scope slugs are enforced uniformly (theme, personalization, compliance, products, stores).
- Upload endpoints (`/api/admin/upload-logo*`) require a target brand and reject files outside the caller's scope or size/type policy.
- [`docs/RBAC_MATRIX.md`](./RBAC_MATRIX.md) documents endpoint × role coverage with scope notes.
- README + Admin SPA reference this RBAC guidance so buyers know how to provision roles.

## Phase 2 – Compliance cache & scheduler flag

- `COMPLIANCE_OVERVIEW_CACHE_TTL_MS` defaulted to 60s with proper cache headers.
- Env rename to `ENABLE_COMPLIANCE_SCHEDULER` is complete; only one instance in each cluster should set it to `true` so the snapshot job runs exactly once.
- Admin compliance overview displays cache hits/misses per scope.

## Phase 3 – Tests & Edge Cases

- Added Vitest coverage for compliance snapshot RBAC, invalid `types[]`, analytics fallback to persisted caches, and personalization rule edge cases.
- Fixtures: `tests/fixtures/compliance-zero-state.json` (zero-doc state) and `tests/fixtures/personalization-partial.json` (partially paused/invalid rules) are available for new tests or demos.
- [`docs/PERSONALIZATION_CLIENT_GUIDE.md`](./PERSONALIZATION_CLIENT_GUIDE.md) explains request cadence, cache TTL, and fallback UX for `/personalization/apply` clients.

## Phase 4 – Admin SPA Polish

- Analytics, Compliance, Theme, and Personalization pages now show consistent loading/error/empty states and expose manual refresh buttons with stale indicators.
- Theme editor includes inline validation messaging, focus management, and an "Unsaved changes" preview badge.
- New `AdminProvider`/`useAdmin` context hydrates role + scope metadata from `/admin/me`, disabling UI actions when the role matrix denies a capability.

## Phase 5 – Documentation Suite

- [`docs/API_REFERENCE_ADMIN.md`](./API_REFERENCE_ADMIN.md) catalogs every `/api/admin/*` route with request/response contracts and RBAC requirements.
- [`docs/SECURITY_NOTES.md`](./SECURITY_NOTES.md) captures the threat model, scheduler runbook, and secret hygiene checklist.
- README + `docs/ARCHITECTURE.md` link to the new references for easier buyer enablement.

### v1.2.0 – Documentation and runbook completion (2025-11-21)

- Replaced and expanded the RBAC matrix in `docs/RBAC_MATRIX.md` to include a full role hierarchy, per-route permissions, scope enforcement notes, and multi-tenant behavior.
- Added `scripts/README.md` documenting Sanity dataset export/import/promote scripts, `--dry-run`/`--force` safety flags, and backup best practices for migrations.
- Introduced `docs/observability.md` as an SRE-facing runbook covering structured JSON logging, `requestLogger`, `requestId` lifecycle, and integration with external observability platforms.
- Added `docs/personalization.md` describing replay protection and idempotency expectations for `/personalization/apply` and admin personalization routes, including recommendations for nonce/timestamp usage and JWT+CSRF protections.

## Validation

- Test suite: `npm test` (Vitest) — **PASS** on 2025-11-21.
- Lint/build: unchanged from previous release; no new warnings introduced.

## Migration checklist

1. Rotate to `ENABLE_COMPLIANCE_SCHEDULER` (set on exactly one instance) before deploying.
2. Ensure JWT scopes (`organizationSlug`, `brandSlug`, `storeSlug`) are populated for admins who need scoped access; otherwise RBAC helpers will block requests.
3. Provide analytics ingest clients with the correct `ANALYTICS_INGEST_KEY` and signature logic (see README).
4. Share the new RBAC/API/Security docs with buyer teams so they understand scope enforcement and operational expectations.
