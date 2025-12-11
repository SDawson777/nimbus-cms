# Buyer Handbook

This guide is written for a technical due-diligence team to run Nimbus CMS in under a day.

## What ships

- **Admin SPA (`apps/admin`)**: enterprise control plane with analytics, theming, personalization, compliance, AI concierge, and accessibility controls.
- **Sanity Studio (`apps/studio`)**: authoring environment for content, legal, personalization, and datasets.
- **API (`server`)**: Express service securing admin routes, exposing content/analytics, and guarding AI chat.

## Environments

- **Development**: run all three modules locally with pnpm.
- **Staging/Preview**: Vercel (Admin + Studio), Railway (API). Netlify preview uses root `studio:build` output if needed.
- **Production**: same topology; set strong secrets and CORS allowlists.

## Setup (under 1 hour)

1. **Install**: `pnpm install` (Node 20+).
2. **API env**: set `JWT_SECRET`, `CORS_ORIGINS`, `SANITY_PROJECT_ID`, `SANITY_DATASET`, `SANITY_API_TOKEN`, `ANALYTICS_INGEST_KEY`.
3. **Admin env**: set `VITE_NIMBUS_API_URL` to the API base; optional `VITE_NIMBUS_HEATMAP_MAPBOX_TOKEN`, `VITE_WEATHER_API_URL`, `VITE_WEATHER_API_KEY` for banner/heatmap polish.
4. **Studio env**: set `SANITY_STUDIO_PROJECT_ID` and `SANITY_STUDIO_DATASET`.
5. **Run locally**:
   - `pnpm server:dev`
   - `pnpm admin:dev`
   - `pnpm studio:dev`
6. **Deploy**: follow [DEPLOYMENT.md](./DEPLOYMENT.md) for Vercel/Railway settings.

## Operating the suite

- **Datasets & workspaces**: selectors live in the Admin header; dataset context is persisted so teams can switch across staging/prod datasets without code changes.
- **Login**: Admin login issues a JWT + CSRF cookie. Demo credentials remain (`demo@nimbus.app` / `Nimbus!Demo123`) for air-gapped previews; replace with your IdP or rotate secrets in production.
- **Analytics**: 2D charts with motion by default. HMAC-signed events use `ANALYTICS_INGEST_KEY`.
- **AI concierge**: Works against `/api/v1/nimbus/ai/chat`; if no API URL is configured, the UI provides preview-safe guidance instead of errors.
- **Legal & Data/AI usage**: Admin > Legal lists documents and includes a Data & AI usage explainer. Update legal docs in Studio and publish.

## Extending safely

- **Schemas**: Add Sanity schemas in `schemaTypes/` (mirrored under `apps/studio`). Keep IDs stable to avoid breaking existing documents.
- **API**: Add routes under `server/src/routes` and wrap with validation + auth. Use `zod` for input validation and `logger` for errors.
- **Admin**: Use the shared API client in `apps/admin/src/lib/api.js` to ensure CSRF + base URL headers. Wrap new routes in `ProtectedRoute`.
- **Visuals**: Keep analytics 2D for speed; heatmap requires `VITE_NIMBUS_HEATMAP_MAPBOX_TOKEN`.

## Compliance posture (non-legal)

- CSRF protection on admin writes; JWT secret length enforced in production.
- Rate limits on login and analytics ingest; CORS allowlist required in production.
- Accessibility controls (contrast, dyslexia font, large text) remain available via the compact top-right menu.

## Known limitations

- AI responses are static until an AI provider key is configured and wired.
- Redis/DB integrations are optional; persistence beyond Sanity is minimal by default.
