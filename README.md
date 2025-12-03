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

## Key features

- Secure admin login with CSRF-protected API calls
- Multi-tenant workspace + dataset selectors
- 2D analytics with motion-enhanced cards and charts (production default)
- AI concierge (preview-safe messaging, API-backed responses when configured)
- Legal + Data/AI usage panels for buyer transparency
- Centralized API client, CSRF handling, and global error boundary in Admin

## Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [DEPLOYMENT.md](./DEPLOYMENT.md)
- [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md)
- [BUYER_HANDBOOK.md](./BUYER_HANDBOOK.md)
