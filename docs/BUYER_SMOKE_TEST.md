# BUYER_SMOKE_TEST.md
**Nimbus CMS — Demo Stack Smoke Test & Acceptance Criteria**

## Purpose

This document provides smoke-test steps to validate **the canonical demo environment**, ensuring the buyer can see the system operating as advertised with live data, functioning CMS, and a fully wired mobile/admin/API stack pointing at a single **demo tenant**.

---

## Demo Environment Overview

|Component|Details|
|---|---|
|**Dataset (Sanity)**|`nimbus_demo`|
|**Database (Postgres)**|Demo tenant: `demo-operator`, Sanity dataset: `nimbus_demo`|
|**API Base URL**|Configured via `DEMO_API_URL` (e.g., `https://demo-api.nimbus.app`)|
|**Admin SPA URL**|Configured via `VITE_NIMBUS_API_URL` pointing at demo API|
|**Demo Admin User**|`demo.admin@nimbus.local` / set via `DEMO_ADMIN_PASSWORD` (default in `.env.example`)|
|**Demo Customer User**|`demo.customer@nimbus.local` / set via `DEMO_CUSTOMER_PASSWORD` (default in `.env.example`)|

---

## Pre-flight Checks

1. **Railway / Production Demo Deployment:**  
   - Confirm the **demo** API deployment is running and env vars are set:
     - `DATABASE_URL` → Demo Postgres DB (Railway or self-hosted)
     - `SANITY_DATASET_DEFAULT=nimbus_demo`
     - `SANITY_PROJECT_ID=...`  
     - `SANITY_API_TOKEN=...` (write token for seeding)
     - `JWT_SECRET=<securely generated>`
     - `CORS_ORIGINS=<admin SPA domain>`
     - `SENTRY_DSN=<server sentry DSN>`
     - `DEMO_TENANT_SLUG=demo-operator`
     - `DEMO_ADMIN_EMAIL=demo.admin@nimbus.local`
     - `DEMO_CUSTOMER_EMAIL=demo.customer@nimbus.local`
     - `DEMO_ADMIN_PASSWORD=...`
     - `DEMO_CUSTOMER_PASSWORD=...`
     - `ALLOW_INSECURE_DEMO_PASSWORDS=false` (use strong passwords)

2. **Seed the Demo Stack:**
   ```bash
   pnpm run demo:seed:all
   ```
   - This will create:
     - A demo Postgres tenant (`demo-operator`), stores (`downtown-detroit`, `eastside`), products, users, orders, loyalty records.
     - A Sanity `nimbus_demo` dataset with:
       - Organization → Brand → 2 Stores
       - Theme config
       - Deals, Articles, FAQs, Legal docs

3. **Verify Sanity Studio:**  
   - Studio project/dataset should be set to `nimbus_demo`.
   - Open Studio and confirm:
     - "Nimbus Demo Organization" exists
     - "Nimbus Demo Brand" exists
     - 2 Stores (Downtown Detroit, Eastside)
     - At least 1 deal (`deal-demo-bogo-flower`)
     - At least 1 article (`article-getting-started-nimbus`)
     - At least 1 FAQ (`faq-age-verification`)
     - Legal docs (tos-demo, privacy-demo)

---

## Smoke Test Steps

### 1. API Health & Readiness

```bash
curl https://demo-api.nimbus.app/healthz
# Expected: 200 OK
curl https://demo-api.nimbus.app/ready
# Expected: 200 OK (DB + Sanity checks pass)
```

### 2. Admin SPA Login & Dashboard

1. Navigate to `https://demo-admin.nimbus.app` (or your configured Admin SPA URL).
2. Log in with:
   - Email: `demo.admin@nimbus.local`
   - Password: (as set in `DEMO_ADMIN_PASSWORD`)
3. **Acceptance Criteria:**
   - Dashboard loads without errors.
   - Workspace selector shows at least one tenant (`demo-operator` or similar).
   - Dataset selector shows `nimbus_demo`.
   - Analytics card displays (may show zero if no real traffic yet).

### 3. CMS Content (Admin SPA)

1. Navigate to **Products** page:
   - See seeded products: "Nimbus OG", "Midnight Mints Gummies", etc.
   - Confirm product cards render without errors.
2. Navigate to **Deals** page:
   - See "BOGO 50% Off — Demo Flower".
   - Confirm deal details render correctly.
3. Navigate to **Articles** page:
   - See "Getting Started with Nimbus Cannabis OS (Demo)".
   - Click to open article detail.
4. Navigate to **FAQs** page:
   - See "How does age verification work?"
5. Navigate to **Legal** page:
   - See "SAMPLE TEMPLATE – REPLACE: Terms of Service" and "Privacy Policy".

### 4. API Content Endpoints (Public)

```bash
# Fetch demo theme
curl -H "Accept: application/json" \
  "https://demo-api.nimbus.app/api/v1/nimbus/content/theme?brand=nimbus-demo"
# Expected: 200, theme config JSON (primaryColor, secondaryColor, etc.)

# Fetch demo deals
curl -H "Accept: application/json" \
  "https://demo-api.nimbus.app/api/v1/nimbus/content/deals?brand=nimbus-demo&store=downtown-detroit"
# Expected: 200, array with at least 1 deal (BOGO 50% Off)

# Fetch demo articles
curl -H "Accept: application/json" \
  "https://demo-api.nimbus.app/api/v1/nimbus/content/articles?brand=nimbus-demo&store=downtown-detroit"
# Expected: 200, array with at least 1 article

# Fetch demo FAQs
curl -H "Accept: application/json" \
  "https://demo-api.nimbus.app/api/v1/nimbus/content/faqs?brand=nimbus-demo&store=downtown-detroit"
# Expected: 200, array with at least 1 FAQ

# Fetch demo legal docs
curl -H "Accept: application/json" \
  "https://demo-api.nimbus.app/api/v1/nimbus/content/legal/terms?brand=nimbus-demo"
# Expected: 200, legal doc JSON (type: "terms")
```

### 5. Mobile App (if deployed)

1. Open the mobile app and configure it to point at the demo API URL.
2. **Accept Criteria:**
   - Age gate displays (if implemented).
   - Login/registration works with `demo.customer@nimbus.local`.
   - Home screen shows seeded deals/articles.
   - Product listing displays seeded products.
   - Adding a product to cart works.
   - Checkout flow can be initiated (payment stub is acceptable for demo).
   - Loyalty status displays correctly (Gold, 420 points).

### 6. Analytics & Sentry

1. **Sentry (Server):**
   - Trigger a test error:
     ```bash
     curl -X GET https://demo-api.nimbus.app/dev/trigger-error
     # Should return 500 with sentryEventId in dev/staging (non-prod)
     ```
   - Verify the error appears in Sentry (check the demo server project).

2. **Sentry (Admin SPA):**
   - In the Admin SPA, open dev tools console and trigger a test error (if implemented).
   - Verify the error appears in Sentry (check the demo admin project).

3. **Analytics (if implemented):**
   - Post a demo analytics event:
     ```bash
     curl -X POST https://demo-api.nimbus.app/api/v1/nimbus/analytics/event \
       -H "Content-Type: application/json" \
       -H "X-Ingest-Key: <demo-ingest-key>" \
       -d '{"event":"page_view","page":"/demo"}'
     # Expected: 200 OK
     ```
   - Verify the event is recorded (check Admin SPA Analytics dashboard or DB).

### 7. Backup & DR (Manual Verification)

1. Run the demo export script:
   ```bash
   pnpm run sanity:export-demo
   # Check backups/sanity/ for a timestamped tarball
   ```
2. Verify that a restore command can be run against a non-prod dataset (do not restore to `nimbus_demo` itself):
   ```bash
   pnpm run sanity:import-demo-restore -- --dataset nimbus_demo_restore
   # Verify import succeeds
   ```

---

## Acceptance Criteria Summary

- [ ] API `/healthz` and `/ready` return 200.
- [ ] Admin SPA login works with demo admin credentials.
- [ ] Dashboard displays workspace/dataset selectors.
- [ ] Products, Deals, Articles, FAQs, Legal pages render seeded content.
- [ ] Public content API endpoints return demo data.
- [ ] Mobile app (if deployed) shows seeded content and allows login with demo customer credentials.
- [ ] Loyalty status displays correctly (Gold, 420 points).
- [ ] Sentry captures errors from API and Admin SPA.
- [ ] Analytics events can be posted and recorded.
- [ ] Backup/export scripts run successfully.

---

## Safe Demo Credentials (Local Only)

> ⚠️ **NEVER commit real passwords or API tokens.** The following are for **local development only**. In production/demo deployments, set strong passwords via environment variables and store them securely (e.g., Railway secrets, 1Password, or similar).

| User | Email | Default Password (local only) | Role |
|------|-------|-------------------------------|------|
| Demo Admin | `demo.admin@nimbus.local` | `demo-admin-change-me` | OWNER |
| Demo Customer | `demo.customer@nimbus.local` | `demo-customer-change-me` | CUSTOMER |
| Demo Staff | `demo.staff@nimbus.local` | (no password set) | STAFF |

**For production/demo:**
- Set `DEMO_ADMIN_PASSWORD` and `DEMO_CUSTOMER_PASSWORD` via secure env vars.
- Ensure `ALLOW_INSECURE_DEMO_PASSWORDS=false` (default).

---

## Troubleshooting

| Issue | Likely Cause | Fix |
|-------|--------------|-----|
| API returns 503 on `/ready` | DB or Sanity unreachable | Check `DATABASE_URL`, `SANITY_PROJECT_ID`, `SANITY_API_TOKEN` |
| Admin SPA shows "Network Error" | CORS misconfigured or API down | Verify `CORS_ORIGINS` includes admin SPA domain; check API logs |
| No content in Admin SPA | Wrong dataset or not seeded | Confirm dataset selector shows `nimbus_demo`; re-run `pnpm run demo:seed:all` |
| Sentry not logging errors | DSN missing or wrong | Verify `SENTRY_DSN` (server), `VITE_SENTRY_DSN` (admin SPA) |
| Mobile app shows no content | API URL wrong or auth token invalid | Confirm mobile env points at demo API; check API logs for auth failures |

---

## Next Steps

- **Screenshots:** Capture screenshots of each acceptance criterion passing and attach to a buyer demo deck.
- **Video Walkthrough:** Record a 5-10 minute screen recording demonstrating the demo stack end-to-end.
- **Uptime Monitoring:** Set up UptimeRobot or BetterStack pings for `/healthz` and `/ready` on the demo API.
- **Scheduled Backups:** Confirm the GitHub Actions daily backup workflow is enabled and runs successfully.

---

**Document Version:** 1.0  
**Last Updated:** 2026-01-06  
**Owner:** SDawson777  
**Repo:** nimbus-cms
