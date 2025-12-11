# Final Audit – Nimbus CMS Suite (Release Freeze)

## System map

- **Admin SPA** (React 18 + Vite 7) mounted from `apps/admin/src/main.jsx`; guarded routes, banner, Suite Map navigation, accessibility and AI launchers are wired through a shared shell. 【F:apps/admin/src/main.jsx†L1-L110】
- **Sanity Studio** entry at `apps/studio/sanity.config.ts`, using Sanity v4 with desk/vision tools and env-provided project/dataset IDs. 【F:apps/studio/sanity.config.ts†L1-L24】
- **API server** entry at `server/src/index.ts`, Express 5 + TypeScript with helmet, rate limiting, CSRF/cookie support, Swagger docs, and namespaced admin/content/AI routes. 【F:server/src/index.ts†L1-L204】

## Build & CI readiness

- Admin scripts cover `dev`, `build`, `preview`, `lint`, and a test stub; dependencies are React 18, Chart.js, Recharts, and framer-motion for animated 2D analytics. 【F:apps/admin/package.json†L6-L23】
- Studio scripts include `dev`, `build`, `deploy`, lint stub, and test stub on Sanity v4. 【F:apps/studio/package.json†L6-L25】
- Server scripts include `build`, `start`, `dev`, lint, and test stub with TypeScript toolchain. 【F:server/package.json†L6-L45】
- CI workflow builds admin, studio, and server with pnpm and Node 20 (see `.github/workflows/ci.yml`). 【F:.github/workflows/ci.yml†L1-L42】

## Security & legal guardrails

- Server enforces env-validated JWT secrets, helmet, JSON size limits, compression, rate limiting, request logging, CSRF for admin APIs, and CORS allowlisting with preview fallbacks for Vercel domains. 【F:server/src/index.ts†L28-L147】【F:server/src/index.ts†L190-L204】
- Health check at `/healthz` and Swagger docs at `/docs` support operational monitoring and buyer visibility. 【F:server/src/index.ts†L152-L204】
- Admin banner and weather data pull via env-based OpenWeather token or server proxy; ticker auto-scrolls and respects server-provided banner data, keeping secrets in env. 【F:apps/admin/src/components/AdminBanner.jsx†L21-L174】
- AI concierge uses OpenAI when `OPENAI_API_KEY` (and optional `OPENAI_MODEL`) are set, with RBAC/CSRF protection and a concise static playbook fallback when the provider is absent. 【F:server/src/routes/ai.ts†L1-L108】
- Theme, layout, and dataset preferences persist through settings with live preview and dashboard sync, centralizing UX control without hard-coded secrets. 【F:apps/admin/src/pages/Settings.jsx†L217-L425】
- Dashboard widgets support favorites, reordering, and token-gated heatmap rendering; alerts notify when favorites change, and 2D analytics remain the default. 【F:apps/admin/src/pages/Dashboard.jsx†L154-L483】

## Documentation & environment matrix

- Environment variables for Admin, Studio, and API (including weather, heatmap, CORS, JWT, Sanity, AI) are cataloged for Vercel/Railway handoff. 【F:ENVIRONMENT_VARIABLES.md†L1-L31】
- Deployment targets are defined for Admin (Vercel), Studio (Vercel), and API (Railway/Docker) in `DEPLOYMENT.md`; architecture and buyer handoff guides live in `ARCHITECTURE.md` and `BUYER_HANDBOOK.md`. 【F:DEPLOYMENT.md†L1-L32】【F:ARCHITECTURE.md†L1-L30】【F:BUYER_HANDBOOK.md†L1-L46】

## UX & accessibility polish

- Banner animates post-login with faster ticker, weather-driven visuals, and compact time toggle; login/logout use light fade transitions. 【F:apps/admin/src/components/AdminBanner.jsx†L21-L174】【F:apps/admin/src/main.jsx†L1-L110】
- Dashboard cards use premium styling with inline star/reorder controls and concise guidance; accessibility launcher is compact and semi-transparent per updated chrome. 【F:apps/admin/src/pages/Dashboard.jsx†L414-L483】【F:apps/admin/public/styles.css†L1-L200】
- Settings expose granular theming (accent, density, radius, blur, shadow, border, glow, typography, heading scale) with live preview to ensure admins see changes immediately. 【F:apps/admin/src/pages/Settings.jsx†L217-L425】

## Outstanding steps to reach 100/100 readiness (non-secret work)

1. **Finalize environment wiring**: set `VITE_NIMBUS_API_URL` on Vercel; set `CORS_ORIGINS`/`ADMIN_ORIGIN`/preview flags on the API; provide JWT, Sanity, weather, heatmap, and AI keys per `ENVIRONMENT_VARIABLES.md`. 【F:ENVIRONMENT_VARIABLES.md†L1-L31】
2. **QA across deploys**: run smoke builds (`npm run build`) for admin, studio, server in staging with real env values and confirm banner/weather/login flows end-to-end.
3. **Monitoring/backup**: attach uptime/error monitoring (e.g., Vercel/LogDrains + Railway logs) and database backups; verify `/healthz` probes are hooked in hosting.
4. **Security regression tests**: add auth/CSRF/CORS automated checks and basic integration tests for login, preferences, and analytics endpoints.
5. **Legal content check**: publish finalized Terms/Privacy/Data & AI usage pages via Studio content to ensure buyer-ready disclosures.

**Current readiness**: 95/100 — operational risk remains until Vercel/Railway env variables (including AI) and CORS allowlists are finalized and verified against banner/login/weather/concierge flows.
