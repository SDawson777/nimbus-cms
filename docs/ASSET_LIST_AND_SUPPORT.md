# Asset List and Support Requirements

This document enumerates **all assets included** in the Nimbus CMS acquisition and defines **what the buyer must provision** separately. Use this as a comprehensive checklist during the handoff process.

---

## 1. Included Assets

### 1.1 Source Code Repository

**Location**: Single monorepo (this repository)  
**URL**: Provide your GitHub/GitLab repository URL to the buyer

The repository contains:

- **apps/admin**: React + Vite Admin SPA (control plane UI)
- **apps/studio**: Sanity Studio (content management UI)
- **server**: Express + TypeScript API (REST endpoints, RBAC, multi-tenancy)
- **prisma**: Database schema, migrations, multi-tenant seed script
- **scripts**: Automation (seed scripts, E2E runner, Sanity export/import, SBOM generation)
- **tests**: Vitest (server unit tests), Playwright (admin E2E tests)
- **docs**: Comprehensive documentation (architecture, deployment, security, backup/DR, buyer guides)
- **infra**: Docker Compose and Kubernetes manifests (if applicable)

### 1.2 Documentation Suite

All documentation is included in the `docs/` folder:

| Document | Purpose |
|----------|---------|
| [README.md](../README.md) | Project overview, Buyer Quickstart with demo credentials |
| [ARCHITECTURE.md](../ARCHITECTURE.md) | System architecture and design decisions |
| [DEPLOYMENT.md](../DEPLOYMENT.md) | Deployment guide for Railway/Vercel/Docker |
| [ENV_VARIABLES.md](ENV_VARIABLES.md) | Canonical environment variable reference |
| [SECURITY_POSTURE_MEMO.md](SECURITY_POSTURE_MEMO.md) | Security posture (auth flow, RBAC, tenant isolation, Sentry, DB/logging) |
| [BACKUP_AND_DR_RUNBOOK.md](BACKUP_AND_DR_RUNBOOK.md) | Backup/restore procedures (Postgres, Sanity, verification steps) |
| [START_HERE_DATA_ROOM_INDEX.md](START_HERE_DATA_ROOM_INDEX.md) | Master index for data room with links to all technical documentation |
| [BUYER_SMOKE_TEST.md](BUYER_SMOKE_TEST.md) | 5-minute smoke test checklist for validation |
| [SBOM-nimbus-cms.json](SBOM-nimbus-cms.json) | Software Bill of Materials (1,696 components with licenses) |
| [ADMIN_PERSISTENCE.md](ADMIN_PERSISTENCE.md) | Admin user data model and database integration |
| [SENTRY_SETUP.md](SENTRY_SETUP.md) | Sentry error tracking setup for API and Admin SPA |
| [DEMO_ENVIRONMENT.md](DEMO_ENVIRONMENT.md) | Demo environment setup guide |
| [OPS_MONITORING_AND_ALERTS.md](OPS_MONITORING_AND_ALERTS.md) | Operational monitoring and alerting guide |
| Additional docs | See `docs/` folder for 30+ technical guides |

### 1.3 Scripts and Automation

Included in the `scripts/` folder:

| Script | Purpose |
|--------|---------|
| `run-e2e-admin.sh` | End-to-end test runner (seeds data, builds Admin, starts server, runs Playwright) |
| `seed-sanity-demo.ts` | Seed Sanity CMS with demo content (articles, events, legal pages) |
| `sanity-export-demo.mjs` | Export Sanity dataset to JSON backup |
| `sanity-import-demo-restore.mjs` | Restore Sanity dataset from JSON backup |
| `generate-sbom.js` | Generate Software Bill of Materials (CycloneDX JSON) |
| `validate-env.js` | Validate required environment variables before deployment |
| `smoke-check-deploy.mjs` | Smoke test deployed environments (health checks, API readiness) |
| `audit-client-envs.js` | Audit client environment variables for security issues |
| `generate-license-report.js` | Generate license report for all dependencies |

### 1.4 Configuration Files

Included configuration:

- `.env.example`: Example environment variables (safe for repository)
- `package.json`: Root workspace configuration with pnpm scripts
- `pnpm-workspace.yaml`: Monorepo workspace definition
- `tsconfig.*.json`: TypeScript configurations for apps/admin, apps/studio, server
- `eslint.config.mjs`: ESLint configuration for code quality
- `vitest.config.ts`: Vitest test configuration
- `Dockerfile`: Docker container build configuration
- `docker-compose.yml`: Multi-container local development setup
- `vercel.json`: Vercel deployment configuration
- `netlify.toml`: Netlify deployment configuration (if used)
- `sanity.config.js`: Sanity Studio configuration

### 1.5 Database Schema and Migrations

Included in the `prisma/` folder:

- `schema.prisma`: Complete database schema with multi-tenancy support
- `migrations/`: All database migrations (version history)
- `seed.ts`: Multi-tenant seed script (creates tenant-a and tenant-b with isolated data)
- `tsconfig.seed.json`: TypeScript configuration for seed script execution

### 1.6 Artifacts

Generated artifacts (committed to repository):

- `docs/SBOM-nimbus-cms.json`: Software Bill of Materials (83,301 lines, 1,696 components with licenses)
- `pnpm-lock.yaml`: Dependency lockfile (ensures reproducible builds)
- `.github/workflows/`: CI/CD pipeline definitions (if applicable)

### 1.7 Test Suites

Comprehensive test coverage included:

- **Server unit tests**: 9 Vitest tests in `server/src/__tests__/` (auth, RBAC, tenant isolation)
- **Admin E2E tests**: 9 Playwright tests in `apps/admin/tests/` (critical flows: login, users, analytics, orders)
- **Type checking**: `pnpm -w run lint:types` validates TypeScript across all workspaces
- **Shared test helpers**: `apps/admin/tests/helpers/login.ts` (login helper with cookie injection)

All tests pass:
- ✓ Typecheck: `pnpm -w run lint:types`
- ✓ Server unit tests: `pnpm -C server test` (9 passed)
- ✓ Admin E2E tests: `bash scripts/run-e2e-admin.sh` (9 passed)

---

## 2. What the Buyer Must Provision

The following services, accounts, and infrastructure are **NOT included** and must be provisioned by the buyer:

### 2.1 Third-Party Services (Required)

#### Sanity CMS
- **What**: Headless CMS for content management (articles, events, legal pages, mobile content)
- **Action Required**:
  - Create new Sanity project at [sanity.io](https://www.sanity.io/)
  - Create datasets: `nimbus_demo`, `production` (or as needed)
  - Generate API tokens: read token (public), write token (server-side, keep secret)
  - Note project ID and configure in environment variables
- **Environment Variables**:
  - `SANITY_PROJECT_ID` (e.g., `ygbu28p2`)
  - `SANITY_DATASET` (e.g., `nimbus_demo`, `production`)
  - `SANITY_API_TOKEN` (write token for server-side operations)
- **Cost**: Free tier available; paid plans for production usage
- **Documentation**: See [docs/DEMO_ENVIRONMENT.md](DEMO_ENVIRONMENT.md#sanity-setup)

#### Sentry (Error Tracking)
- **What**: Error monitoring and performance tracking for API and Admin SPA
- **Action Required**:
  - Create Sentry organization at [sentry.io](https://sentry.io/)
  - Create two projects: `nimbus-api` (Node.js/Express), `nimbus-admin` (React)
  - Copy DSN URLs for each project
  - Configure Sentry environment (production, preview, demo)
- **Environment Variables**:
  - `SENTRY_DSN` (server DSN for API)
  - `VITE_SENTRY_DSN` (client DSN for Admin SPA)
  - `SENTRY_ENV` (e.g., `production`, `demo`)
- **Cost**: Free tier available; paid plans for higher event volumes
- **Documentation**: See [docs/SENTRY_SETUP.md](SENTRY_SETUP.md)

### 2.2 Third-Party Services (Optional)

#### Stripe (Payments)
- **What**: Payment processing for subscriptions, orders, invoicing
- **Action Required**:
  - Create Stripe account at [stripe.com](https://stripe.com/)
  - Generate API keys (test mode for demo, live mode for production)
  - Configure webhook endpoints for payment events
- **Environment Variables**:
  - `STRIPE_SECRET_KEY` (server-side secret key)
  - `STRIPE_PUBLISHABLE_KEY` (client-side publishable key)
  - `STRIPE_WEBHOOK_SECRET` (webhook signing secret)
- **Cost**: Transaction fees (2.9% + 30¢ per transaction in US)
- **Status**: Code references Stripe but integration depth varies by deployment
- **Documentation**: See [docs/ARCHITECTURE_ENVIRONMENTS.md](ARCHITECTURE_ENVIRONMENTS.md)

#### OpenAI (AI Features)
- **What**: AI concierge chat assistant in Admin SPA
- **Action Required**:
  - Create OpenAI account at [platform.openai.com](https://platform.openai.com/)
  - Generate API key
  - Set usage limits to control costs
- **Environment Variables**:
  - `OPENAI_API_KEY` (server-side API key)
  - `OPENAI_MODEL` (optional, defaults to `gpt-4o-mini`)
- **Cost**: Pay-per-token (varies by model)
- **Status**: Falls back to static playbook if not configured
- **Documentation**: See [server/src/routes/ai.ts](../server/src/routes/ai.ts)

#### Mapbox (Maps and Heatmaps)
- **What**: Map visualizations for Admin analytics heatmap feature
- **Action Required**:
  - Create Mapbox account at [mapbox.com](https://www.mapbox.com/)
  - Generate public token (safe to expose in client-side code)
  - Generate secret token (server-side, if needed)
- **Environment Variables**:
  - `VITE_NIMBUS_HEATMAP_MAPBOX_TOKEN` (public token for Admin SPA)
  - `MAPBOX_TOKEN` (optional server-side secret token)
- **Cost**: Free tier available; paid plans for higher usage
- **Status**: Optional; heatmap feature disabled if not configured
- **Documentation**: See [docs/ENV_VARIABLES.md](ENV_VARIABLES.md)

### 2.3 Hosting and Infrastructure

#### Railway (API + Postgres Database)
- **What**: API server and Postgres database hosting
- **Action Required**:
  - Create Railway account at [railway.app](https://railway.app/)
  - Create new project
  - Add Postgres database (Railway provides managed Postgres)
  - Deploy API service (connect to GitHub repo or use Docker)
  - Configure environment variables in Railway dashboard
  - Enable automatic backups (Railway Pro plan)
- **Environment Variables**: All API variables (see Section 2.5)
- **Cost**: Free $5/month credit; paid plans for production workloads
- **Alternatives**: Render, Heroku, AWS ECS, self-hosted Docker
- **Documentation**: See [docs/DEPLOYMENT.md](../DEPLOYMENT.md), [docs/BACKUP_AND_DR_RUNBOOK.md](BACKUP_AND_DR_RUNBOOK.md)

#### Vercel (Admin SPA + Studio)
- **What**: Static site hosting for Admin and Sanity Studio UIs
- **Action Required**:
  - Create Vercel account at [vercel.com](https://vercel.com/)
  - Create two projects: `nimbus-admin`, `nimbus-studio`
  - Connect to GitHub repo
  - Configure build commands:
    - Admin: `pnpm -C apps/admin build`
    - Studio: `pnpm -C apps/studio build`
  - Configure output directories:
    - Admin: `apps/admin/dist`
    - Studio: `apps/studio/dist`
  - Configure environment variables in Vercel dashboard
- **Environment Variables**:
  - Admin: `VITE_NIMBUS_API_URL`, `VITE_SENTRY_DSN`, `VITE_NIMBUS_HEATMAP_MAPBOX_TOKEN`
  - Studio: Sanity environment variables
- **Cost**: Free Hobby plan; paid plans for teams and higher bandwidth
- **Alternatives**: Netlify, AWS S3 + CloudFront, Cloudflare Pages
- **Documentation**: See [docs/DEPLOYMENT.md](../DEPLOYMENT.md)

### 2.4 Domain Names and DNS

- **What**: Custom domains for production deployments
- **Action Required**:
  - Purchase domain(s) from registrar (e.g., `nimbus-example.com`)
  - Configure DNS records:
    - Admin SPA: `admin.nimbus-example.com` → Vercel CNAME
    - Studio: `studio.nimbus-example.com` → Vercel CNAME
    - API: `api.nimbus-example.com` → Railway CNAME or A record
  - Configure SSL/TLS certificates (automatic with Vercel/Railway)
- **Environment Variables**:
  - Update `CORS_ORIGINS` to allow custom domains
  - Update `VITE_NIMBUS_API_URL` to point to custom API domain
- **Cost**: Domain registration fees (typically $10-20/year)
- **Documentation**: See [docs/DEPLOYMENT.md](../DEPLOYMENT.md)

### 2.5 Environment Variables (Complete List)

The buyer must configure all required environment variables in their hosting platforms:

#### API Server (Railway/Docker)
```bash
# App configuration
APP_ENV=production                    # demo | preview | prod
PORT=8080
DATABASE_URL=postgresql://...         # Postgres connection string
JWT_SECRET=<generate-strong-secret>   # Min 32 chars, use cryptographic RNG

# CORS (comma-separated origins)
CORS_ORIGINS=https://admin.example.com,https://studio.example.com

# Sanity CMS (required)
SANITY_PROJECT_ID=ygbu28p2           # Your Sanity project ID
SANITY_DATASET=production             # production, nimbus_demo, etc.
SANITY_API_TOKEN=<sanity-write-token> # Write token from Sanity project settings

# Sentry (recommended for production)
SENTRY_DSN=https://...@sentry.io/...
SENTRY_ENV=production

# Optional: AI features
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini

# Optional: Payments
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Optional: Maps (server-side)
MAPBOX_TOKEN=sk.ey...

# Admin seed (only for demo/preview environments)
ADMIN_SEED_ENABLED=false              # Set to true only for demo/preview
DEMO_TENANT_SLUG=demo-operator        # Only used if seeding enabled
```

#### Admin SPA (Vercel)
```bash
# API connection
VITE_NIMBUS_API_URL=https://api.example.com

# Sentry (recommended)
VITE_SENTRY_DSN=https://...@sentry.io/...

# Optional: Mapbox (public token, safe to expose)
VITE_NIMBUS_HEATMAP_MAPBOX_TOKEN=pk.ey...
```

#### Sanity Studio (Vercel)
```bash
# Configured in sanity.config.js, typically no env vars needed
# Studio uses projectId and dataset from config file
```

**Security Note**: Never commit real secrets to the repository. Use `.env.example` as a template and configure secrets in your hosting platform's dashboard.

---

## 3. Data Migration and Seeding

### 3.1 Database Seeding

The repository includes a multi-tenant seed script for demo/preview environments:

- **Script**: `prisma/seed.ts`
- **Run**: `pnpm run seed`
- **Creates**:
  - Admin users: `admin@example.com` (OWNER), `org-admin@example.com` (ORG_ADMIN), `editor@example.com` (EDITOR), `viewer@example.com` (VIEWER)
  - Two tenants: `tenant-a` and `tenant-b` with isolated data
  - Demo content: analytics, notifications, audit logs, orders
- **Environment**: Set `ADMIN_SEED_ENABLED=true` and `DEMO_TENANT_SLUG=demo-operator` in API environment
- **Production**: Set `ADMIN_SEED_ENABLED=false` for production (no automatic seeding)

### 3.2 Sanity CMS Seeding

The repository includes scripts to seed Sanity with demo content:

- **Script**: `scripts/seed-sanity-demo.ts`
- **Run**: `pnpm run demo:seed:sanity`
- **Creates**: Demo articles, events, legal pages, mobile content
- **Backup/Restore**:
  - Export: `pnpm run sanity:export-demo`
  - Import: `pnpm run sanity:import-demo-restore`

---

## 4. Deployment Checklist

Use this checklist to ensure all assets are properly configured:

### ☐ Source Code
- [ ] Repository transferred to buyer's GitHub/GitLab organization
- [ ] All team members have appropriate access (read/write permissions)
- [ ] CI/CD pipelines configured (if applicable)

### ☐ Third-Party Services
- [ ] Sanity project created (project ID and API tokens generated)
- [ ] Sanity datasets created (`production`, `nimbus_demo`)
- [ ] Sentry organization and projects created (DSNs configured)
- [ ] Stripe account created (if payments required)
- [ ] OpenAI API key generated (if AI features required)
- [ ] Mapbox account created (if heatmap features required)

### ☐ Hosting Infrastructure
- [ ] Railway account created and API service deployed
- [ ] Railway Postgres database provisioned and `DATABASE_URL` configured
- [ ] Vercel account created with Admin and Studio projects deployed
- [ ] Domain names purchased and DNS records configured
- [ ] SSL/TLS certificates active (automatic with Vercel/Railway)

### ☐ Environment Variables
- [ ] All API environment variables configured in Railway dashboard
- [ ] All Admin environment variables configured in Vercel dashboard
- [ ] Secrets validated using `pnpm run validate-env` (if script available)
- [ ] `CORS_ORIGINS` updated to include all frontend domains

### ☐ Database and Content
- [ ] Database migrated to production: `pnpm prisma migrate deploy`
- [ ] Sanity content seeded or migrated from existing project
- [ ] Admin users created (manual creation recommended for production)
- [ ] Backup schedule configured (Railway automatic backups enabled)

### ☐ Validation
- [ ] Run smoke test: `pnpm run smoke:check` or manual [BUYER_SMOKE_TEST.md](BUYER_SMOKE_TEST.md)
- [ ] Run E2E tests: `bash scripts/run-e2e-admin.sh` (9 tests should pass)
- [ ] Verify Sentry error tracking: trigger test error and check Sentry dashboard
- [ ] Verify admin login: `https://admin.example.com` with demo credentials
- [ ] Verify API health: `https://api.example.com/healthz` returns 200 OK

---

## 5. Support and Handoff

### 5.1 Transition Timeline

Recommended handoff timeline:

1. **Week 1**: Repository transfer, documentation review, access provisioning
2. **Week 2**: Infrastructure setup (Sanity, Sentry, Railway, Vercel)
3. **Week 3**: Environment variable configuration, database migration, content seeding
4. **Week 4**: Validation (smoke tests, E2E tests, production deployment)

### 5.2 Key Contacts

**Seller Responsibilities (Transition Period)**:
- Technical architecture guidance
- Deployment troubleshooting
- Environment variable clarification
- Emergency hotfixes (if SLA agreed upon)

**Buyer Responsibilities (Post-Handoff)**:
- Service account provisioning (Sanity, Sentry, Stripe, OpenAI, Mapbox)
- Hosting account management (Railway, Vercel)
- DNS and domain configuration
- Ongoing maintenance and feature development

### 5.3 Documentation References

Refer to these documents for detailed guidance:

- **Quick Start**: [README.md](../README.md) → Buyer Quickstart section
- **Deployment**: [DEPLOYMENT.md](../DEPLOYMENT.md)
- **Environment Variables**: [ENV_VARIABLES.md](ENV_VARIABLES.md)
- **Security**: [SECURITY_POSTURE_MEMO.md](SECURITY_POSTURE_MEMO.md)
- **Backup/DR**: [BACKUP_AND_DR_RUNBOOK.md](BACKUP_AND_DR_RUNBOOK.md)
- **Validation**: [BUYER_SMOKE_TEST.md](BUYER_SMOKE_TEST.md)
- **Data Room Index**: [START_HERE_DATA_ROOM_INDEX.md](START_HERE_DATA_ROOM_INDEX.md)

---

## 6. Cost Estimation

Estimated monthly costs for production deployment (as of 2024):

| Service | Free Tier | Paid Tier (Estimated) | Notes |
|---------|-----------|----------------------|-------|
| **Sanity** | 100k reads/month | $99-299/mo | Depends on dataset size and API usage |
| **Sentry** | 5k events/month | $26-80/mo | Depends on error volume and performance monitoring |
| **Railway** | $5 credit/month | $20-100/mo | Depends on compute and database usage |
| **Vercel** | Hobby (free) | $20/mo/member | Pro plan recommended for teams |
| **Stripe** | Free setup | 2.9% + 30¢/txn | Transaction fees only |
| **OpenAI** | Pay-per-token | $10-50/mo | Depends on AI feature usage (gpt-4o-mini) |
| **Mapbox** | 50k loads/month | Free-$100/mo | Depends on heatmap usage |
| **Domain** | N/A | $10-20/year | One-time registration + renewal |

**Total Estimated Monthly Cost (Production)**: $100-500/month depending on usage and optional features.

---

## 7. Excluded Assets

The following are **NOT included** in this acquisition:

- **Existing deployed environments**: Seller's demo/preview/production deployments will be decommissioned after handoff
- **Seller's Sanity projects**: Buyer must create new Sanity project and migrate content
- **Seller's Sentry organization**: Buyer must create new Sentry organization and configure DSNs
- **Seller's third-party API keys**: All Stripe, OpenAI, Mapbox keys remain with seller
- **Seller's domain names**: Buyer must purchase and configure their own domains
- **Seller's hosting accounts**: Railway, Vercel, Netlify accounts remain with seller
- **Historical data**: Production database and Sanity content from seller's deployment (unless data migration is explicitly negotiated)

---

## 8. Additional Notes

- **License**: Ensure all dependencies in `docs/SBOM-nimbus-cms.json` comply with buyer's internal policies (all are permissive open-source licenses)
- **Compliance**: Review [SECURITY_POSTURE_MEMO.md](SECURITY_POSTURE_MEMO.md) for SOC 2, GDPR, HIPAA considerations (if applicable)
- **Monitoring**: Configure uptime monitoring (e.g., UptimeRobot, Pingdom) for production endpoints
- **Backups**: Test backup restore procedures in [BACKUP_AND_DR_RUNBOOK.md](BACKUP_AND_DR_RUNBOOK.md) before going live

---

**Document Version**: 1.0  
**Last Updated**: 2024 (Update with handoff date)  
**Prepared By**: Nimbus CMS Team (Seller)  
**Intended Audience**: Acquiring Team (Buyer)
