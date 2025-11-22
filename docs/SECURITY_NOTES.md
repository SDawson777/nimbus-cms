# Security Notes & Operational Guidance

This document captures the hardening steps that accompany the "FINAL HARDEN + POLISH" blueprint. Share it with SRE / platform teams when deploying the CMS.

## Threat model snapshot

| Vector | Mitigation |
| --- | --- |
| Credential stuffing against `/admin/login` | Rate limiting (`ADMIN_LOGIN_RATE_LIMIT_*`), bcrypt password hashes, 4h session lifetime, optional brand/store hints to limit scope. |
| Cross-site request forgery | All state-changing routes require the double-submit CSRF token (`admin_csrf` cookie + `X-CSRF-Token`). The Admin SPA uses `csrfFetch` to attach it automatically. |
| Lateral movement between tenants | RBAC middleware (`requireRole`) + scope helpers (`ensureBrandScope`, `ensureStoreScope`, `canAccessBrand`, `canAccessStore`) gate every admin route, upload, and recall action. |
| Asset poisoning via uploads | Logo uploads validate MIME/extension and size (`MAX_LOGO_BYTES`), run through Sanity asset pipelines, and are brand-scoped before writes. |
| Replay or tampering of analytics ingest | `/analytics/event` requires an HMAC signature per request (`X-Analytics-Key` + `X-Analytics-Signature`). |
| Scheduler duplication | `ENABLE_COMPLIANCE_SCHEDULER` gate ensures only one worker per cluster runs the compliance snapshot job. Documented runbooks emphasize single-instance deployment. |

## Authentication & session handling

- Admin login issues two cookies:
  - `admin_token` (HTTP-only, signed JWT, 4h max age).
  - `admin_csrf` (readable, random 32-byte token).
- Tokens encode role + scoped slugs (`organizationSlug`, `brandSlug`, `storeSlug`). Downstream routes recompute capabilities from these claims and enforce them server-side.
- To revoke sessions, rotate `JWT_SECRET` or clear cookies via `/admin/logout`.

### Password storage
- File-based admins (from `config/admins.json`) must include `passwordHash` (bcrypt). Use `npm run admin:hash <password>` helper (see README snippet) or `bcryptjs.hash(password, 12)`.
- Environment-based fallback reads `ADMIN_PASSWORD` or `ADMIN_PASSWORD_HASH` for the single emergency admin.

## Authorization & RBAC

- Role hierarchy lives in `server/src/middleware/requireRole.ts`. Updating the matrix there automatically flows to the Admin SPA (which fetches `/admin/me`).
- Documented matrix: [`docs/RBAC_MATRIX.md`](./RBAC_MATRIX.md).
- Frontend gating: `apps/admin/src/lib/adminContext.jsx` derives `capabilities` so UI actions (refresh analytics, edit theme, run compliance snapshot, etc.) are disabled before the request leaves the browser.

## Scheduler & background jobs

- `server/src/jobs/complianceSnapshotJob.ts` is guarded by `ENABLE_COMPLIANCE_SCHEDULER`. Run this job on exactly **one** pod/container per cluster.
- Operational steps:
  1. Choose the "scheduler" instance (often the leader / worker pool #0).
  2. Set `ENABLE_COMPLIANCE_SCHEDULER=true` only on that instance.
  3. Monitor logs for `jobs.compliance_snapshot.run` to ensure it executes hourly.
  4. If the scheduler crashes, another instance can be promoted by toggling the env flag (but only after the original is stopped).

## Secrets & environment hygiene

| Variable | Purpose | Notes |
| --- | --- | --- |
| `JWT_SECRET` | Signs admin tokens | Rotate quarterly and on incident. Minimum 32 random bytes. |
| `SANITY_API_TOKEN` | Writes content from server | Scope to the dataset with least privilege (`write`, `create`, `delete`). |
| `SANITY_PREVIEW_TOKEN` | Draft preview fetches | Treat as read-only; rotate if leaked. |
| `PREVIEW_SECRET` | Enables preview mode | Only share with trusted frontend deployments. |
| `ANALYTICS_INGEST_KEY` | Shared key for `/analytics/event` | Comma-separated list supported. Rotate and update clients accordingly. |
| `ENABLE_COMPLIANCE_SCHEDULER` | Background job flag | Must be `true` on only one instance. |

Additional tips:
- Store secrets in a managed vault (AWS Parameter Store, GCP Secret Manager, HashiCorp Vault). Avoid committing `.env` files.
- Enable HTTPS everywhere; cookies rely on `secure` flag in production.
- Prefer separate datasets per environment (dev/staging/prod) to isolate data access.

## Logging & observability

- All routes use `req.log` (pino) with enriched fields (request id, admin email, role). Avoid `console.log`.
- Sensitive fields (passwords, tokens) are never logged. If you add new logs, scrub payloads before logging.
- Recommended alerts:
  - Login failure rate spikes (>30% of attempts in 5 min).
  - Compliance job failures or duration > 2 minutes.
  - Analytics signature verification failures (`INVALID_ANALYTICS_SIGNATURE`).

## Incident response quick checks

1. **Suspected token leak** → rotate `JWT_SECRET`, force logout via cookie clear, and inspect audit logs.
2. **Unexpected snapshot writes** → inspect `complianceSnapshot-*` docs and `req.log` entries for unusual admins.
3. **Upload abuse** → search Sanity assets by uploader email (`admin.upload_logo` logs include `admin` + `brand`).
4. **Role escalation** → cross-reference `docs/RBAC_MATRIX.md` to verify the route enforces the expected minimum role.

Keep this document with release artifacts and update it whenever security-sensitive behavior changes.
