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

## Environment Hardening

- `JWT_SECRET` strength checks in production with optional strict mode (`STRICT_ENV_VALIDATION=true`) in `server/src/middleware/validateEnv.ts`.
- `DATABASE_URL` is required.
- Sanity vars are warned/strict-failed depending on environment/strictness.

## Observability and Auditability

- Sentry captures unhandled errors (see `docs/SECURITY_NOTES.md`).
- Operational health endpoints:
  - `GET /healthz` (liveness)
  - `GET /ready` (readiness checks; DB + Sanity in typical deployments)

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
