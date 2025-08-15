# Mobile ↔︎ CMS Contract (Phase 1–4)

## Endpoints

- `GET /api/v1/content/legal`
- `GET /api/v1/content/faqs`
- `GET /api/v1/content/articles`
- `GET /api/v1/content/articles/:slug`
- `GET /api/v1/content/filters`
- `GET /api/v1/content/deals`
- `GET /api/v1/content/copy`
- `GET /api/v1/status`

Query parameters `preview` and `secret` are supported on content routes to render draft
content. When `preview=true`, a matching `secret` must be supplied.

### GET /api/v1/content/legal

**Query Parameters**

| Name      | Type                                      | Description                  |
| --------- | ----------------------------------------- | ---------------------------- |
| `type`    | `"terms" \| "privacy" \| "accessibility"` | Document type                |
| `preview` | `boolean`                                 | Optional draft preview       |
| `secret`  | `string`                                  | Required when `preview=true` |

**Response**

```json
{
  "title": "string",
  "version": "string",
  "updatedAt": "ISODate",
  "body": {}
}
```

### GET /api/v1/content/faqs

**Query Parameters**

| Name      | Type      | Description                  |
| --------- | --------- | ---------------------------- |
| `preview` | `boolean` | Optional draft preview       |
| `secret`  | `string`  | Required when `preview=true` |

**Response**

```json
[
  {
    "title": "string",
    "slug": "string",
    "items": [{"q": "string", "a": "string"}]
  }
]
```

### GET /api/v1/content/articles

**Query Parameters**

| Name      | Type      | Description                         |
| --------- | --------- | ----------------------------------- |
| `page`    | `number`  | Page number (default 1)             |
| `limit`   | `number`  | Items per page (default 20, max 50) |
| `tag`     | `string`  | Optional tag filter                 |
| `preview` | `boolean` | Optional draft preview              |
| `secret`  | `string`  | Required when `preview=true`        |

**Response**

```json
{
  "items": [
    {
      "id": "string",
      "title": "string",
      "slug": "string",
      "excerpt": "string",
      "body": {},
      "cover": {"src": "url", "alt": "string"},
      "tags": ["string"],
      "author": "string",
      "publishedAt": "ISODate",
      "featured": true
    }
  ],
  "page": 1,
  "limit": 20,
  "total": 1,
  "totalPages": 1
}
```

### GET /api/v1/content/articles/:slug

**Query Parameters**

| Name      | Type      | Description                  |
| --------- | --------- | ---------------------------- |
| `preview` | `boolean` | Optional draft preview       |
| `secret`  | `string`  | Required when `preview=true` |

**Response**

Same shape as a single item from `/content/articles`.

### GET /api/v1/content/filters

No parameters.

**Response**

```json
{
  "categories": [{"name": "string", "slug": "string", "iconRef": "string", "weight": 0}],
  "filters": [
    {
      "name": "string",
      "slug": "string",
      "type": "string",
      "options": [{"label": "string", "value": "string"}]
    }
  ]
}
```

### GET /api/v1/content/deals

**Query Parameters**

| Name      | Type     | Description                          |
| --------- | -------- | ------------------------------------ |
| `storeId` | `string` | Optional store filter                |
| `limit`   | `number` | Items to return (default 20, max 50) |

**Response**

```json
[
  {
    "title": "string",
    "slug": "string",
    "badge": "string",
    "ctaText": "string",
    "ctaLink": "string",
    "image": {"src": "url", "alt": "string"},
    "priority": 0,
    "startAt": "ISODate",
    "endAt": "ISODate",
    "stores": ["string"]
  }
]
```

### GET /api/v1/content/copy

**Query Parameters**

| Name      | Type                                                                                 | Description   |
| --------- | ------------------------------------------------------------------------------------ | ------------- |
| `context` | `"onboarding" \| "emptyStates" \| "awards" \| "accessibility" \| "dataTransparency"` | Copy grouping |

**Response**

```json
[{"key": "string", "text": "string"}]
```

### GET /api/v1/status

No parameters.

**Response**

```json
{
  "phases": {
    "p1_mvp_core": true,
    "p2_intelligence_scaffold": true,
    "p3_ecosystem_cms": true,
    "p4_vanguard_prefs": true
  }
}
```
