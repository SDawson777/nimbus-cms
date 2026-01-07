# Security Posture Memo (Nimbus CMS)

This memo summarizes Nimbus CMS security controls as implemented in the repo, focusing on threat vectors and concrete mitigations.

## Scope

In scope:
- Admin authentication and authorization
- Browser security (CSRF, CORS, cookies)
- API abuse controls (rate limiting)
- Secrets and environment hardening
- Observability for security-relevant events

Out of scope (deployment-dependent):
- Cloud provider network controls (WAF, private networking)
- Customer IAM/SSO
- Dedicated SIEM integrations

## System Summary (Security-Relevant)

- API: `server/` (Node.js/Express/TS)
- Admin SPA: `apps/admin/` (served standalone or via `server/static` under `/admin`)
- Content: Sanity project/dataset
- Data: Postgres via Prisma (`DATABASE_URL`), optional Redis (`REDIS_URL`)

## Threats → Mitigations

| Threat | What could happen | Mitigations in repo |
|---|---|---|
| Credential stuffing against admin login | Account takeover; data leakage; privileged actions | Rate limiting on sensitive routes (see `docs/SECURITY_NOTES.md`); bcrypt password verification; session lifetime enforced by JWT maxAge (cookie) |
| Session/token theft | Unauthorized admin access | Admin auth uses an HTTP-only cookie (`admin_token`) to reduce JS access; rotate `JWT_SECRET` to invalidate sessions |
| CSRF against admin actions | Attacker induces state-changing requests from victim browser | Double-submit CSRF: `admin_csrf` cookie + `x-csrf-token` header required for state-changing routes (`server/src/middleware/requireCsrfToken.ts`; described in `docs/SECURITY_NOTES.md`) |
| Cross-origin access / data exfiltration | Malicious site calls API with victim cookies | CORS allowlist enforced in `server/src/middleware/cors.ts` (per-client origins: `CORS_ORIGIN_ADMIN`, `CORS_ORIGIN_MOBILE`; preview controls: `PREVIEW_ALLOW_ALL`, `PREVIEW_ALLOWED_ORIGINS`) |
| Misconfiguration of CORS allowlists | Overly permissive access in production | Env validation warns/optionally fails if `CORS_ORIGINS` is missing in prod (`server/src/middleware/validateEnv.ts`); CORS middleware blocks unknown origins by default |
| Tenant/brand/store lateral movement | Admin from one tenant accesses another’s data | RBAC + scope enforcement on admin routes (see `docs/SECURITY_NOTES.md` and `docs/RBAC_MATRIX.md`) |
| Upload abuse (logo/assets) | Malware/oversized uploads; content poisoning | Upload validation + scoping described in `docs/SECURITY_NOTES.md` (MIME/size checks, brand scoping) |
| API scraping / abuse | Excessive requests; brute force | Global and route-specific rate limiting (see `docs/SECURITY_NOTES.md`) |
| Analytics spoofing (if enabled) | Poisoned analytics; false reporting | HMAC signature validation for analytics ingest described in `docs/SECURITY_NOTES.md` |
| Supply chain / dependency risk | Vulnerable dependency exploited | CI scripts exist for env/license checks (`pnpm audit:client-envs`, `pnpm licenses:generate`); standard npm/pnpm lockfile usage |
| Secrets leakage | API tokens or DSNs exposed publicly | Secrets are expected only in env (Railway/Vercel/Docker); docs emphasize not committing `.env`; server env validation warns on missing critical vars |
| Silent production failures | Incidents undetected | Sentry integration for server and (optionally) Admin SPA; health/readiness endpoints (`/healthz`, `/ready`) |

## Authentication Flow (Admin)

**Initial Login** (`POST /admin/login`):

1. Client sends `{ email, password }` to `/admin/login`.
2. Server validates credentials against:
   - File-based config (`server/config/admins.json`) if present, or
   - Database (`AdminUser` table via Prisma), or
   - Single env-based admin (`ADMIN_EMAIL`/`ADMIN_PASSWORD` fallback).
3. Server generates:
   - JWT with payload: `{ id, email, role, organizationSlug, brandSlug, storeSlug, iat, exp }`
   - CSRF token (random 32-byte hex string)
4. Server sets cookies:
   - `admin_token` (HTTP-only, Secure in prod, SameSite=Lax/None based on `COOKIE_SAMESITE`)
   - `admin_csrf` (readable by JS, same security attributes)
5. Both cookies have `maxAge: 4 hours` (`SESSION_MAX_AGE_MS = 4 * 60 * 60 * 1000`).

**Session Validation** (Authenticated Routes):

- Middleware (`server/src/middleware/adminAuth.ts`) reads `admin_token` cookie.
- Verifies JWT signature with `JWT_SECRET`.
- Checks expiration (`exp` claim).
- Attaches decoded admin to `req.admin`.

**Token Rotation**:

- No automatic rotation; sessions expire after 4 hours.
- To invalidate all sessions: rotate `JWT_SECRET` and restart the server.
- Individual logout: `POST /admin/logout` clears cookies (server sets `maxAge=-1`).

**CSRF Protection**:

- State-changing routes (POST/PUT/DELETE) require:
  - Valid `admin_token` cookie (proves authentication), AND
  - `X-CSRF-Token` header matching `admin_csrf` cookie value.
- Middleware: `server/src/middleware/requireCsrfToken.ts`.
- If CSRF token is missing or invalid, server issues a fresh token and returns 403.

## RBAC and Tenant Isolation

**Role Hierarchy** (from `prisma/schema.prisma` `AdminRole` enum):

- `OWNER`: full access to all admin functions.
- `ORG_ADMIN`: organization-level admin (can invite/manage admins within their org).
- `EDITOR`: content editing, theme changes, personalization rules.
- `VIEWER`: read-only access to analytics and compliance.

**Scope Enforcement**:

- Admin JWT includes `organizationSlug`, `brandSlug`, `storeSlug` claims.
- Routes check `req.admin.role` and scopes before granting access.
- Example: compliance snapshot generation restricted to `ORG_ADMIN` or `OWNER`.
- RBAC matrix: see `docs/RBAC_MATRIX.md`.

**Tenant Isolation** (Data Model):

- Multi-tenant Postgres schema: `Tenant` model with cascading relations to `Store`, `User`, `Order`, etc.
- API routes enforce tenant scoping via query param `?tenant=<slug>` (validated against admin's allowed tenants).
- Sanity content: each tenant has a distinct dataset or namespaced documents (depending on deployment).

## Environment Hardening

- `JWT_SECRET` strength checks in production with optional strict mode (`STRICT_ENV_VALIDATION=true`) in `server/src/middleware/validateEnv.ts`.
- `DATABASE_URL` is required.
- Sanity vars are warned/strict-failed depending on environment/strictness.

## Database Access and Logging Policies

**Database Access**:

- Application uses Prisma Client (`@prisma/client`) with connection pooling.
- Connection string: `DATABASE_URL` (Postgres).
- No direct SQL queries outside Prisma (except admin tooling or migrations).
- Least-privilege principle: application should not have superuser access.

**Logging**:

- Structured JSON logs via `server/src/lib/logger.ts` (pino).
- Log levels: `trace`, `debug`, `info`, `warn`, `error`, `fatal`.
- Request logging: each request gets a unique `requestId` (middleware: `server/src/middleware/requestId.ts`).
- Sensitive data (passwords, tokens) must NOT be logged.
- Error logs include stack traces but are redacted for sensitive fields before sending to Sentry.

**Audit Logs** (Database):

- `AuditLog` model tracks tenant-level actions: `{ tenantId, action, actorId, details, createdAt }`.
- Currently used for compliance operations; can be extended for broader admin actions.

## Observability and Auditability

**Sentry Integration**:

- Server: `SENTRY_DSN` enables error capture (`server/src/lib/sentry.ts`).
- Admin SPA: `VITE_SENTRY_DSN` enables browser error capture (optional).
- Captures unhandled exceptions, 5xx errors, and explicit `captureException()` calls.
- Environment: `SENTRY_ENVIRONMENT` (e.g., `production`, `preview`, `local`).
- Traces sample rate: `SENTRY_TRACES_SAMPLE_RATE` (default: 0.1).
- Profiles sample rate: `SENTRY_PROFILES_SAMPLE_RATE` (default: 0.01).

**Health Endpoints**:

- `GET /healthz` (liveness): always returns 200 if server is running.
- `GET /ready` (readiness): checks DB connectivity (Prisma) and Sanity availability; returns 200 if ready, 503 otherwise.

## Known Gaps / Buyer Notes

- CORS env vars are referenced with two schemes:
  - `server/src/middleware/cors.ts` uses `CORS_ORIGIN_ADMIN`/`CORS_ORIGIN_MOBILE` (+ preview allowlist).
  - `server/src/middleware/validateEnv.ts` validates `CORS_ORIGINS` (+ optional `*_ORIGIN` vars).
  - Recommendation: standardize deployments on the values used by `cors.ts` and update docs/env templates accordingly.
- No built-in SSO/SCIM; admin auth is email/password + JWT cookies.

## References

- Security overview: `docs/SECURITY_NOTES.md`
- RBAC matrix: `docs/RBAC_MATRIX.md`
- CORS middleware: `server/src/middleware/cors.ts`
- Env validation: `server/src/middleware/validateEnv.ts`
