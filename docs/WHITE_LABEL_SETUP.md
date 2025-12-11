# White-label setup guide

This guide explains how to customize **Nimbus Cannabis OS CMS** for your own brand, including colors, logos, fonts, tenant datasets, and deployment.

---

## Overview

Nimbus Cannabis OS CMS is a fully white-label platform. You can rebrand:

- Visual identity (colors, logos, fonts)
- Tenant datasets (multi-tenant structure)
- Sanity Studio deployment (hosted editor)
- Admin SPA branding (internal admin UI)
- Mobile app connection (content API endpoints)

---

## 1. Change colors, logos, and fonts

### Theme colors

Theme configuration is stored in Sanity `themeConfig` documents. Each tenant (brand or store) can have its own theme.

**Default Nimbus color palette:**

```json
{
  "primary": "#1B5E3A",
  "secondary": "#A4D96C",
  "backgroundLight": "#F8F8F8",
  "backgroundDark": "#121212",
  "accent": "#4BAF75",
  "textPrimary": "#FFFFFF",
  "textSecondary": "#E0E0E0",
  "error": "#D32F2F",
  "warning": "#FFA726",
  "success": "#66BB6A"
}
```

To customize:

1. Open Sanity Studio and navigate to the `themeConfig` document for your brand/store.
2. Update color hex codes for `primaryColor`, `secondaryColor`, `accentColor`, etc.
3. Publish the document.
4. The API endpoint `/content/theme` will return the updated colors.

### Logos

Logos are stored as Sanity assets and referenced in `themeConfig` documents.

**To replace logos:**

1. Upload your logo files to Sanity (PNG, SVG, or WebP recommended).
2. In the `themeConfig` document, set the `logo` field to reference your uploaded asset.
3. Set `logo.alt` to a descriptive accessibility label (e.g., "Acme Cannabis logo").
4. For the Admin SPA and static HTML, replace:
   - `/server/static/nimbus-logo.svg` → your logo
   - `/server/static/nimbus-logo-dark.svg` → your dark-mode logo
   - `/server/static/nimbus-icon.svg` → your favicon/icon

**Logo requirements:**

- File size: ≤ 2 MB (configurable via `MAX_LOGO_BYTES`)
- Formats: PNG, JPG, SVG, WebP
- Recommended dimensions: 180×48 for header logos, 48×48 for icons

### Fonts

Fonts can be configured in your Admin SPA (`apps/admin/src/`) or by updating the `themeConfig` `fontFamily` field in Sanity.

**To add custom fonts:**

1. Add your font files to `/apps/admin/public/fonts/` or use a CDN (e.g., Google Fonts).
2. Import the font in your CSS or in `apps/admin/index.html`.
3. Update the `fontFamily` field in `themeConfig` to reference the new font stack.

---

## 2. Configure tenant datasets

Nimbus supports multi-tenant scoping via **organization → brand → store** hierarchy.

### Dataset naming

By default, the Studio uses the `main` dataset. For multi-tenant setups:

- **Single-tenant (one brand):** Use the `main` dataset.
- **Multi-tenant (multiple brands):** Use separate datasets per brand (e.g., `brand-acme`, `brand-greenleaf`).

**Update dataset in Studio config:**

Edit `/apps/studio/sanity.config.ts`:

```typescript
const dataset = process.env.SANITY_DATASET || "production";
```

Update `.env`:

```bash
SANITY_DATASET=your-dataset-name
```

### Tenant config template

Use `/config/tenant.example.json` as a template:

```json
{
  "orgSlug": "your-org",
  "brands": [
    {
      "slug": "your-brand",
      "displayName": "Your Brand Name",
      "stores": [
        {
          "slug": "store-01",
          "displayName": "Store 01",
          "address": "123 Main St, City, State",
          "hours": "Mon-Fri 9AM-9PM"
        }
      ]
    }
  ]
}
```

Create tenant documents in Sanity Studio under the `organization`, `brand`, and `store` schemas.

---

## 3. Deploy Sanity Studio

Sanity Studio is the editor UI for content authors. Deploy to Vercel, Netlify, or self-host.

### Deploy to Vercel (recommended)

1. Install Vercel CLI:

```bash
npm i -g vercel
```

2. Build and deploy Studio:

```bash
cd apps/studio
npm run build
vercel --prod
```

3. Configure environment variables in Vercel:
   - `SANITY_PROJECT_ID`
   - `SANITY_DATASET`
   - `SANITY_API_TOKEN` (read-only token for preview)

### Self-host with Docker

You can serve the built Studio as static files:

```bash
cd apps/studio
npm run build
# Serve the `dist/` folder with nginx, caddy, or any static host
```

---

## 4. Configure Admin SPA branding

The Admin SPA (`apps/admin/`) is the internal admin UI for managing themes, assets, and compliance.

**Update branding:**

1. Update `/apps/admin/index.html`:
   - Change `<title>` to your brand name.
   - Update any references to "Nimbus" in headers/footers.

2. Update logo references in static HTML:
   - `/server/static/admin/login.html`
   - `/server/static/admin/dashboard.html`
   - `/server/static/admin/settings.html`

3. Replace the logo asset:
   - Update `src="/nimbus-logo.svg"` to point to your logo file.

4. (Optional) Update theme tokens in `/apps/admin/src/` if you have a dedicated theme file.

---

## 5. Connect to mobile app

The mobile app consumes the CMS API at `/content/*` endpoints.

**Mobile app configuration:**

1. Set the base URL in your mobile app environment config:

```javascript
const CMS_API_URL = "https://your-cms-domain.com";
```

2. Mobile endpoints:
   - `/content/articles` – articles
   - `/content/faq` – FAQs
   - `/content/legal?type=terms` – legal docs (terms, privacy, etc.)
   - `/content/filters` – product filters
   - `/content/theme?brand=your-brand&store=your-store` – theme config

3. (Optional) Enable preview mode:
   - Add `?preview=true&secret=YOUR_PREVIEW_SECRET` to content requests.
   - Or set headers: `X-Preview: true`, `X-Preview-Secret: YOUR_PREVIEW_SECRET`.

---

## 6. Advanced: Multi-brand hosting

For true multi-tenant hosting (multiple brands on one CMS instance):

1. Use separate Sanity datasets per brand (e.g., `brand-acme`, `brand-greenleaf`).
2. Create brand-specific `organization`, `brand`, and `store` documents in each dataset.
3. Set up API routing to resolve dataset from the request:
   - Use subdomain routing: `acme.cms.example.com` → `brand-acme` dataset.
   - Or query params: `/content/theme?brand=acme` → `brand-acme` dataset.

4. Update the Studio config to allow dataset switching:

```typescript
// apps/studio/sanity.config.ts
const dataset = process.env.SANITY_DATASET || "production";
```

5. Deploy multiple Studio instances (one per brand) or use a shared Studio with dataset switching.

---

## Checklist

Use this checklist to ensure your white-label setup is complete:

- [ ] Updated `themeConfig` colors in Sanity
- [ ] Uploaded brand logos to Sanity and static folders
- [ ] Updated font family in theme config or CSS
- [ ] Configured tenant datasets (org → brand → store)
- [ ] Deployed Sanity Studio (Vercel or self-hosted)
- [ ] Updated Admin SPA branding (titles, logos)
- [ ] Connected mobile app to CMS API
- [ ] Tested `/content/theme` endpoint returns correct branding
- [ ] Verified no broken logo/asset paths

---

## Next steps

- See [REBRANDING_CHECKLIST.md](./REBRANDING_CHECKLIST.md) for a step-by-step deployment checklist.
- See [TENANCY_OVERVIEW.md](./TENANCY_OVERVIEW.md) for multi-tenant architecture details.
- See [DEPLOYMENT.md](./DEPLOYMENT.md) for Docker and production deployment.

---

**Questions?** Refer to [ARCHITECTURE.md](./ARCHITECTURE.md) for system design or [RBAC_MATRIX.md](./RBAC_MATRIX.md) for access control.
