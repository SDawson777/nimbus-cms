# Release Manifest

**System of record:** `nimbus-cms`

## Repositories

- `nimbus-cms`
  - Tag: `v1.0.0-nimbus-cms`
  - Commit: `390f1708aa58890cc857a00c2da3c5ff3257e9de`
  - Build IDs: N/A (not recorded in repo)

- `nimbus-cannabis-mobile`
  - Tag: `v1.0.0-nimbus-mobile` (create in that repo)
  - Commit: (fill)
  - Build IDs: (fill)

## Environment Matrix

> Replace URLs below if your deployment uses different hostnames.

### DEMO

- Admin SPA: `https://nimbus-admin-demo.vercel.app`
- Studio: (fill, e.g. `https://nimbus-studio-demo.vercel.app`)
- API base: `https://nimbus-api-demo.up.railway.app`
  - Health: `https://nimbus-api-demo.up.railway.app/healthz`
  - Ready: `https://nimbus-api-demo.up.railway.app/ready`
- Sanity dataset: `nimbus_demo`
- Sentry environment: `demo`

### STAGING / PREVIEW

- Admin SPA: `https://nimbus-admin-preview.vercel.app`
- Studio: (fill, e.g. `https://nimbus-studio-preview.vercel.app`)
- API base: `https://nimbus-api-preview.up.railway.app`
  - Health: `https://nimbus-api-preview.up.railway.app/healthz`
  - Ready: `https://nimbus-api-preview.up.railway.app/ready`
- Sanity dataset: `nimbus_preview`
- Sentry environment: `preview`

### PRODUCTION

- Admin SPA: `https://nimbus-admin-prod.vercel.app`
- Studio: (fill, e.g. `https://nimbus-studio-prod.vercel.app`)
- API base: `https://nimbus-api-prod.up.railway.app`
  - Health: `https://nimbus-api-prod.up.railway.app/healthz`
  - Ready: `https://nimbus-api-prod.up.railway.app/ready`
- Sanity dataset: (fill)
- Sentry environment: `production`

## Observability Projects

- Sentry (server/API): `nimbus-cms-server` (`SENTRY_DSN`)
- Sentry (admin SPA): `nimbus-admin-spa` (`VITE_SENTRY_DSN`)
- Sentry (mobile): `nimbus-mobile` (mobile repo env)

## Notes

- Tags should be created from clean working trees and pushed to origin as part of the product freeze.
- Monitoring setup and backup policies are documented in:
  - `docs/OPS_MONITORING_AND_ALERTS.md`
  - `docs/BACKUP_AND_DR_RUNBOOK.md`
  - `docs/DRY_RUN_RESTORE_LOG.md`
  - `docs/LEGAL_CONTENT_SWAP_GUIDE.md`
