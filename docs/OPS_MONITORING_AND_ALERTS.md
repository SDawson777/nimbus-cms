# Ops Monitoring and Alerts (CMS Source of Truth)

## Objective

Prove that uptime monitoring + alerting + error monitoring are configured and tested (DEMO environment).

## Tools

- Uptime monitoring: **UptimeRobot** (or Better Stack)
- Error monitoring: **Sentry** (already wired in code)
- Alerts: Email (required) + Slack (optional)

## URLs to Monitor (DEMO)

- Admin SPA: `https://nimbus-admin-demo.vercel.app`
- Studio: (fill)
- API health: `https://nimbus-api-demo.up.railway.app/healthz`
- API ready: `https://nimbus-api-demo.up.railway.app/ready`

## Recommended Uptime Settings

- Check interval: 1–5 minutes (buyers like 1 minute)
- Alert after: 1–2 failures
- Regions: at least 2 (US + EU) if available

## Alert Destinations

- Email: (fill)
- Slack channel: (fill, optional)

## Capturing Proof (You will attach screenshots)

- Screenshot: list of monitors/checks
- Screenshot: an example incident/alert
- Export: JSON/YAML export of checks if your uptime tool supports it

## Sentry Wiring

### Required Sentry Projects

- `nimbus-cms-server` (API)
- `nimbus-admin-spa` (Admin UI)
- `nimbus-mobile` (Mobile)

### Where DSNs live

- API (local): `server/.env` uses `SENTRY_DSN`
- API (Railway): Railway service env var `SENTRY_DSN`
- Admin SPA (local): `apps/admin/.env` uses `VITE_SENTRY_DSN`
- Admin SPA (Vercel): Vercel env var `VITE_SENTRY_DSN`
- Mobile: mobile repo env (platform specific)

### Trigger One Test Error Per App

- API: `GET /dev/trigger-error` (dev-only) returns 500 and includes `sentryEventId` in non-prod.
- Admin SPA: dev-only debug button throws `new Error('Nimbus Admin test error')`.
- Mobile: use existing debug/test error trigger screen (or add one in the mobile repo).

### Verify

- Events appear in Sentry for each project
- Each event includes release + environment
- Keep a screenshot of an example Issue/Event per project

## Buyer Swap Checklist

- Replace uptime tool alert email + Slack webhook
- Replace Sentry org/project + DSNs
- Confirm `/healthz` and `/ready` monitors are green
