# Nimbus CMS Suite

Nimbus is a multi-tenant content platform with three canonical modules:

- **Admin SPA (`apps/admin`)** – React/Vite control plane with analytics, theming, personalization, compliance, and AI concierge.
- **Sanity Studio (`apps/studio`)** – Authoring environment for content, legal docs, and personalization rules.
- **API Server (`server`)** – Express + TypeScript backend that secures admin routes, proxies content, and provides analytics/AI endpoints.

Legacy or duplicate folders (e.g., `admin/`, `api/`, `nimbus-admin*`, `nimbus-cms*`, `legacy/`, `core-api/`, `infra/`, `static/`) are non-canonical and can be ignored for day-to-day work.

## System map

- **Entry points**
  - Admin: `apps/admin/src/main.jsx`
  - Studio: `apps/studio/sanity.config.ts`
  - API: `server/src/index.ts`
- **Build tools**
  - Admin: Vite 7
  - Studio: Sanity CLI 4
  - API: TypeScript + tsc
- **Package manager**: pnpm (Node 20+)
- **Environments**
  - Admin/Studio: Vercel
  - API: Railway or Docker/Kubernetes

## Quick start (local)

```bash
pnpm install
pnpm admin:dev      # starts Vite dev server for Admin
pnpm studio:dev     # starts Sanity Studio
pnpm server:dev     # starts Express API with ts-node-dev
```

## Production builds

```bash
pnpm admin:build    # apps/admin/dist
pnpm studio:build   # apps/studio/dist (also copied to ./dist for Netlify/preview)
pnpm server:build   # server/dist
```

## Verify tenant isolation (API)

The demo seed creates two database tenants:

- `demo-operator`
- `tenant-b`

You can verify tenant isolation by using the admin API with a tenant query param.

1) Seed demo data (writes both tenants):

```bash
ALLOW_INSECURE_DEMO_PASSWORDS=true pnpm prisma:seed
```

2) Start the server:

```bash
pnpm server:dev
```

3) Log in and store cookies:

```bash
curl -sS -c /tmp/nimbus-admin.cookies \
  -H 'content-type: application/json' \
  -d '{"email":"e2e-admin@example.com","password":"e2e-password"}' \
  http://localhost:8080/admin/login
```

4) Compare tenant-scoped results:

```bash
# Stores differ per tenant
curl -sS -b /tmp/nimbus-admin.cookies \
  'http://localhost:8080/api/admin/orders/stores?tenant=demo-operator'

curl -sS -b /tmp/nimbus-admin.cookies \
  'http://localhost:8080/api/admin/orders/stores?tenant=tenant-b'

# Orders differ per tenant
curl -sS -b /tmp/nimbus-admin.cookies \
  'http://localhost:8080/api/admin/orders?tenant=demo-operator'

curl -sS -b /tmp/nimbus-admin.cookies \
  'http://localhost:8080/api/admin/orders?tenant=tenant-b'
```

## Key features

- Secure admin login with CSRF-protected API calls
- Admin user management with email invitations and password reset
- Multi-tenant workspace + dataset selectors
- 2D analytics with motion-enhanced cards and charts (production default)
- AI concierge (preview-safe messaging, API-backed responses when configured)
- Legal + Data/AI usage panels for buyer transparency
- Centralized API client, CSRF handling, and global error boundary in Admin
- Email notifications via SendGrid integration

## Buyer Quickstart

**New to this codebase?** Follow these steps to validate the system in under 30 minutes.

### Demo Credentials

For local testing and demos:

- **Admin login**: `e2e-admin@example.com` / `e2e-password` (OWNER role)
- **Secondary admin**: `e2e-editor@example.com` / `e2e-editor-pass` (EDITOR role)
- **Customer login**: `demo.customer@nimbus.local` / (set via `DEMO_CUSTOMER_PASSWORD` in demo environments)

### Quick Demo (Local)

1. **Install dependencies**:
   ```bash
   pnpm install
   ```

2. **Seed E2E test data** (creates admin users + demo tenants):
   ```bash
   pnpm -C server seed:e2e
   ```

3. **Start the API server**:
   ```bash
   pnpm server:dev
   # Server starts on http://localhost:8080
   ```

4. **Build and run Admin SPA**:
   ```bash
   # Option A: Dev mode (hot reload)
   pnpm admin:dev
   # Admin UI at http://localhost:5174
   
   # Option B: Production build (served by API)
   pnpm admin:build
   # Then navigate to http://localhost:8080/admin
   ```

5. **Verify the system**:
   - Login at `http://localhost:8080/admin` (or `:5174`)
   - Navigate to **Dashboard** → see analytics widgets
   - Navigate to **Orders** → see read-only order data
   - Navigate to **Settings** → test theme changes
   - Check **Personalization** → view/create rules

### Smoke Test Checklist

Quick validation steps (5 minutes):

- [ ] API health: `curl http://localhost:8080/healthz` → 200 OK
- [ ] API readiness: `curl http://localhost:8080/ready` → 200 OK
- [ ] Admin login works (credentials above)
- [ ] Dashboard loads with analytics cards
- [ ] Orders page loads (read-only view, shows "source-of-truth" note)
- [ ] Settings page: theme/accent changes persist
- [ ] No console errors in browser dev tools
- [ ] Sentry initialized (check browser console for "Sentry initialized" log)

**Full acceptance test**: see [BUYER_SMOKE_TEST.md](./BUYER_SMOKE_TEST.md) (30-minute detailed checklist).

### Run E2E Tests

Automated Playwright tests cover critical admin flows:

```bash
# Run full E2E suite (automatically seeds, builds, starts server)
bash scripts/run-e2e-admin.sh

# Or manually:
pnpm -C server seed:e2e
pnpm -C apps/admin build
PORT=8080 pnpm -C server dev &  # start in background
E2E_BASE_URL=http://localhost:8080 pnpm -C apps/admin exec playwright test
```

Expected: 9 tests passed.

## Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) – System architecture and data flow
- [ARCHITECTURE_ENVIRONMENTS.md](./docs/ARCHITECTURE_ENVIRONMENTS.md) – Environment-specific deployment
- [DEPLOYMENT.md](./DEPLOYMENT.md) – Deployment guides for Railway/Vercel/Docker
- [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md) → [docs/ENV_VARIABLES.md](./docs/ENV_VARIABLES.md) – Canonical env var reference
- [BUYER_HANDBOOK.md](./BUYER_HANDBOOK.md) – Buyer overview and operational guide
- [BUYER_SMOKE_TEST.md](./BUYER_SMOKE_TEST.md) – 30-minute acceptance test checklist
- [docs/START_HERE_DATA_ROOM_INDEX.md](./docs/START_HERE_DATA_ROOM_INDEX.md) – Data room index with links to all docs
- [docs/SECURITY_POSTURE_MEMO.md](./docs/SECURITY_POSTURE_MEMO.md) – Security posture, auth flow, RBAC
- [docs/BACKUP_AND_DR_RUNBOOK.md](./docs/BACKUP_AND_DR_RUNBOOK.md) – Backup/restore procedures
- [docs/SBOM-nimbus-cms.json](./docs/SBOM-nimbus-cms.json) – Software Bill of Materials (1,696 components)

## Enterprise readiness checklist

- **Environment validation**: API validates `JWT_SECRET`, `CORS_ORIGINS`, and other required secrets at boot (see `server/src/middleware/validateEnv.ts`).
- **Global error handling**: centralized JSON error handler logs with correlation IDs (`server/src/middleware/errorHandler.ts`).
- **Client secret audit**: run `pnpm audit:client-envs` to scan `apps/*/.env.example` for unsafe `VITE_*` secrets.
- **License report**: generate dependency license summary with `pnpm licenses:generate` (writes `docs/licenses.md`).
- **Monitoring**: use `/metrics` Prometheus endpoint and wire logs to your aggregator (see `docs/observability.md`).

# Force Railway redeploy
# Trigger redeploy - content sync Tue Feb  3 23:02:17 EST 2026
