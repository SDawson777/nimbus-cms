# Observability and logging runbook

This document explains how the CMS API emits logs, how `requestId` is propagated through requests, and how to plug those logs into your observability stack.

It is meant for SREs, platform owners, and incident responders.

## Logging primitives

The server exposes two primary logging utilities:

- `logger` — a process-level structured logger exported from `server/src/lib/logger.ts`.
- `requestLogger` — an Express middleware that attaches a request-scoped logger (`req.log`) and emits lifecycle events.

All logs are newline-delimited JSON suitable for ingestion by systems like CloudWatch, Stackdriver, Datadog, Logtail, and others.

### `logger` (process-level)

Use `logger` when you are not inside an HTTP request context (for example: boot, jobs, or one-off scripts).

Typical fields:

- `timestamp` — ISO 8601 string
- `level` — `debug` | `info` | `warn` | `error`
- `message` — human-friendly message
- Additional structured fields you pass, such as `job`, `instanceId`, `orgId`, `error`, etc.

Control verbosity with the `LOG_LEVEL` environment variable:

- default: `info` (shows `info`, `warn`, `error`)
- `debug`: also includes `debug` events

> Recommendation: keep `LOG_LEVEL` at `info` in production and temporarily switch to `debug` during active incident investigation.

### `requestLogger` (request-scoped)

`requestLogger` is mounted early in the Express stack. It:

1. Determines a `requestId` for each incoming request:
   - If the client sends `X-Request-Id` or `X-Correlation-Id`, that value is used.
   - Otherwise, the middleware generates a random id.
2. Creates a child logger bound to the current request and assigns it to `req.log`.
3. Emits lifecycle events automatically:
   - `request.start` — when the request is received.
   - `request.complete` — when a response is successfully sent.
   - `request.aborted` — when the connection closes prematurely.

Every log from within a route handler uses `req.log` so it automatically includes:

- `requestId`
- `method`
- `path`
- `statusCode` (for completion events)
- `durationMs` (for completion/aborted events)

#### Example log entries

`request.start`:

```json
{
  "level": "info",
  "message": "request.start",
  "requestId": "c7b2a9f1-7e01-4fb4-a8bc-8e5ef3120e8a",
  "method": "GET",
  "path": "/api/admin/products"
}
```

`request.complete`:

```json
{
  "level": "info",
  "message": "request.complete",
  "requestId": "c7b2a9f1-7e01-4fb4-a8bc-8e5ef3120e8a",
  "method": "GET",
  "path": "/api/admin/products",
  "statusCode": 200,
  "durationMs": 37,
  "responseBytes": 8421
}
```

Application error from a handler:

```json
{
  "level": "error",
  "message": "failed to fetch products",
  "requestId": "c7b2a9f1-7e01-4fb4-a8bc-8e5ef3120e8a",
  "method": "GET",
  "path": "/api/admin/products",
  "error": {
    "message": "sanity client timeout",
    "name": "TimeoutError"
  }
}
```

## RequestId lifecycle and cross-service correlation

`requestId` is the primary correlation key for a user interaction.

- Edge / gateway: if you run behind a load balancer, API gateway, or custom edge, configure it to attach an `X-Request-Id` or `X-Correlation-Id` header to inbound requests.
- CMS API: the middleware honors that header, attaches `requestId` to `req.log`, and reuses it for every log line.
- Downstream services: when the API calls out to other services (for example, analytics pipelines or payment providers), it should forward `X-Request-Id` so logs can be correlated end-to-end.

If your upstream does not provide a correlation id, the CMS will generate one and include it in every log so you can still trace a single request through the system.

## Using logs for debugging and SLOs

Because logs are structured JSON, you can build dashboards and alerts around them.

### Example SLOs

You can define simple, observable SLOs such as:

- **Availability**: 99.9% of requests to `/content/*` return a 2xx/3xx status.
- **Latency**: p95 latency for `/content/*` < 250ms; p95 latency for `/api/admin/*` < 400ms.
- **Error budget**: less than 1% of requests to `/api/admin/*` return 5xx over a rolling 30 days.

Use `request.complete` logs grouped by `path` and `statusCode` to compute these.

### Example dashboards and queries

- **Latency (RED / USE)**: aggregate `request.complete` events by `path` and `statusCode` to compute p50/p95 latency and error rates.
- **Error hotspots**: filter `level:error` logs and group by `path` or `feature` field to see where errors are concentrated.
- **Tenant isolation**: if you attach `orgId`, `brandId`, or `storeId` to `req.log` in critical handlers, you can see which tenants are impacted by problems.

Example queries (conceptual):

- `message:request.complete AND path:/api/admin/compliance/overview` → compliance dashboard latency.
- `level:error AND requestId:abc123` → all logs for a single failing request.

## Integrating with external observability systems

Because output is plain JSON to stdout/stderr, integration is mostly about wiring a log drain:

- **AWS ECS / Fargate**: send container logs to CloudWatch Logs and configure metrics filters or subscription filters to a tool like Datadog.
- **Kubernetes**: use a DaemonSet log collector (Fluent Bit, Vector, etc.) to ship logs to your provider of choice.
- **Vercel / Netlify / Render**: use their built-in log forwarding integrations; ensure they treat logs as JSON.

Tips:

- Configure your collector to treat each line as a full JSON object (no multi-line parsing needed).
- Preserve fields like `requestId`, `method`, `path`, and `statusCode` as first-class attributes for easier querying.
- Use `service` / `env` tags (for example: `service=nimbus-cms`, `env=production`) so you can slice metrics by environment.

## Troubleshooting high latency and errors

When debugging a specific incident:

1. Identify the affected route and timeframe (for example, `/api/admin/analytics/overview` over the last 15 minutes).
2. Filter for `message:request.complete` on that path and check `durationMs` and `statusCode` distributions.
3. Drill into individual slow/erroring requests using `requestId`.
4. Correlate with downstream logs if you propagate `X-Request-Id`.

Common patterns:

- Spikes in `durationMs` with 200s often indicate slow downstreams (Sanity, database, or external APIs).
- Spikes in 5xx codes with `error.name:TimeoutError` usually point to overloaded dependencies.
- High rates of 4xx on admin routes may indicate misconfigured RBAC scopes or CSRF failures.

If you enable `LOG_LEVEL=debug`, you may also see additional internal events (cache hits/misses, rule-engine traces, etc.) that help during complex investigations.

### On-call runbook (example)

When you are on-call and an alert fires (for example, "5xx rate > 2% on /content/\*"):

1. Check recent `request.complete` logs for the affected path and confirm whether the spike is real or a false positive.
2. Use `requestId` from a few failing requests to gather all related logs and identify common patterns (tenant, region, downstream service).
3. If errors point to Sanity or another dependency, check that provider's status page and your own network metrics.
4. If the issue is code-related (recent deploy, new feature), consider rolling back to the previous image or toggling the feature flag.
5. Once mitigated, capture a short post-incident summary and, if useful, add permanent alerts or dashboards for the discovered failure mode.

## Configuration summary

Key environment variables related to observability:

- `LOG_LEVEL` — controls verbosity; set to `debug` for temporary deep dives.
- `SENTRY_DSN` — when set, server 5xx errors captured by the global error handler are reported to Sentry.
- `SENTRY_ENVIRONMENT` / `SENTRY_RELEASE` — optional tags for grouping issues.
- `SENTRY_TRACES_SAMPLE_RATE` — optional performance sampling rate (number between 0 and 1).
- `ENABLE_COMPLIANCE_SCHEDULER` — not directly observability-related, but when enabled, the scheduler emits logs via `logger` so you can trace snapshot runs.
- `COMPLIANCE_OVERVIEW_CACHE_TTL_MS` — influences how often live compliance computations occur vs reading from cache; can affect perceived latency.

For a more general deployment overview, see [`docs/DEPLOYMENT.md`](./DEPLOYMENT.md) and the observability section there.
