# Mobile Sanity Content API Documentation

> **Last Updated:** Auto-generated on API deployment  
> **Base URL:** `https://nimbus-api-demo.up.railway.app`

## Overview

This API provides **direct access to Sanity CMS content** for the Nimbus mobile app. All content is fetched in real-time from Sanity—no PostgreSQL storage is involved.

### Key Points for Mobile Developers

1. **No caching** - Content is fetched fresh from Sanity on each request
2. **Simple response format** - All endpoints return `{ items: [...] }` or similar simple structures
3. **No authentication required** - All endpoints are public
4. **Webhook notifications** - The backend receives webhooks from Sanity when content changes (for future push notification support)

---

## Base Endpoints

| Path | Method | Description |
|------|--------|-------------|
| `/mobile/sanity/all` | GET | Fetch all major content types in one request (app init) |
| `/mobile/sanity/articles` | GET | List articles |
| `/mobile/sanity/articles/:slug` | GET | Single article by slug |
| `/mobile/sanity/categories` | GET | All categories |
| `/mobile/sanity/faq` | GET | FAQ items (grouped by category) |
| `/mobile/sanity/banners` | GET | Active promotional banners |
| `/mobile/sanity/deals` | GET | Active deals/discounts |
| `/mobile/sanity/promos` | GET | Active promo codes |
| `/mobile/sanity/legal` | GET | All legal documents |
| `/mobile/sanity/legal/:type` | GET | Specific legal doc (terms, privacy, etc.) |
| `/mobile/sanity/sanity-products` | GET | Products from Sanity CMS |
| `/mobile/sanity/sanity-stores` | GET | Stores from Sanity CMS |
| `/mobile/sanity/brands` | GET | Brand listings |
| `/mobile/sanity/accessibility` | GET | Accessibility page content |
| `/mobile/sanity/awards` | GET | Awards explainer content |
| `/mobile/sanity/transparency` | GET | Transparency pages |
| `/mobile/sanity/theme` | GET | Theme configuration |
| `/mobile/sanity/quizzes` | GET | Available quizzes |
| `/mobile/sanity/quizzes/:slug` | GET | Single quiz by slug |
| `/mobile/sanity/authors` | GET | Author profiles |
| `/mobile/sanity/effects` | GET | Effect tags (for filtering) |
| `/mobile/sanity/filters` | GET | Filter groups |
| `/mobile/sanity/product-types` | GET | Product type definitions |
| `/mobile/sanity/organizations` | GET | Organization listings |
| `/mobile/sanity/personalization` | GET | Personalization rules |
| `/mobile/sanity/metrics` | GET | Content metrics |
| `/mobile/sanity/compliance` | GET | Compliance information |
| `/mobile/sanity/product-drops` | GET | Upcoming product launches |
| `/mobile/sanity/inventory/:productId` | GET | Variant inventory for a product |
| `/mobile/sanity/recalls` | GET | Product recall audits |
| `/mobile/sanity/analytics-settings` | GET | Analytics configuration |

---

## Endpoint Details

### GET /mobile/sanity/all

**Recommended for app initialization.** Returns a snapshot of key content types in a single request.

```json
{
  "articles": [...],      // Latest 10 articles
  "categories": [...],    // All categories
  "faqs": [...],          // All FAQ items
  "banners": [...],       // Active banners
  "deals": [...],         // Top 5 active deals
  "brands": [...],        // All brands
  "theme": {...},         // Default theme config
  "effects": [...],       // All effect tags
  "lastSync": "2024-01-15T12:00:00.000Z"
}
```

---

### GET /mobile/sanity/articles

Paginated list of published articles.

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `limit` | number | 20 | Items per page (max 50) |
| `page` | number | 1 | Page number |

**Response:**
```json
{
  "articles": [
    {
      "_id": "abc123",
      "title": "Article Title",
      "slug": "article-slug",
      "excerpt": "Brief summary...",
      "body": [...], // Portable Text blocks
      "author": { "name": "John Doe", "image": "https://..." },
      "mainImage": "https://cdn.sanity.io/...",
      "publishedAt": "2024-01-10T12:00:00Z",
      "_updatedAt": "2024-01-12T15:30:00Z"
    }
  ],
  "page": 1,
  "limit": 20,
  "total": 42
}
```

---

### GET /mobile/sanity/articles/:slug

Single article by URL slug.

**Response:**
```json
{
  "article": {
    "_id": "abc123",
    "title": "Article Title",
    "slug": "article-slug",
    "excerpt": "Brief summary...",
    "body": [...],
    "author": { "name": "John Doe", "bio": "...", "image": "https://..." },
    "mainImage": "https://cdn.sanity.io/...",
    "publishedAt": "2024-01-10T12:00:00Z",
    "_updatedAt": "2024-01-12T15:30:00Z"
  }
}
```

---

### GET /mobile/sanity/categories

All product/content categories.

**Response:**
```json
{
  "categories": [
    {
      "_id": "cat123",
      "name": "Edibles",
      "slug": "edibles",
      "description": "Cannabis-infused food products",
      "image": "https://cdn.sanity.io/...",
      "_updatedAt": "2024-01-05T10:00:00Z"
    }
  ]
}
```

---

### GET /mobile/sanity/faq

FAQ items grouped by category.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `category` | string | Filter by category slug |

**Response:**
```json
{
  "faqs": [
    {
      "_id": "faq123",
      "question": "How do I place an order?",
      "answer": "...",
      "category": { "name": "Orders", "slug": "orders" },
      "order": 1
    }
  ],
  "grouped": {
    "Orders": [...],
    "Shipping": [...],
    "Returns": [...]
  },
  "categories": ["Orders", "Shipping", "Returns"]
}
```

---

### GET /mobile/sanity/banners

Active promotional banners.

**Response:**
```json
{
  "banners": [
    {
      "_id": "banner123",
      "title": "Summer Sale",
      "subtitle": "Up to 30% off",
      "image": "https://cdn.sanity.io/...",
      "link": "/deals/summer-sale",
      "linkText": "Shop Now",
      "backgroundColor": "#FF5733",
      "textColor": "#FFFFFF",
      "priority": 10
    }
  ]
}
```

---

### GET /mobile/sanity/deals

Active deals and discounts.

**Response:**
```json
{
  "deals": [
    {
      "_id": "deal123",
      "title": "First-Time Customer Discount",
      "description": "Get 15% off your first order",
      "image": "https://cdn.sanity.io/...",
      "discountType": "percentage",
      "discountValue": 15,
      "code": "FIRST15",
      "startAt": "2024-01-01T00:00:00Z",
      "endAt": "2024-12-31T23:59:59Z",
      "products": [{ "_id": "...", "name": "...", "slug": "..." }],
      "categories": [{ "_id": "...", "name": "Edibles" }],
      "priority": 5
    }
  ]
}
```

---

### GET /mobile/sanity/promos

Active promotional codes.

**Response:**
```json
{
  "promos": [
    {
      "_id": "promo123",
      "title": "Weekend Special",
      "description": "Save $10 on orders over $50",
      "promoCode": "WEEKEND10",
      "discountPercent": null,
      "discountAmount": 10,
      "validFrom": "2024-01-13T00:00:00Z",
      "validUntil": "2024-01-14T23:59:59Z",
      "terms": "Minimum order $50. One per customer."
    }
  ]
}
```

---

### GET /mobile/sanity/legal

All legal documents.

**Response:**
```json
{
  "legal": [
    {
      "_id": "legal123",
      "title": "Terms of Service",
      "type": "terms",
      "slug": "terms-of-service",
      "body": [...],
      "effectiveFrom": "2024-01-01",
      "version": "2.0"
    }
  ]
}
```

---

### GET /mobile/sanity/legal/:type

Specific legal document by type.

**Path Parameters:**
| Param | Type | Values |
|-------|------|--------|
| `type` | string | `terms`, `privacy`, `cookies`, `returns`, `shipping` |

**Response:**
```json
{
  "document": {
    "_id": "legal123",
    "title": "Privacy Policy",
    "type": "privacy",
    "slug": "privacy-policy",
    "body": [...],
    "effectiveFrom": "2024-01-01",
    "version": "3.1"
  }
}
```

---

### GET /mobile/sanity/sanity-products

Products from Sanity CMS (not PostgreSQL).

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `limit` | number | 20 | Items per page (max 50) |
| `page` | number | 1 | Page number |
| `category` | string | - | Filter by category slug |

**Response:**
```json
{
  "products": [
    {
      "_id": "prod123",
      "name": "Blue Dream",
      "slug": "blue-dream",
      "description": "...",
      "image": "https://cdn.sanity.io/...",
      "images": ["https://...", "https://..."],
      "price": 45.00,
      "compareAtPrice": 55.00,
      "category": { "name": "Flower", "slug": "flower" },
      "brand": { "name": "Premium Farms", "slug": "premium-farms" },
      "thcPercent": 22.5,
      "cbdPercent": 0.1,
      "strainType": "hybrid",
      "weight": "3.5g",
      "effects": [{ "name": "Relaxed", "slug": "relaxed" }],
      "inStock": true
    }
  ],
  "page": 1,
  "limit": 20,
  "total": 150
}
```

---

### GET /mobile/sanity/sanity-stores

Store locations from Sanity.

**Response:**
```json
{
  "stores": [
    {
      "_id": "store123",
      "name": "Downtown Dispensary",
      "slug": "downtown-dispensary",
      "description": "...",
      "image": "https://cdn.sanity.io/...",
      "address": "123 Main St",
      "city": "Denver",
      "state": "CO",
      "zipCode": "80202",
      "phone": "(303) 555-0123",
      "email": "downtown@example.com",
      "hours": { "mon": "9am-9pm", ... },
      "latitude": 39.7392,
      "longitude": -104.9903,
      "isActive": true,
      "amenities": ["Parking", "ATM", "ADA Accessible"]
    }
  ]
}
```

---

### GET /mobile/sanity/brands

Brand listings.

**Response:**
```json
{
  "brands": [
    {
      "_id": "brand123",
      "name": "Premium Farms",
      "slug": "premium-farms",
      "description": "Craft cannabis since 2015",
      "logo": "https://cdn.sanity.io/...",
      "website": "https://premiumfarms.com",
      "featured": true
    }
  ]
}
```

---

### GET /mobile/sanity/accessibility

Accessibility statement and features.

**Response:**
```json
{
  "accessibility": {
    "_id": "access123",
    "title": "Accessibility Statement",
    "slug": "accessibility",
    "introduction": "We are committed to...",
    "body": [...],
    "features": ["Screen reader support", "Keyboard navigation", ...],
    "contactInfo": { "email": "accessibility@example.com", "phone": "..." },
    "lastReviewDate": "2024-01-01"
  }
}
```

---

### GET /mobile/sanity/awards

Awards and certifications explainer.

**Response:**
```json
{
  "awards": [
    {
      "_id": "award123",
      "title": "High Times Cup Winner",
      "slug": "high-times-cup",
      "description": "...",
      "body": [...],
      "image": "https://cdn.sanity.io/...",
      "criteria": ["Quality", "Potency", "Terpene Profile"],
      "order": 1
    }
  ]
}
```

---

### GET /mobile/sanity/transparency

Company transparency pages (sourcing, testing, etc.).

**Response:**
```json
{
  "transparencyPages": [
    {
      "_id": "trans123",
      "title": "Lab Testing",
      "slug": "lab-testing",
      "description": "How we test our products",
      "body": [...],
      "documents": [
        { "title": "COA Template", "file": "https://cdn.sanity.io/..." }
      ],
      "order": 1
    }
  ]
}
```

---

### GET /mobile/sanity/theme

Theme configuration for the app.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `brand` | string | Brand slug (for white-label) |
| `store` | string | Store slug (for store-specific theme) |

**Response:**
```json
{
  "theme": {
    "_id": "theme123",
    "primaryColor": "#3F7AFC",
    "secondaryColor": "#10B981",
    "accentColor": "#F59E0B",
    "backgroundColor": "#FFFFFF",
    "surfaceColor": "#F3F4F6",
    "textColor": "#111827",
    "mutedTextColor": "#6B7280",
    "logo": "https://cdn.sanity.io/...",
    "typography": { "fontFamily": "Inter", "headingFamily": "Poppins" },
    "darkModeEnabled": true,
    "cornerRadius": 8,
    "elevationStyle": "shadow"
  }
}
```

---

### GET /mobile/sanity/quizzes

Available quizzes/surveys.

**Response:**
```json
{
  "quizzes": [
    {
      "_id": "quiz123",
      "title": "Find Your Strain",
      "slug": "find-your-strain",
      "description": "Answer a few questions to find the perfect product",
      "image": "https://cdn.sanity.io/...",
      "questions": [
        {
          "question": "How do you want to feel?",
          "options": ["Relaxed", "Energized", "Creative", "Sleepy"],
          "correctAnswer": null,
          "explanation": null
        }
      ],
      "passingScore": null,
      "timeLimit": null,
      "order": 1
    }
  ]
}
```

---

### GET /mobile/sanity/effects

Effect tags for product filtering.

**Response:**
```json
{
  "effects": [
    {
      "_id": "effect123",
      "name": "Relaxed",
      "slug": "relaxed",
      "description": "Calming and soothing",
      "icon": "https://cdn.sanity.io/...",
      "color": "#10B981"
    }
  ]
}
```

---

### GET /mobile/sanity/filters

Filter groups for product search.

**Response:**
```json
{
  "filters": [
    {
      "_id": "filter123",
      "name": "THC Level",
      "slug": "thc-level",
      "type": "range",
      "options": [
        { "label": "Low (0-10%)", "value": "low" },
        { "label": "Medium (10-20%)", "value": "medium" },
        { "label": "High (20%+)", "value": "high" }
      ],
      "order": 1
    }
  ]
}
```

---

### GET /mobile/sanity/product-drops

Upcoming product launches.

**Response:**
```json
{
  "productDrops": [
    {
      "_id": "drop123",
      "title": "Spring Collection",
      "description": "New strains arriving...",
      "image": "https://cdn.sanity.io/...",
      "releaseDate": "2024-03-01T00:00:00Z",
      "products": [
        { "_id": "...", "name": "New Strain", "slug": "new-strain", "image": "..." }
      ],
      "notifyEnabled": true
    }
  ]
}
```

---

## Webhook Information

The backend receives webhooks from Sanity when content is updated.

**Webhook URL:** `https://nimbus-api-demo.up.railway.app/webhooks/sanity-sync`  
**Secret Header:** `x-sanity-webhook-secret` (configured in Sanity)

The webhook does NOT store content in PostgreSQL—it only logs updates for monitoring and can trigger future push notifications.

### Check Recent Updates

```
GET /webhooks/recent?limit=10&type=article
```

**Response:**
```json
{
  "updates": [
    { "type": "article", "id": "abc123", "timestamp": "2024-01-15T12:00:00.000Z" }
  ],
  "count": 1,
  "total": 50
}
```

---

## Error Handling

All endpoints return graceful fallbacks on error:

```json
{
  "articles": [],
  "page": 1,
  "limit": 20,
  "total": 0
}
```

Single-item endpoints return 404 when not found:

```json
{
  "error": "Article not found"
}
```

---

## Testing

### Quick Health Check

```bash
curl https://nimbus-api-demo.up.railway.app/webhooks/health
```

### Fetch All Content (App Init)

```bash
curl https://nimbus-api-demo.up.railway.app/mobile/sanity/all
```

### Fetch Articles

```bash
curl "https://nimbus-api-demo.up.railway.app/mobile/sanity/articles?limit=5&page=1"
```

### Fetch FAQ by Category

```bash
curl "https://nimbus-api-demo.up.railway.app/mobile/sanity/faq?category=orders"
```

---

## Changes from Previous API

| Old Endpoint | New Endpoint | Notes |
|--------------|--------------|-------|
| `/mobile/content/faq` | `/mobile/sanity/faq` | Now fetches from Sanity directly |
| `/mobile/content/products` | `/mobile/sanity/sanity-products` | Sanity products (separate from PostgreSQL) |
| `/products` | Still available | PostgreSQL products (for admin operations) |

The old `/mobile/content/*` endpoints still exist for backward compatibility but may serve PostgreSQL data. Use `/mobile/sanity/*` for guaranteed fresh Sanity content.

---

## Support

For questions about this API, contact the backend team or check the server logs for detailed error messages.
