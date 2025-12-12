# Environment Variables Configuration

## Railway (API Server)

**Service:** Nimbus CMS API  
**Directory:** `server/`  
**Build Command:** `pnpm --filter server build`  
**Start Command:** `pnpm --filter server start`

### Required Variables:

```
NODE_ENV=production
PORT=3000

# Sanity
SANITY_PROJECT_ID=ygbu28p2
SANITY_DATASET=production
SANITY_TOKEN=<your-sanity-read-token>

# Database
DATABASE_URL=<your-postgres-connection-string>

# Authentication
JWT_SECRET=<your-jwt-secret>

# CORS
CORS_ORIGINS=https://nimbus-cms-admin.vercel.app,https://nimbus-cms.vercel.app
```

---

## Vercel - Admin UI

**Service:** Nimbus Admin SPA  
**Directory:** `apps/admin/`  
**Build Command:** `pnpm --filter admin build`  
**Output Directory:** `apps/admin/dist`

### Required Variables:

```
VITE_NIMBUS_API_URL=https://nimbus-cms-production.up.railway.app/api/v1/nimbus
VITE_APP_ENV=production
```

---

## Vercel - Sanity Studio

**Service:** Nimbus CMS Studio  
**Directory:** `apps/studio/`  
**Build Command:** `pnpm --filter studio build`  
**Output Directory:** `apps/studio/dist`

### Required Variables:

```
SANITY_STUDIO_PROJECT_ID=ygbu28p2
SANITY_STUDIO_DATASET=production
```

---

## Local Development

Create `.env` files in each workspace for local development:

### `server/.env`

```
NODE_ENV=development
PORT=3001
SANITY_PROJECT_ID=ygbu28p2
SANITY_DATASET=development
SANITY_TOKEN=<your-dev-token>
DATABASE_URL=<your-local-db>
JWT_SECRET=dev-secret-change-me
CORS_ORIGINS=http://localhost:5173,http://localhost:3333
```

### `apps/admin/.env`

```
VITE_NIMBUS_API_URL=http://localhost:3001/api/v1/nimbus
VITE_APP_ENV=development
```

### `apps/studio/.env` (optional)

```
SANITY_STUDIO_PROJECT_ID=ygbu28p2
SANITY_STUDIO_DATASET=development
```

---

## Notes

- **Never commit `.env` files** - they are gitignored
- **Production values** are set in Railway/Vercel dashboards
- **Local `.env` files** are for development only
- **CORS_ORIGINS** must match deployed Admin/Studio URLs

---

## Deployment mapping (examples)

Use these mappings when provisioning environment variables for each deployment stage.

- DEMO:
  - API: `https://nimbus-api-demo.up.railway.app`
  - Sanity dataset: `nimbus_demo`
  - Admin: `https://nimbus-admin-demo.vercel.app`

- PREVIEW:
  - API: `https://nimbus-api-preview.up.railway.app`
  - Sanity dataset: `nimbus_preview`
  - Admin: `https://nimbus-admin-preview.vercel.app`

- PRODUCTION:
  - API: `https://nimbus-api-prod.up.railway.app`
  - Sanity dataset: (set a production dataset name; replace the placeholder)
  - Admin: `https://nimbus-admin-prod.vercel.app`

Set the `SANITY_STUDIO_DATASET` and `VITE_NIMBUS_API_URL` (or equivalent) per-environment to match the above mapping.
