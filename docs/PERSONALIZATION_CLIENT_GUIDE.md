# Personalization Client Implementation Guide

This document augments `docs/MOBILE_CONTRACT.md` with deeper guidance for teams integrating the `/personalization/apply` endpoint across mobile, web, kiosk, and partner surfaces.

## Overview

The personalization service evaluates admin-authored `personalizationRule` documents and applies additive boosts to candidate content. The endpoint is channel- and context-aware but intentionally stateless; clients provide user/session context and receive a scored list of items.

## Request contract

```
POST /personalization/apply
Content-Type: application/json

{
  "context": {
    "userId": "abc123",             // stable per-user identifier (recommended)
    "sessionId": "req-uuid",        // short-lived identifier for request correlation
    "channel": "mobile",            // web | mobile | kiosk | email | partner
    "diet": "vegan",                // arbitrary key/value pairs used by rule conditions
    "locationState": "MI",
    "lastPurchaseDaysAgo": 5
  },
  "contentType": "article",         // article | deal | productCategory | banner | quiz
  "slugs": ["slug-a", "slug-b"],   // optional white-list of candidates to score
  "limit": 10                        // optional cap (default 20)
}
```

### Context best practices

- Stick to **primitive** values (string/number/boolean). Arrays are accepted but keep them small (<25 items) to avoid oversized payloads.
- Use **normalized keys** in camelCase so rules remain portable. For example, use `locationState` instead of `Location` or `state_code`.
- Include `channel` for every request; rules can set `actions[].channel` and will be skipped when the channel mismatches.
- Provide `userId` and `sessionId` to help correlate logs and to build cache keys.

### Candidate hydration strategies

| Scenario                                     | Recommendation                                                   |
| -------------------------------------------- | ---------------------------------------------------------------- |
| Client already fetched full content list     | Pass the subset via `slugs` to avoid duplicate CMS queries.      |
| Client relies on server to source candidates | Omit `slugs`; the API will fetch eligible documents itself.      |
| Need mixed content types                     | Issue separate requests per type to keep rule evaluation simple. |

## Response contract

```
{
  "items": [
    {
      "id": "doc-id",
      "slug": "vegan-guide",
      "type": "article",
      "title": "Vegan Guide",
      "score": 42,
      "reasons": [
        { "rule": "Boost Vegan Bundle", "boost": 25 },
        { "rule": "Web Banner Feature", "boost": 17 }
      ]
    }
  ],
  "metadata": {
    "cache": "MISS" | "HIT",            // endpoint-level cache signal (future)
    "evaluatedRules": 8,
    "matchedRules": 2
  }
}
```

- `score` is cumulative and includes the candidate's incoming `score` (if provided) plus all boosts.
- `reasons` enumerates every applied rule, which can be forwarded to analytics.

## Retry, caching, and fallbacks

| Topic       | Guidance                                                                                                                                                           |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| TTL         | Treat responses as **ephemeral**, refreshing at least every 5–15 minutes per user.                                                                                 |
| CDN caching | Key on `channel`, `userId`, and the sorted `slugs` hash to avoid cross-user leakage.                                                                               |
| Failures    | If the API responds with `>=500` or times out, fall back to deterministic ordering (e.g., recency) and log the incident. Consider exponential backoff with jitter. |
| Cold start  | Warm caches by making a best-effort request during app boot, but gate UI rendering on availability to avoid blocking the main thread.                              |

## Webhook + scheduler integrations

- Admins can configure webhooks that fire when `personalizationRule.enabled` changes. Consume these to purge CDN caches immediately.
- The compliance scheduler now uses `ENABLE_COMPLIANCE_SCHEDULER`; ensure only one worker is active per cluster to avoid duplicate webhook notifications.

## Observability checklist

1. Log the payload sent to `/personalization/apply` (minus PII) with request IDs.
2. Log the top N results with their `reasons` and total score.
3. Emit analytics events capturing the winning rule(s) for downstream dashboards.
4. Alert when the endpoint latency exceeds 500ms or error rate >2%.

## Example fallback logic (pseudo)

```ts
async function fetchPersonalizedFeed(ctx, defaults) {
  try {
    const { items } = await personalizationApply(ctx);
    if (!items?.length) return defaults;
    return hydrateContent(items);
  } catch (err) {
    logger.warn("personalization.unavailable", { err });
    return defaults.sort(
      (a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt),
    );
  }
}
```

Keep this document updated whenever personalization contracts or cadences shift.
