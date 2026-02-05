# Mobile API Migration Guide: Switch to Live Sanity Content

> **Issue:** Mobile app is not displaying live Sanity CMS content  
> **Solution:** Update API endpoints from `/mobile/content/*` to `/mobile/sanity/*`

## Quick Fix Summary

The backend has TWO sets of mobile endpoints:

| Old Endpoint | Data Source | New Endpoint | Data Source |
|-------------|-------------|--------------|-------------|
| `/mobile/content/products` | PostgreSQL (demo seed data) | `/mobile/sanity/products` | **Live Sanity CMS** |
| `/mobile/content/faq` | PostgreSQL (demo seed data) | `/mobile/sanity/faq` | **Live Sanity CMS** |
| N/A | N/A | `/mobile/sanity/articles` | **Live Sanity CMS** |
| N/A | N/A | `/mobile/sanity/deals` | **Live Sanity CMS** |
| N/A | N/A | `/mobile/sanity/banners` | **Live Sanity CMS** |

---

## Problem Diagnosis

### Test Your Current Endpoints

```bash
# What the mobile app is probably calling now (PostgreSQL demo data):
curl https://nimbus-api-demo.up.railway.app/mobile/content/products | jq '.products[0]'

# What it SHOULD be calling (live Sanity CMS data):
curl https://nimbus-api-demo.up.railway.app/mobile/sanity/products | jq '.products[0]'
```

**If you see this difference:**
- Old endpoint returns: `{ "id": "uuid", "name": "Hybrid Vape Cart", ... }` (PostgreSQL seed data)
- New endpoint returns: `{ "_id": "product-xyz", "name": "Aero Travel Backpack", ... }` (Sanity CMS data)

Then you're hitting the wrong endpoints.

---

## Migration Steps

### Step 1: Update Base URL (if needed)

Your mobile app should already have:

```env
# .env or app.config.js
EXPO_PUBLIC_CMS_API_URL=https://nimbus-api-demo.up.railway.app
```

✅ This is correct - no change needed.

### Step 2: Update API Client Calls

#### Before (Old - PostgreSQL data):

```typescript
// ❌ OLD - Returns demo seed data from PostgreSQL
const response = await fetch(`${API_URL}/mobile/content/products`);
const data = await response.json();
// Returns: { products: [...], page: 1, limit: 20, total: 50 }
```

#### After (New - Live Sanity data):

```typescript
// ✅ NEW - Returns live Sanity CMS content
const response = await fetch(`${API_URL}/mobile/sanity/products`);
const data = await response.json();
// Returns: { products: [...] }
```

### Step 3: Update All Endpoint Paths

Replace these paths in your mobile app code:

| Find | Replace With |
|------|-------------|
| `/mobile/content/products` | `/mobile/sanity/products` |
| `/mobile/content/faq` | `/mobile/sanity/faq` |
| `/mobile/content/pages` | `/mobile/sanity/articles` |

---

## Complete API Reference

### 🚀 Recommended: Use the "All" Endpoint for App Init

```typescript
// Single request to get all content on app launch
const response = await fetch(`${API_URL}/mobile/sanity/all`);
const data = await response.json();

// Returns:
{
  articles: [...],      // Latest 10 articles
  categories: [...],    // All categories
  faqs: [...],          // All FAQ items
  banners: [...],       // Active promotional banners
  deals: [...],         // Top 5 active deals
  brands: [...],        // All brands
  theme: {...},         // Theme configuration
  effects: [...],       // Effect tags for filtering
  lastSync: "2026-02-05T10:30:00.000Z"
}
```

### Individual Endpoints

#### Products

```typescript
// GET /mobile/sanity/products
const response = await fetch(`${API_URL}/mobile/sanity/products?limit=20&page=1`);
const { products } = await response.json();

// Response format:
{
  products: [
    {
      _id: "product-xyz",
      name: "Blue Dream",
      slug: "blue-dream",
      description: "...",
      image: "https://cdn.sanity.io/...",
      price: 45.00,
      category: { name: "Flower", slug: "flower" },
      brand: { name: "Premium Farms", slug: "premium-farms" },
      effects: ["Relaxed", "Creative"],
      availability: "in-stock"
    }
  ]
}
```

#### FAQ

```typescript
// GET /mobile/sanity/faq
const response = await fetch(`${API_URL}/mobile/sanity/faq`);
const { faqs, grouped, categories } = await response.json();

// Response format:
{
  faqs: [
    {
      _id: "faq123",
      question: "What payment methods do you accept?",
      answer: "We accept cash, debit cards...",
      category: { name: "Payment", slug: "payment" }
    }
  ],
  grouped: {
    "Payment": [...],
    "Delivery": [...],
    "Legal": [...]
  },
  categories: ["Payment", "Delivery", "Legal"]
}
```

#### Articles

```typescript
// GET /mobile/sanity/articles?limit=10&page=1
const response = await fetch(`${API_URL}/mobile/sanity/articles?limit=10&page=1`);
const { articles, page, limit, total } = await response.json();

// Response format:
{
  articles: [
    {
      _id: "article-xyz",
      title: "Vaporizer Buyer's Guide",
      slug: "vaporizer-buyers-guide",
      excerpt: "Everything you need to know...",
      mainImage: "https://cdn.sanity.io/...",
      author: { name: "Alex Martinez", image: "..." },
      publishedAt: "2026-01-15T10:00:00Z"
    }
  ],
  page: 1,
  limit: 10,
  total: 42
}
```

#### Banners

```typescript
// GET /mobile/sanity/banners
const response = await fetch(`${API_URL}/mobile/sanity/banners`);
const { banners } = await response.json();

// Response format:
{
  banners: [
    {
      _id: "banner123",
      title: "Summer Sale",
      subtitle: "Up to 30% off",
      image: "https://cdn.sanity.io/...",
      link: "/deals/summer-sale",
      backgroundColor: "#FF5733",
      textColor: "#FFFFFF"
    }
  ]
}
```

#### Deals

```typescript
// GET /mobile/sanity/deals
const response = await fetch(`${API_URL}/mobile/sanity/deals`);
const { deals } = await response.json();

// Response format:
{
  deals: [
    {
      _id: "deal123",
      title: "First-Time Customer Discount",
      description: "Get 15% off your first order",
      discountType: "percentage",
      discountValue: 15,
      code: "FIRST15",
      startAt: "2026-01-01T00:00:00Z",
      endAt: "2026-12-31T23:59:59Z"
    }
  ]
}
```

#### Stores

```typescript
// GET /mobile/sanity/stores
const response = await fetch(`${API_URL}/mobile/sanity/stores`);
const { stores } = await response.json();

// Response format:
{
  stores: [
    {
      _id: "store123",
      name: "Downtown Dispensary",
      slug: "downtown-dispensary",
      address: "123 Main St",
      city: "Denver",
      state: "CO",
      phone: "(303) 555-0123",
      isActive: true
    }
  ]
}
```

#### Categories

```typescript
// GET /mobile/sanity/categories
const response = await fetch(`${API_URL}/mobile/sanity/categories`);
const { categories } = await response.json();
```

#### Brands

```typescript
// GET /mobile/sanity/brands
const response = await fetch(`${API_URL}/mobile/sanity/brands`);
const { brands } = await response.json();
```

#### Legal Documents

```typescript
// GET /mobile/sanity/legal
const response = await fetch(`${API_URL}/mobile/sanity/legal`);
const { legal } = await response.json();

// Or get specific document:
// GET /mobile/sanity/legal/privacy
// GET /mobile/sanity/legal/terms
```

#### Theme Configuration

```typescript
// GET /mobile/sanity/theme
const response = await fetch(`${API_URL}/mobile/sanity/theme`);
const { theme } = await response.json();

// Response:
{
  theme: {
    primaryColor: "#3F7AFC",
    secondaryColor: "#10B981",
    backgroundColor: "#FFFFFF",
    textColor: "#111827",
    logo: "https://cdn.sanity.io/...",
    darkModeEnabled: true
  }
}
```

---

## Testing Checklist

### Backend Verification

```bash
# 1. Test the /all endpoint
curl https://nimbus-api-demo.up.railway.app/mobile/sanity/all | jq 'keys'

# 2. Test articles
curl https://nimbus-api-demo.up.railway.app/mobile/sanity/articles?limit=3 | jq '.articles | length'

# 3. Test products
curl https://nimbus-api-demo.up.railway.app/mobile/sanity/products | jq '.products | length'

# 4. Test FAQ
curl https://nimbus-api-demo.up.railway.app/mobile/sanity/faq | jq '.faqs | length'

# 5. Test banners
curl https://nimbus-api-demo.up.railway.app/mobile/sanity/banners | jq '.banners | length'
```

All should return data (not empty arrays).

### Mobile App Verification

1. ✅ Update all API calls to use `/mobile/sanity/*` endpoints
2. ✅ Test app with cleared cache
3. ✅ Verify data updates when you change content in Sanity Studio
4. ✅ Check that images load from `cdn.sanity.io`

---

## Troubleshooting

### Issue: Still seeing demo/seed data

**Cause:** Mobile app is still calling old `/mobile/content/*` endpoints

**Fix:** 
```typescript
// Search your codebase for:
grep -r "/mobile/content" src/

// Replace with:
/mobile/sanity
```

### Issue: Data structure doesn't match

**Old format (PostgreSQL):**
```json
{
  "id": "uuid-here",
  "name": "Product Name",
  "brand": "Brand Name"
}
```

**New format (Sanity):**
```json
{
  "_id": "product-slug",
  "name": "Product Name",
  "brand": {
    "name": "Brand Name",
    "slug": "brand-slug"
  }
}
```

**Fix:** Update your TypeScript interfaces/types to match the new Sanity structure.

### Issue: Empty response `{ products: [] }`

**Possible causes:**
1. Sanity Studio doesn't have published content
2. Network/CORS issue
3. API deployment hasn't updated

**Debug:**
```bash
# Check if backend has data:
curl https://nimbus-api-demo.up.railway.app/mobile/sanity/products | jq '.'

# Check Sanity Studio directly:
# Open https://nimbus-cms.sanity.studio and verify published products exist
```

### Issue: Images not loading

**Cause:** Sanity images need to be queried with `.asset->url`

**Fix:** Backend already handles this - images should be full URLs like:
```
https://cdn.sanity.io/images/ygbu28p2/nimbus_demo/abc123...
```

If you see `null` or `{}` instead, the content in Sanity may not have images uploaded.

---

## Response Format Differences

### Key Changes

| Field | Old (PostgreSQL) | New (Sanity) |
|-------|-----------------|--------------|
| ID | `id` (UUID) | `_id` (string) |
| Updated | `updatedAt` | `_updatedAt` |
| References | String/ID | Object with details |
| Images | `image` (URL string or null) | `image` (full CDN URL or null) |

### Example: Product Response Comparison

#### Old (PostgreSQL):

```json
{
  "id": "3429a29d-8836-47b6-96d8-cf38416abc9f",
  "name": "Relief Topical Cream",
  "brand": "Wellness Co",
  "category": "Topical",
  "price": 40,
  "image": null
}
```

#### New (Sanity):

```json
{
  "_id": "product-relief-cream",
  "name": "Relief Topical Cream",
  "slug": "relief-topical-cream",
  "brand": {
    "name": "Wellness Co",
    "slug": "wellness-co"
  },
  "category": {
    "name": "Topical",
    "slug": "topical"
  },
  "price": 40,
  "image": "https://cdn.sanity.io/images/...",
  "_updatedAt": "2026-02-01T15:30:00Z"
}
```

---

## Code Example: Full Migration

### Before:

```typescript
// api/products.ts
export async function fetchProducts() {
  const response = await fetch(
    `${process.env.EXPO_PUBLIC_CMS_API_URL}/mobile/content/products`
  );
  const data = await response.json();
  
  return data.products.map(product => ({
    id: product.id,
    name: product.name,
    brand: product.brand, // String
    price: product.price,
    image: product.image
  }));
}
```

### After:

```typescript
// api/products.ts
export async function fetchProducts() {
  const response = await fetch(
    `${process.env.EXPO_PUBLIC_CMS_API_URL}/mobile/sanity/products`
  );
  const data = await response.json();
  
  return data.products.map(product => ({
    id: product._id,              // Changed
    name: product.name,
    brand: product.brand?.name,   // Changed - now an object
    brandSlug: product.brand?.slug,
    price: product.price,
    image: product.image,
    category: product.category?.name,
    updatedAt: product._updatedAt // Changed
  }));
}
```

---

## Support

### Still not working?

1. **Check deployment:** Confirm Railway deployment includes the latest code
   ```bash
   curl https://nimbus-api-demo.up.railway.app/webhooks/health
   ```
   Should show endpoints including `/mobile/sanity/*`

2. **Check Sanity data:** Log into Sanity Studio and verify:
   - Products are published (not drafts)
   - Content has all required fields
   - Images are uploaded

3. **Enable debug logging in mobile app:**
   ```typescript
   const response = await fetch(url);
   console.log('API Response:', await response.text());
   ```

4. **Contact backend team** with:
   - Endpoint you're calling
   - Full response you're receiving
   - Expected vs actual behavior

---

## Documentation

- Full API docs: [MOBILE_SANITY_API.md](./MOBILE_SANITY_API.md)
- Architecture: [CMS_ARCHITECTURE_AUDIT.md](../CMS_ARCHITECTURE_AUDIT.md)
