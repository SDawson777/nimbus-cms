# Sentry Deployment Checklist

Use this checklist to configure Sentry DSNs in your deployed environments (Railway API, Vercel Admin SPA).

## API Server (Railway)

### Step 1: Add Environment Variables to Railway

Go to **Railway Project** → **Variables** → add:

```
SENTRY_DSN=https://6dd7fd17e949bb0e8a891dcdd80f70a4@o4509708991397888.ingest.us.sentry.io/4510480090923008
SENTRY_ENVIRONMENT=production
SENTRY_RELEASE=1.0.0
SENTRY_TRACES_SAMPLE_RATE=0.1
SENTRY_PROFILES_SAMPLE_RATE=0.01
```

### Step 2: Verify on Deploy

After railway redeploys, check logs:

```bash
railway logs --service cms-api | grep "Sentry initialized"
```

Expected output:
```
Sentry initialized (server) { env: 'production', tracesSampleRate: 0.1, profilesSampleRate: 0.01 }
```

### Step 3: Test Error Capture

Trigger a test error:

```bash
curl https://nimbus-api-demo.up.railway.app/api/admin/test-error  # if you add this endpoint
```

Then check **Sentry Dashboard** → **Issues** for the error within 10 seconds.

---

## Admin SPA (Vercel)

### Step 1: Add Environment Variables to Vercel

Go to **Vercel Project** (nimbus-admin-demo) → **Settings** → **Environment Variables** → add:

```
VITE_SENTRY_DSN=https://7a9dc75600c749376cbb279f71297930@o4509708991397888.ingest.us.sentry.io/4510547370770432
VITE_APP_ENV=production
VITE_APP_VERSION=1.0.0
```

### Step 2: Redeploy Admin SPA

After adding env vars, redeploy:

```bash
vercel --prod
# or trigger a new deployment via Vercel UI
```

### Step 3: Verify on Deploy

Open Admin SPA in browser → check browser console:

```javascript
// Browser console
> window.Sentry
// Should return the Sentry object if initialized

> window.__captureAppError
// Should be a function
```

### Step 4: Test Error Capture

Trigger a test error:

```javascript
// In browser console on Admin SPA
window.__captureAppError(new Error("Test error"), { source: "manual-test" });
```

Then check **Sentry Dashboard** → **Issues** for the error within 10 seconds.

---

## Sentry Dashboard Verification

Once both are deployed:

1. Go to **Sentry Dashboard** → select **Nimbus-CMS** organization.
2. Check **Projects** → should see:
   - `nimbus-cms-server` (Node.js)
   - `nimbus-admin-spa` (React/Browser)
3. Go to **Issues** → both projects should start appearing.
4. Go to **Performance** → transactions should appear (if traffic is flowing).
5. Configure **Alerts**:
   - API: alert on **5xx rate > 2%** or **error spike**.
   - Admin: alert on **error rate > 5%**.

---

## Environment Parity

### Development / Local

```bash
# .env (do NOT commit)
SENTRY_DSN=https://6dd7fd17e949bb0e8a891dcdd80f70a4@o4509708991397888.ingest.us.sentry.io/4510480090923008
SENTRY_ENVIRONMENT=local
SENTRY_RELEASE=local-dev

VITE_SENTRY_DSN=https://7a9dc75600c749376cbb279f71297930@o4509708991397888.ingest.us.sentry.io/4510547370770432
VITE_APP_ENV=local
VITE_APP_VERSION=local-dev
```

### Staging (if needed)

```bash
SENTRY_ENVIRONMENT=staging
SENTRY_RELEASE=1.0.0-rc1

VITE_APP_ENV=staging
VITE_APP_VERSION=1.0.0-rc1
```

### Production

```bash
SENTRY_ENVIRONMENT=production
SENTRY_RELEASE=1.0.0

VITE_APP_ENV=production
VITE_APP_VERSION=1.0.0
```

---

## Monitoring Best Practices

### Daily Checks

- [ ] Visit **Sentry Dashboard** → check for new **high-priority issues**.
- [ ] Review **Release notes** → verify correct version is deployed.
- [ ] Check **Performance** tab → p95 latency for critical endpoints.

### Weekly Review

- [ ] Group similar errors (auto-grouped by Sentry).
- [ ] Triage errors: **Fix**, **Ignore**, or **Resolve**.
- [ ] Review **Session Replays** for SPA errors (understand user impact).

### Monthly

- [ ] Review **Release performance** → error rate trends.
- [ ] Adjust **sample rates** if cost is high or visibility is low.
- [ ] Update **PII scrubbing rules** if new sensitive fields appear.

---

## Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| Errors not appearing in Sentry | DSN incorrect or env var not set | Verify `SENTRY_DSN` in Railway/Vercel console |
| High Sentry costs | Sample rates too high | Reduce `tracesSampleRate` to 0.05, `replaysSessionSampleRate` to 0.01 |
| PII visible in events | Scrubbing rule missing | Add field to `beforeSend()` in both server/admin |
| Performance traces missing | `tracesSampleRate=0` | Set to `0.1` or higher |
| Session replays not capturing | Admin SPA not wired | Verify `window.Sentry` initialized in browser |

---

## References

- **Sentry Org**: https://sentry.io/organizations/nimbus-cms-o3/
- **Docs**: See `docs/SENTRY_SETUP.md` for full configuration details.
