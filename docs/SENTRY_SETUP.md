# Sentry Integration & Enterprise Observability

This document describes the enterprise-grade Sentry configuration for error tracking, performance monitoring, profiling, and session replays across the **API server** and **Admin SPA**.

## Overview

- **API Server** (Node.js): Error capture, performance traces, database/HTTP instrumentation, profiling.
- **Admin SPA** (React): Browser error capture, session replays on error, performance monitoring, PII scrubbing.
- **Organization**: Nimbus CMS (org ID: `4509708991397888`)

## Configuration

### Server (Node.js / Express)

**Environment Variables:**

```bash
SENTRY_DSN=https://6dd7fd17e949bb0e8a891dcdd80f70a4@o4509708991397888.ingest.us.sentry.io/4510480090923008
SENTRY_ENVIRONMENT=production          # or 'staging', 'demo'
SENTRY_RELEASE=1.0.0                   # Deployed version
SENTRY_TRACES_SAMPLE_RATE=0.1          # 10% of transactions (traces)
SENTRY_PROFILES_SAMPLE_RATE=0.01       # 1% of traces get profiled (CPU/memory)
```

**What's captured:**

- ✅ **Errors**: All unhandled exceptions + 5xx responses via `errorHandler` middleware.
- ✅ **Traces**: 10% of HTTP requests (method, path, duration, status).
- ✅ **Profiles**: CPU/memory profiles on 1% of traced transactions.
- ✅ **Instrumentation**: Automatic HTTP, database (Prisma), and external API calls.
- ✅ **Context**: `requestId`, method, path, status code, authenticated user email.
- ✅ **PII Scrubbing**: Secrets (JWT, DB URL, API tokens) + auth headers removed before sending.

**Initialization:**

```typescript
// src/index.ts
import { initSentry } from "./lib/sentry";

validateEnv(); // checks config
initSentry();  // wires Sentry
```

**Error Capture:**

All 5xx errors are automatically sent via `errorHandler` middleware:

```typescript
// src/middleware/errorHandler.ts
captureException(err, req);  // includes requestId, user context
```

### Admin SPA (React)

**Environment Variables:**

```bash
VITE_SENTRY_DSN=https://7a9dc75600c749376cbb279f71297930@o4509708991397888.ingest.us.sentry.io/4510547370770432
VITE_APP_ENV=production
VITE_APP_VERSION=1.0.0
```

**What's captured:**

- ✅ **Browser Errors**: React component errors, JavaScript exceptions, unhandled promise rejections.
- ✅ **Session Replays**: On error (100% capture), + random 5% of all sessions (privacy-masked).
- ✅ **Performance Traces**: 10% transaction sample rate (route navigation, page load timing).
- ✅ **User Context**: Admin email (from session storage).
- ✅ **PII Scrubbing**: Tokens, passwords, auth headers removed; session replay text/media masked.

**Initialization:**

```javascript
// src/main.jsx
import { initSentry } from "./lib/sentryInit";

// Called early, before app mounts
await initSentry();
```

**Error Capture (via Error Boundary):**

React error boundary captures component errors:

```jsx
// components/ErrorBoundary.jsx or main app wrapper
window.__captureAppError(err, info);  // calls Sentry.captureException()
```

## Operations & Monitoring

### Alerts

Configure Sentry alerts in the Nimbus organization:

1. **API Errors**: Alert on **5xx rate > 2%** or **error spike** over 15 minutes.
2. **Admin SPA**: Alert on **error rate > 5%** or **specific error class** (e.g., `TypeError`).
3. **Performance**: Alert on **transaction p95 latency > 1s** or **request timeout**.

**To Set Up:**

1. Go to **Sentry Dashboard** → **Alerts** → **Create Alert Rule**.
2. Select environment (production/staging) and project (Server / Admin).
3. Set conditions and notification channel (Slack, Email, PagerDuty).

### Debugging & Diagnosis

**Find a specific error:**

1. Go to **Issues** tab.
2. Filter by **Environment** (production/staging), **Release** (version).
3. Click issue → view **Full Event** + **Breadcrumbs** (request history).
4. Check **Replays** tab (for SPA errors with session recordings).

**Investigate a slow transaction:**

1. **Performance** tab → filter by transaction (`GET /admin`, `/api/v1/content/products`).
2. View **Trace details**: shows child spans (DB query, HTTP call, etc.).
3. **Profile**: CPU/memory samples during the transaction.

**Find errors for a specific user:**

1. **Issues** → click issue → **Discover** → filter by `user.email`.
2. Or go to **User Feedback** tab to read browser console errors.

## Sample Rates & Data

### Traces (Server)

- **10% of requests** are traced (send spans to Sentry).
- Each trace includes: method, path, duration, status, DB calls, HTTP calls.
- **Cost**: ~$5/month per 1M traces (with Sentry free tier, limited to 5K/month).

### Profiles (Server)

- **1% of traces** get profiled (CPU/memory samples).
- Useful for finding bottlenecks in slow endpoints.
- **Cost**: Included in trace quota.

### Session Replays (SPA)

- **100% of sessions with errors** are replayed (masked video of user actions).
- **5% of all sessions** are randomly replayed (baseline performance data).
- **Cost**: ~$3 per 1K replays (Sentry pricing; free tier includes limited replays).

### Recommendations for Cost Control

- **Production**: Keep `tracesSampleRate=0.1` and `profilesSampleRate=0.01`.
- **Staging**: Can increase to `tracesSampleRate=1.0` for full visibility.
- **Replays**: Reduce `replaysSessionSampleRate` to 0.01 (1%) if cost is a concern; keep `replaysOnErrorSampleRate=1.0`.

## PII & Privacy

### Server

Sensitive fields are **automatically scrubbed**:

- `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `SANITY_API_TOKEN`, `STRIPE_KEY`
- Auth headers: `Authorization`, `X-Auth-Token`, `X-CSRF-Token`
- Cookies

### SPA

- **Text masking**: Session replays mask all text in recordings (privacy-first).
- **Media blocking**: Videos/images not captured in replays.
- **Breadcrumb scrubbing**: Tokens, passwords removed from event logs.

To capture additional user info (e.g., tenant ID):

```typescript
// server/src/middleware/errorHandler.ts
scope.setTag("tenant", req.admin?.organizationSlug);
scope.setTag("store", req.admin?.storeSlug);
```

```javascript
// admin SPA, src/lib/sentryInit.js
window.Sentry.setTag("tenant", tenantContext?.slug);
```

## Release Management

Tie errors to specific code versions:

**Set release on deploy:**

```bash
# Before deploying (CI/CD)
export SENTRY_RELEASE=1.0.0  # or git tag
export SENTRY_ENVIRONMENT=production

# Deploy
npm run build
docker build -f server/Dockerfile -t nimbus-cms:1.0.0 .
docker push ...
```

**View issues by release:**

1. **Issues** → filter **Release** dropdown.
2. **Releases** tab → see deployment timeline + error rates per version.

## Testing Sentry Integration

### Server

Trigger a test error in a request handler:

```bash
curl http://localhost:4010/api/test-error  # if you add this route
```

Then go to **Sentry Dashboard** → **Issues** → should see the error within 5 seconds.

### Admin SPA

1. Open browser console in Admin UI.
2. Trigger an error:
   ```javascript
   window.__captureAppError(new Error("Test from browser"), { source: "manual-test" });
   ```
3. Check **Sentry Dashboard** → **Issues** within 5 seconds.

## Advanced: Custom Instrumentation

### Capture a custom message (audit trail)

```typescript
// server/src/routes/admin/users.ts
import { captureMessage } from "../../lib/sentry";

captureMessage(`Admin user ${email} logged in`, "info");
captureMessage(`Batch operation failed: ${reason}`, "error");
```

### Capture a custom span (custom timing)

```typescript
const transaction = Sentry.startTransaction({
  op: "custom-operation",
  name: "heavy-computation",
});

try {
  // do work
} finally {
  transaction.finish();
}
```

## Troubleshooting

**"Sentry is not initialized"**

- Ensure `SENTRY_DSN` is set in environment.
- Check logs for init errors: `console.log("Sentry initialized (server)"...)`.

**"Errors not appearing in Sentry Dashboard"**

- Verify DSN is correct (copy from Sentry UI, not docs).
- Check network tab in browser (SPA) for failed POST to `ingest.us.sentry.io`.
- Ensure `SENTRY_ENVIRONMENT` and `SENTRY_RELEASE` are set correctly.

**"PII is leaking in error reports"**

- Add field to `beforeSend()` PII scrubber in both `server/src/lib/sentry.ts` and `admin/src/lib/sentryInit.js`.
- Test with `console.log()` in `beforeSend()` before submitting.

## References

- [Sentry Docs: Node.js](https://docs.sentry.io/platforms/node/)
- [Sentry Docs: React](https://docs.sentry.io/platforms/javascript/guides/react/)
- [Performance Monitoring](https://docs.sentry.io/platforms/node/performance/instrumentation/)
- [Session Replays](https://docs.sentry.io/platforms/javascript/session-replay/)
- [Release Tracking](https://docs.sentry.io/releases/)
