# JARS CMS → Mobile App Content Contract

This document defines the CMS data types, GROQ queries, and API proxy endpoints used by the Jars-mobile-app across Phases 1–4.

## Phase 1 — Core content

- `legalPage`: Terms, Privacy Policy
- `faqItem`: FAQ screen
- `storeInfo`: Hours, amenities
- `filters`: Categories, strains, brands

**GROQ Examples**

## Phase 2 — Deals & Personalization flags

- `deal`: CMS-curated deal with start/end date, tags, "reason text"
- `collection`: Curated product set for "For You Today"

## Phase 3 — Greenhouse & Concierge

- `article`: Educational Greenhouse articles
- `category`: Article category
- `module`: Quiz/module for completion
- `author`: Author details

## Phase 4 — Transparency & Awards

- `transparencyPage`: Data & AI policy
- `accessibilityPage`: Accessibility statement
- `awardsExplainer`: Loyalty & Jars Awards explainer

---

### Public API Paths

The mobile app consumes these via the backend proxy:

- `/content/legal`
- `/content/faqs`
- `/content/articles`
- `/content/articles/:slug`
- `/content/filters`
- `/content/deals`
- `/content/copy`
- `/status`
- `/content/transparency`
- `/content/accessibility`
- `/content/awards-explainer`

---

### Endpoint Details

Content routes accept the `preview` query parameter to return draft content. When
`preview=true`, a `secret` query parameter must also be provided.

#### GET `/content/legal`

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

#### GET `/content/faqs`

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

#### GET `/content/articles`

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

#### GET `/content/articles/:slug`

**Query Parameters**

| Name      | Type      | Description                  |
| --------- | --------- | ---------------------------- |
| `preview` | `boolean` | Optional draft preview       |
| `secret`  | `string`  | Required when `preview=true` |

**Response**

Same shape as a single item from `/content/articles`.

#### GET `/content/filters`

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

#### GET `/content/deals`

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

#### GET `/content/copy`

**Query Parameters**

| Name      | Type                                                                                 | Description   |
| --------- | ------------------------------------------------------------------------------------ | ------------- |
| `context` | `"onboarding" \| "emptyStates" \| "awards" \| "accessibility" \| "dataTransparency"` | Copy grouping |

**Response**

```json
[{"key": "string", "text": "string"}]
```

#### GET `/status`

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
