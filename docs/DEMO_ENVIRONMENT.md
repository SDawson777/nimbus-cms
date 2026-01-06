# Demo Environment Configuration

## Overview

This document describes how to configure and deploy **the canonical Nimbus demo environment**, ensuring all components (API, Admin SPA, Mobile, Sanity) point to a single **demo tenant** with seeded content.

---

## Architecture (Demo Stack)

```
┌────────────────────────────────────────────────────────────────┐
│  Demo Admin SPA                                                │
│  (Vite + React)                                                │
│  → VITE_NIMBUS_API_URL=https://demo-api.nimbus.app            │
└────────────────────┬───────────────────────────────────────────┘
                     │
                     ▼
┌────────────────────────────────────────────────────────────────┐
│  Demo CMS API                                                  │
│  (Express + TypeScript)                                        │
│  → DATABASE_URL=<Railway Postgres>                             │
│  → SANITY_DATASET_DEFAULT=nimbus_demo                          │
│  → SANITY_PROJECT_ID=ygbu28p2                                  │
│  → SANITY_API_TOKEN=<write token>                             │
│  → JWT_SECRET=<secure>                                         │
│  → CORS_ORIGINS=<admin SPA domain>                             │
│  → SENTRY_DSN=<server DSN>                                     │
│  → DEMO_TENANT_SLUG=demo-operator                              │
└────────────────────┬──────────────────┬────────────────────────┘
                     │                  │
                     ▼                  ▼
      ┌──────────────────────┐   ┌──────────────────────┐
      │ Postgres (Railway)   │   │ Sanity (nimbus_demo) │
      │ Tenant: demo-operator│   │ Brand: nimbus-demo   │
      │ Stores: downtown,    │   │ Stores: 2            │
      │         eastside     │   │ Deals, Articles,     │
      │ Products, Orders,    │   │ FAQs, Legal docs     │
      │ Users, Loyalty       │   │ Theme config         │
      └──────────────────────┘   └──────────────────────┘
```

---

## 1. Railway (or equivalent) Demo API Deployment

### Environment Variables (Railway Secrets)

| Variable | Value | Purpose |
|----------|-------|---------|
| `DATABASE_URL` | `postgresql://user:pass@host:5432/nimbus_demo` | Demo Postgres DB |
| `SANITY_PROJECT_ID` | `ygbu28p2` (or your project ID) | Sanity project |
| `SANITY_DATASET_DEFAULT` | `nimbus_demo` | Demo dataset |
| `SANITY_API_TOKEN` | `sk...` (write token) | Sanity write access for seeding |
| `SANITY_API_VERSION` | `2025-01-01` | Sanity API version |
| `JWT_SECRET` | `<32+ char random>` | **MUST be strong and secret** |
| `CORS_ORIGINS` | `https://demo-admin.nimbus.app` | Admin SPA domain (comma-separated for multiple) |
| `SENTRY_DSN` | `https://...@o...ingest.sentry.io/...` | Server-side Sentry DSN |
| `SENTRY_ENVIRONMENT` | `demo` | Sentry environment |
| `SENTRY_RELEASE` | `1.0.0` | Sentry release |
| `SENTRY_TRACES_SAMPLE_RATE` | `0.1` | Traces sampling (10%) |
| `SENTRY_PROFILES_SAMPLE_RATE` | `0.01` | Profiling sampling (1%) |
| `DEMO_TENANT_SLUG` | `demo-operator` | Demo tenant slug |
| `DEMO_ADMIN_EMAIL` | `demo.admin@nimbus.local` | Demo admin email |
| `DEMO_CUSTOMER_EMAIL` | `demo.customer@nimbus.local` | Demo customer email |
| `DEMO_ADMIN_PASSWORD` | `<strong password>` | Demo admin password |
| `DEMO_CUSTOMER_PASSWORD` | `<strong password>` | Demo customer password |
| `ALLOW_INSECURE_DEMO_PASSWORDS` | `false` | Must be `false` in prod/demo |

### Build Command

```bash
pnpm install --frozen-lockfile && pnpm build
```

### Start Command

```bash
node server/dist/index.js
```

### Health Checks

- **Health:** `https://demo-api.nimbus.app/healthz`
- **Readiness:** `https://demo-api.nimbus.app/ready`

---

## 2. Admin SPA (Netlify / Vercel / Railway)

### Environment Variables

| Variable | Value | Purpose |
|----------|-------|---------|
| `VITE_NIMBUS_API_URL` | `https://demo-api.nimbus.app` | Demo API base URL |
| `VITE_APP_ENV` | `demo` | App environment |
| `VITE_APP_VERSION` | `1.0.0` | App version |
| `VITE_SENTRY_DSN` | `https://...@o...ingest.sentry.io/...` | Admin SPA Sentry DSN |
| `VITE_NIMBUS_THEME` | `default` | Theme name |
| `VITE_MAPBOX_TOKEN` | `pk....` (optional) | Mapbox public token |

### Build Command

```bash
cd apps/admin && pnpm install && pnpm build
```

### Publish Directory

```
apps/admin/dist
```

---

## 3. Sanity Studio (Sanity Hosting or Self-Hosted)

### Studio Configuration (`apps/studio/sanity.config.ts`)

Ensure the studio defaults to the demo dataset:

```ts
export default defineConfig({
  projectId: process.env.SANITY_PROJECT_ID || 'ygbu28p2',
  dataset: process.env.SANITY_STUDIO_DATASET || 'nimbus_demo',
  // ...
});
```

### Deploy to Sanity Hosting

```bash
cd apps/studio
pnpm exec sanity deploy
```

This will make Studio available at `https://<your-project>.sanity.studio` with the `nimbus_demo` dataset selected by default.

---

## 4. Seed the Demo Stack

### Prerequisites

- Railway demo API is deployed and `DATABASE_URL` points at demo Postgres.
- Sanity project/dataset `nimbus_demo` exists (create via Sanity dashboard if needed).
- All env vars (above) are set.

### Seed Commands

1. **Seed Postgres (demo tenant + stores + products + users + orders):**

   ```bash
   pnpm run demo:seed:db
   ```

   This will create:
   - Tenant: `demo-operator`
   - Stores: `downtown-detroit`, `eastside`
   - Products: 5 demo products with variants
   - Users: `demo.admin@nimbus.local` (OWNER), `demo.customer@nimbus.local` (CUSTOMER), `demo.staff@nimbus.local` (STAFF)
   - Orders: 1 sample order
   - Loyalty: Gold status (420 points) for customer

2. **Seed Sanity (`nimbus_demo` dataset):**

   ```bash
   pnpm run demo:seed:sanity
   ```

   This will create:
   - Organization: `org-nimbus-demo`
   - Brand: `brand-nimbus-demo`
   - Stores: `store-nimbus-demo-downtown`, `store-nimbus-demo-eastside`
   - Theme: brand-level theme config
   - Deals: 1 demo deal (`deal-demo-bogo-flower`)
   - Articles: 1 demo article (`article-getting-started-nimbus`)
   - FAQs: 1 demo FAQ (`faq-age-verification`)
   - Legal: 2 demo legal docs (`tos-demo`, `privacy-demo`)

3. **Seed Both (One Command):**

   ```bash
   pnpm run demo:seed:all
   ```

---

## 5. Verify the Demo Stack

Follow the steps in `docs/BUYER_SMOKE_TEST.md` to verify:
- API health/ready endpoints return 200.
- Admin SPA login works with demo admin credentials.
- Products, Deals, Articles, FAQs, Legal pages render seeded content.
- Public content API endpoints return demo data.
- Mobile app (if deployed) shows seeded content.

---

## 6. Wiring Summary

| Component | Points At | Dataset/DB |
|-----------|-----------|------------|
| **Admin SPA** | Demo API (`VITE_NIMBUS_API_URL`) | `nimbus_demo` (via API) |
| **CMS API** | Demo Postgres + Sanity `nimbus_demo` | `nimbus_demo` (`SANITY_DATASET_DEFAULT`) |
| **Mobile App** | Demo API (`EXPO_PUBLIC_CMS_API_URL` or similar) | `nimbus_demo` (via API) |
| **Sanity Studio** | `nimbus_demo` dataset | `nimbus_demo` |

**All components share the same:**
- **Tenant:** `demo-operator`
- **Brand:** `nimbus-demo`
- **Stores:** `downtown-detroit`, `eastside`
- **Theme:** brand-level theme config with Nimbus demo colors
- **Content:** Deals, Articles, FAQs, Legal docs scoped to the demo brand

---

## 7. Continuous Seeding & Resets

To reset/re-seed the demo stack:

1. **Drop and recreate the demo tenant (Postgres):**
   ```sql
   -- Connect to demo DB
   DELETE FROM "Tenant" WHERE slug = 'demo-operator';
   ```

2. **Delete all demo content (Sanity):**
   ```bash
   # Use Sanity CLI or API to delete all documents in nimbus_demo
   pnpm exec sanity dataset delete nimbus_demo
   pnpm exec sanity dataset create nimbus_demo
   ```

3. **Re-seed:**
   ```bash
   pnpm run demo:seed:all
   ```

---

## 8. Monitoring & Backup

- **Uptime Monitoring:** Set up UptimeRobot/BetterStack pings for `/healthz` and `/ready` on the demo API.
- **Daily Backups:** Ensure GitHub Actions `.github/workflows/daily-backups.yml` is enabled and runs successfully.
- **Sentry Alerts:** Configure alerts in Sentry for demo server and admin projects.

---

## 9. Security Notes

- **Never commit `.env` files** with real secrets.
- **Rotate secrets** if this repo was imported from a public template.
- **Use strong passwords** for `DEMO_ADMIN_PASSWORD` and `DEMO_CUSTOMER_PASSWORD` in production/demo deployments.
- **Set `ALLOW_INSECURE_DEMO_PASSWORDS=false`** (default) to enforce strong passwords.

---

## 10. Troubleshooting

| Issue | Likely Cause | Fix |
|-------|--------------|-----|
| API returns 503 on `/ready` | DB or Sanity unreachable | Check `DATABASE_URL`, `SANITY_PROJECT_ID`, `SANITY_API_TOKEN` |
| Admin SPA shows "Network Error" | CORS misconfigured or API down | Verify `CORS_ORIGINS` includes admin SPA domain; check API logs |
| No content in Admin SPA | Wrong dataset or not seeded | Confirm dataset selector shows `nimbus_demo`; re-run `pnpm run demo:seed:all` |
| Seed fails with "Missing DEMO_ADMIN_PASSWORD" | Env var not set | Set `DEMO_ADMIN_PASSWORD` and `DEMO_CUSTOMER_PASSWORD` (or `ALLOW_INSECURE_DEMO_PASSWORDS=true` for local only) |

---

**Document Version:** 1.0  
**Last Updated:** 2026-01-06  
**Owner:** SDawson777  
**Repo:** nimbus-cms
