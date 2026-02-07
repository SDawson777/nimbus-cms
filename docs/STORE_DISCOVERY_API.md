# Store Discovery API (v1)

Complete API contract for store search, discovery, and details for the mobile app.

**Base URL:** `https://nimbus-api-demo.up.railway.app/v1/stores`

---

## Endpoints

### 1. Search Stores (List + Map)

**`GET /v1/stores/search`**

Find stores with map pins and list results. Supports location-based search, filtering, and sorting.

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| **Location (choose one)** |
| `city` | string | - | City name (requires `state`) |
| `state` | string | - | State code (requires `city`) |
| `lat` | number | - | Latitude (requires `lng` and `radiusMi`) |
| `lng` | number | - | Longitude (requires `lat` and `radiusMi`) |
| `radiusMi` | number | 50 | Search radius in miles (1-300) |
| `bounds` | string | - | Map bounds: `swLat,swLng,neLat,neLng` |
| **Filters** |
| `q` | string | - | Text search (store name, city) |
| `openNow` | boolean | - | Filter by currently open stores |
| `recreational` | boolean | - | Filter by recreational stores |
| `medical` | boolean | - | Filter by medical stores |
| `delivery` | boolean | - | Filter by delivery-enabled stores |
| `storefront` | boolean | - | Filter by storefront/pickup stores |
| `curbside` | boolean | - | Filter by curbside pickup stores |
| `orderOnline` | boolean | - | Filter by online ordering capability |
| `amenities` | string | - | Comma-separated amenities (e.g., `accepts_credit,accepts_debit,sale`) |
| `brands` | string | - | Comma-separated brand IDs |
| `categories` | string | - | Comma-separated product categories |
| **Sorting** |
| `sort` | enum | `featured` | `featured`, `distance`, `rating`, `reviews`, `largest_menu` |
| **Pagination** |
| `page` | number | 1 | Page number (1-indexed) |
| `pageSize` | number | 20 | Results per page (1-50) |

#### Example Request

```bash
GET /v1/stores/search?city=Detroit&state=MI&delivery=true&amenities=accepts_credit,sale&sort=rating&page=1&pageSize=20
```

#### Response

```json
{
  "meta": {
    "total": 199,
    "page": 1,
    "pageSize": 20,
    "sort": "featured"
  },
  "stores": [
    {
      "id": "store-123",
      "name": "Green Fields Dispensary",
      "slug": "green-fields-dispensary",
      "address1": "1234 Main St",
      "city": "Detroit",
      "state": "MI",
      "postalCode": "48201",
      "latitude": 42.3314,
      "longitude": -83.0458,
      "phone": "(313) 555-0123",
      "logoUrl": "https://cdn.sanity.io/...",
      "brand": "Green Fields",
      "isOpenNow": true,
      "closesInMinutes": 120,
      "nextCloseAt": "2024-01-15T21:00:00.000Z",
      "isDeliveryEnabled": true,
      "isPickupEnabled": true,
      "avgRating": 4.5,
      "reviewCount": 320,
      "amenities": ["accepts_credit", "accepts_debit", "sale", "social_equity"]
    }
  ],
  "map": {
    "pins": [
      {
        "storeId": "store-123",
        "lat": 42.3314,
        "lng": -83.0458,
        "pinType": "delivery"
      }
    ]
  }
}
```

#### Store Summary Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Store unique ID |
| `name` | string | Store name |
| `slug` | string | URL-friendly slug |
| `address1` | string | Primary address |
| `city` | string | City |
| `state` | string | State code |
| `postalCode` | string | ZIP/postal code |
| `latitude` | number | Latitude coordinate |
| `longitude` | number | Longitude coordinate |
| `phone` | string | Phone number |
| `logoUrl` | string | Logo image URL |
| `brand` | string | Brand/retailer name |
| `isOpenNow` | boolean | Currently open status |
| `closesInMinutes` | number | Minutes until closing (if open) |
| `nextCloseAt` | string | ISO timestamp of next closing |
| `isDeliveryEnabled` | boolean | Delivery available |
| `isPickupEnabled` | boolean | Pickup available |
| `avgRating` | number | Average rating (0-5) |
| `reviewCount` | number | Total reviews |
| `amenities` | string[] | Available amenities |

---

### 2. Facets (Filter Counts)

**`GET /v1/stores/facets`**

Get available filters with result counts. Use this to power filter sheets and display "See N results" buttons.

#### Query Parameters

Accepts same location and filter parameters as `/search` (except the facet dimension itself).

#### Example Request

```bash
GET /v1/stores/facets?city=Detroit&state=MI&delivery=true
```

#### Response

```json
{
  "total": 199,
  "brands": [
    { "id": "710labs", "name": "710 Labs", "count": 32 },
    { "id": "cookies", "name": "Cookies", "count": 28 }
  ],
  "amenities": [
    { "key": "accepts_credit", "label": "Accepts Credit", "count": 120 },
    { "key": "accepts_debit", "label": "Accepts Debit", "count": 180 },
    { "key": "sale", "label": "Sale", "count": 45 },
    { "key": "social_equity", "label": "Social Equity", "count": 32 }
  ],
  "categories": []
}
```

#### Use Cases

- **Brand Filter Sheet**: Display chips with brand names and counts
- **Amenities Checklist**: Show checkboxes with labels and counts
- **Live Result Count**: Update "See 120 results" button text as filters change

---

### 3. Store Detail

**`GET /v1/stores/:storeId`**

Get full store details including hours, fulfillment options, gallery, and compliance info.

#### Example Request

```bash
GET /v1/stores/store-123
```

#### Response

```json
{
  "id": "store-123",
  "name": "Green Fields Dispensary",
  "slug": "green-fields-dispensary",
  "description": "Premier cannabis dispensary serving Detroit since 2018...",
  "logoUrl": "https://cdn.sanity.io/...",
  "bannerUrl": "https://cdn.sanity.io/...",
  "galleryImages": [
    "https://cdn.sanity.io/...",
    "https://cdn.sanity.io/..."
  ],
  "address1": "1234 Main St",
  "address2": "Suite 100",
  "city": "Detroit",
  "state": "MI",
  "postalCode": "48201",
  "country": "US",
  "latitude": 42.3314,
  "longitude": -83.0458,
  "phone": "(313) 555-0123",
  "email": "hello@greenfields.com",
  "timezone": "America/Detroit",
  "hours": {
    "monday": "9am-9pm",
    "tuesday": "9am-9pm",
    "wednesday": "9am-9pm",
    "thursday": "9am-9pm",
    "friday": "9am-10pm",
    "saturday": "10am-10pm",
    "sunday": "10am-8pm"
  },
  "holidayHours": [
    { "date": "2024-12-25", "hours": "Closed", "note": "Christmas Day" }
  ],
  "isOpenNow": true,
  "closesInMinutes": 120,
  "nextCloseAt": "2024-01-15T21:00:00.000Z",
  "licenseNumber": "MI-RET-123456",
  "licenseExpiry": "2025-12-31T00:00:00.000Z",
  "fulfillment": {
    "delivery": true,
    "pickup": true,
    "curbside": true,
    "orderOnline": true
  },
  "minOrderAmount": 25.00,
  "deliveryRadius": 15,
  "deliveryFee": 5.00,
  "avgRating": 4.5,
  "reviewCount": 320,
  "amenities": ["accepts_credit", "accepts_debit", "sale", "social_equity"],
  "brand": {
    "_id": "brand-123",
    "name": "Green Fields",
    "logo": "https://cdn.sanity.io/..."
  },
  "orderingUrl": "https://order.greenfields.com",
  "menuUrl": "https://menu.greenfields.com",
  "complianceFlags": []
}
```

---

### 4. Store Promotions

**`GET /v1/stores/:storeId/promos`**

Get active promotions for a specific store.

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `active` | boolean | `true` | Filter by currently active promos |

#### Example Request

```bash
GET /v1/stores/store-123/promos?active=true
```

#### Response

```json
{
  "promos": [
    {
      "_id": "promo-123",
      "title": "First-Time Customer Discount",
      "description": "Get 15% off your first order",
      "promoCode": "FIRST15",
      "discountPercent": 15,
      "discountAmount": null,
      "validFrom": "2024-01-01T00:00:00.000Z",
      "validUntil": "2024-12-31T23:59:59.000Z",
      "terms": "Valid for first-time customers only. Cannot be combined with other offers.",
      "image": "https://cdn.sanity.io/..."
    }
  ]
}
```

---

### 5. Reviews Summary

**`GET /v1/stores/:storeId/reviews/summary`**

Get review statistics for a store.

#### Example Request

```bash
GET /v1/stores/store-123/reviews/summary
```

#### Response

```json
{
  "avgRating": 4.5,
  "reviewCount": 320,
  "distribution": {
    "5": 192,
    "4": 64,
    "3": 32,
    "2": 16,
    "1": 16
  }
}
```

---

## Common Amenities

Standard amenity keys to use in filters:

- `accepts_credit` - Accepts credit cards
- `accepts_debit` - Accepts debit cards
- `atm` - ATM on-site
- `ada_accessible` - ADA accessible
- `parking` - Parking available
- `sale` - Has sales/discounts
- `social_equity` - Social equity program
- `best_of` - Best of award winner
- `loyalty_program` - Loyalty rewards program
- `first_time_discount` - First-time customer discount

---

## Integration Checklist

- [ ] **Map View**: Use `/search` with `bounds` parameter for visible map area
- [ ] **List View**: Use `/search` with `city/state` or `lat/lng/radiusMi`
- [ ] **Filter Sheet**: Use `/facets` to populate brand chips, amenities checkboxes
- [ ] **Live Counts**: Call `/facets` when filters change to update "See N results"
- [ ] **Store Detail**: Use `/:storeId` when user taps a store card
- [ ] **Hours Display**: Use `isOpenNow`, `closesInMinutes`, `nextCloseAt` for UX
- [ ] **Promotions**: Load `/:storeId/promos` on detail screen
- [ ] **Reviews**: Load `/:storeId/reviews/summary` for rating distribution

---

## Notes

- All endpoints return `null` for optional fields when not available
- Distance sorting requires `lat` and `lng` parameters
- Hours parsing supports formats: `9am-9pm`, `09:00-21:00`, `Closed`
- Timezone-aware calculations use store's `timezone` field
- Gallery images are in priority order (first = hero image)

---

## Error Handling

**404 Not Found**
```json
{
  "error": "Store not found"
}
```

**500 Internal Server Error**
```json
{
  "error": "Failed to search stores"
}
```

---

## Performance Tips

1. **Map Bounds**: Use `bounds` parameter instead of large `radiusMi` for map views
2. **Pagination**: Keep `pageSize` at 20 for optimal load times
3. **Facets**: Cache facet results for 30 seconds when filters don't change
4. **Detail**: Prefetch store detail when user hovers/focuses on store card
