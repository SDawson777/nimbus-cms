# Rebranding checklist

Use this checklist when rebranding **Nimbus Cannabis OS CMS** for a new customer or white-label deployment.

---

## Pre-deployment checklist

### 1. Replace logos

- [ ] Upload customer logo to Sanity (PNG/SVG/WebP, ≤ 2 MB)
- [ ] Update `themeConfig` document in Sanity to reference the new logo asset
- [ ] Set `logo.alt` field with customer brand name for accessibility
- [ ] Replace `/server/static/nimbus-logo.svg` with customer logo
- [ ] Replace `/server/static/nimbus-logo-dark.svg` with customer dark-mode logo
- [ ] Replace `/server/static/nimbus-icon.svg` with customer favicon (48×48)
- [ ] Replace `/apps/admin/public/nimbus-icon.svg` with customer favicon

### 2. Set theme tokens

- [ ] Update `themeConfig` colors in Sanity:
  - `primaryColor`
  - `secondaryColor`
  - `accentColor`
  - `backgroundLight`
  - `backgroundDark`
  - `textPrimary`
  - `textSecondary`
  - `error`, `warning`, `success`
- [ ] (Optional) Update `fontFamily` in `themeConfig`
- [ ] Publish `themeConfig` document
- [ ] Test `/content/theme` endpoint returns correct colors

### 3. Configure store hours + store metadata

- [ ] Create `organization` document in Sanity with customer org slug
- [ ] Create `brand` document(s) for each customer brand
- [ ] Create `store` document(s) for each physical location
- [ ] Fill in store metadata:
  - Store name, slug, address
  - Store hours (open/close times, timezone)
  - Contact info (phone, email)
- [ ] Verify store documents are scoped to correct brand

### 4. Configure legal text (FAQ + Privacy + TOS)

- [ ] Create or update `legalDoc` documents:
  - `type: 'terms'` – Terms of Service
  - `type: 'privacy'` – Privacy Policy
  - `type: 'accessibility'` – Accessibility Statement
  - `type: 'ageGate'` – Age verification text
  - `type: 'disclaimer'` – Legal disclaimer
- [ ] Set `stateCode` for state-specific variants (if required)
- [ ] Set `effectiveFrom` and `effectiveTo` dates
- [ ] Increment `version` for each update
- [ ] Publish all legal documents

### 5. Replace favicon

- [ ] Update favicon in `/server/static/nimbus-icon.svg`
- [ ] Update favicon in `/apps/admin/public/nimbus-icon.svg`
- [ ] (Optional) Add `favicon.ico` to `/server/static/` for legacy browser support
- [ ] Test favicon loads in browser

### 6. Update Admin SPA color tokens

- [ ] Update `/apps/admin/index.html` title to customer brand name
- [ ] Update logo references in:
  - `/server/static/admin/login.html`
  - `/server/static/admin/dashboard.html`
  - `/server/static/admin/settings.html`
- [ ] Replace logo paths: `src="/nimbus-logo.svg"` → `src="/customer-logo.svg"`
- [ ] (Optional) Update CSS theme tokens if hardcoded in Admin SPA source

---

## Deployment checklist

### 7. Update environment variables

- [ ] Set `SANITY_PROJECT_ID` to customer Sanity project
- [ ] Set `SANITY_DATASET` to customer dataset (e.g., `main` or `brand-customer`)
- [ ] Set `SANITY_API_TOKEN` (write token for server-side mutations)
- [ ] Set `SANITY_PREVIEW_TOKEN` (read token for preview mode)
- [ ] Set `JWT_SECRET` (32+ random characters, keep secret)
- [ ] Set `PREVIEW_SECRET` (random string for draft preview)
- [ ] Set `ANALYTICS_INGEST_KEY` (comma-separated HMAC keys)
- [ ] Set `CORS_ORIGINS` (comma-separated allowed origins for Admin SPA)
- [ ] (Optional) Set `ENABLE_COMPLIANCE_SCHEDULER=true` on leader instance

### 8. Deploy Sanity Studio

- [ ] Build Studio: `npm run studio:build` in `apps/studio/`
- [ ] Deploy to Vercel/Netlify or self-host
- [ ] Configure Studio environment variables:
  - `SANITY_PROJECT_ID`
  - `SANITY_DATASET`
- [ ] Test Studio login and content editing
- [ ] Verify Studio title shows customer brand name

### 9. Deploy API server

- [ ] Build API: `npm run build:api`
- [ ] Build Docker image: `docker build -f server/Dockerfile -t customer-cms:latest .`
- [ ] Deploy to production (Docker, K8s, ECS, etc.)
- [ ] Set all environment variables in production
- [ ] Test API endpoints:
  - `/status` – health check
  - `/content/theme` – returns customer colors/logo
  - `/content/articles` – returns articles
  - `/content/faq` – returns FAQs
  - `/content/legal?type=terms` – returns legal docs

### 10. Deploy Admin SPA

- [ ] Build Admin SPA: `npm run build:admin` in `apps/admin/`
- [ ] Deploy built assets to CDN or static host
- [ ] Test Admin login at `/admin/login`
- [ ] Verify Admin dashboard loads with customer branding
- [ ] Test theme upload/edit functionality

---

## Post-deployment verification

### 11. Smoke tests

- [ ] Visit Studio URL → verify customer brand name in title
- [ ] Visit `/admin/login` → verify customer logo displays
- [ ] Visit `/admin/dashboard` → verify customer branding
- [ ] Visit `/content/theme?brand=customer` → verify colors/logo returned
- [ ] Visit mobile app → verify theme loaded correctly
- [ ] Test preview mode: `?preview=true&secret=PREVIEW_SECRET`
- [ ] Test RBAC: login as different roles (OWNER, ADMIN, EDITOR, VIEWER)

### 12. Compliance check

- [ ] Run `/api/admin/compliance/overview` → verify no missing legal docs
- [ ] Check compliance snapshots are being persisted (if scheduler enabled)
- [ ] Verify state-specific legal variants display correctly

### 13. Analytics verification

- [ ] Test analytics event ingestion: `POST /analytics/event`
- [ ] Verify HMAC signature validation works
- [ ] Check analytics overview in Admin dashboard
- [ ] Verify analytics rate limiting is enforced

---

## Rollback plan

If issues arise post-deployment:

- [ ] Revert to previous Docker image tag
- [ ] Restore previous Sanity dataset from backup (see [BACKUP_DR.md](./BACKUP_DR.md))
- [ ] Check logs for errors: `/status` endpoint, Docker logs, or CloudWatch/Datadog
- [ ] Verify environment variables are set correctly
- [ ] Contact support or review [observability.md](./observability.md) runbook

---

## Customer handoff checklist

Before handing off to customer:

- [ ] Provide customer with Studio URL and login credentials
- [ ] Provide customer with Admin SPA URL and login credentials
- [ ] Share environment variable list (without secrets)
- [ ] Document any customer-specific customizations
- [ ] Provide [WHITE_LABEL_SETUP.md](./WHITE_LABEL_SETUP.md) guide
- [ ] Schedule training session for content editors
- [ ] Set up monitoring alerts (Datadog/CloudWatch/PagerDuty)

---

**Questions?** Refer to:

- [WHITE_LABEL_SETUP.md](./WHITE_LABEL_SETUP.md) – white-label customization guide
- [TENANCY_OVERVIEW.md](./TENANCY_OVERVIEW.md) – multi-tenant architecture
- [DEPLOYMENT.md](./DEPLOYMENT.md) – deployment instructions
- [RBAC_MATRIX.md](./RBAC_MATRIX.md) – role-based access control
- [observability.md](./observability.md) – monitoring and on-call runbook
