# Multi-tenant architecture overview

This document explains the **organization → brand → store** hierarchy used in **Nimbus Cannabis OS CMS** and how to onboard new customers in a multi-tenant environment.

---

## Tenancy model

Nimbus Cannabis OS CMS supports a three-tier multi-tenant hierarchy:

```
Organization (Tenant)
  └── Brand(s)
       └── Store(s)
```

### Organization (Tenant)

An **organization** represents the top-level customer entity. Each organization can have multiple brands.

**Example:**

- Org slug: `acme-cannabis`
- Display name: "Acme Cannabis Co."

### Brand

A **brand** represents a sub-brand or product line within an organization. Each brand can have multiple stores.

**Example:**

- Org: `acme-cannabis`
- Brand slug: `acme-premium`
- Display name: "Acme Premium"

### Store

A **store** represents a physical retail location or online storefront. Each store belongs to a brand.

**Example:**

- Org: `acme-cannabis`
- Brand: `acme-premium`
- Store slug: `store-downtown`
- Display name: "Downtown Dispensary"
- Address: "123 Main St, Denver, CO 80202"

---

## Sanity document structure

In Sanity Studio, tenancy is represented by three document types:

### `organization`

```json
{
  "_type": "organization",
  "_id": "org-acme-cannabis",
  "slug": "acme-cannabis",
  "displayName": "Acme Cannabis Co.",
  "contactEmail": "support@acme-cannabis.com"
}
```

### `brand`

```json
{
  "_type": "brand",
  "_id": "brand-acme-premium",
  "slug": "acme-premium",
  "displayName": "Acme Premium",
  "organization": {
    "_type": "reference",
    "_ref": "org-acme-cannabis"
  }
}
```

### `store`

```json
{
  "_type": "store",
  "_id": "store-downtown",
  "slug": "store-downtown",
  "displayName": "Downtown Dispensary",
  "address": "123 Main St, Denver, CO 80202",
  "hours": "Mon-Fri 9AM-9PM, Sat-Sun 10AM-8PM",
  "timezone": "America/Denver",
  "brand": {
    "_type": "reference",
    "_ref": "brand-acme-premium"
  }
}
```

---

## Theme scoping

Themes are scoped to **brand** or **store** level using deterministic `_id` patterns.

### Brand-level theme

```json
{
  "_type": "themeConfig",
  "_id": "themeConfig-acme-premium",
  "primaryColor": "#1B5E3A",
  "secondaryColor": "#A4D96C",
  "logo": {
    "_type": "image",
    "asset": {
      "_ref": "image-abc123"
    },
    "alt": "Acme Premium logo"
  }
}
```

### Store-level theme override

```json
{
  "_type": "themeConfig",
  "_id": "themeConfig-acme-premium-store-downtown",
  "primaryColor": "#2C3E50",
  "secondaryColor": "#E74C3C",
  "logo": {
    "_type": "image",
    "asset": {
      "_ref": "image-xyz789"
    },
    "alt": "Downtown Dispensary logo"
  }
}
```

**Resolution order:**

1. Store-level theme (`themeConfig-<brand>-store-<store>`)
2. Brand-level theme (`themeConfig-<brand>`)
3. Global default (no brand/store)

---

## RBAC and scoping

Nimbus CMS enforces **role-based access control (RBAC)** with tenant scoping.

### Roles

- `OWNER` – Full access to all orgs/brands/stores
- `ORG_ADMIN` – Admin for a specific org and all its brands/stores
- `BRAND_ADMIN` – Admin for a specific brand and its stores
- `STORE_MANAGER` – Manager for a specific store
- `EDITOR` – Can edit content (articles, FAQs, legal docs)
- `VIEWER` – Read-only access

### Scope enforcement

API endpoints validate that the authenticated user has permission to access the requested org/brand/store.

**Example:**

A user with role `BRAND_ADMIN` for `acme-premium` can:

- Edit `themeConfig-acme-premium`
- Edit stores under `acme-premium`
- Upload logos scoped to `acme-premium`

But **cannot:**

- Edit themes for other brands (e.g., `acme-economy`)
- Access org-level settings for `acme-cannabis`

See [RBAC_MATRIX.md](./RBAC_MATRIX.md) for detailed endpoint × role coverage.

---

## Content scoping

Content documents (articles, FAQs, legal docs) can be scoped to org/brand/store.

### Global content

Content with no `org`, `brand`, or `store` reference is available to all tenants.

**Example:**

```json
{
  "_type": "article",
  "title": "What is CBD?",
  "slug": "what-is-cbd"
}
```

### Brand-scoped content

Content scoped to a brand is only visible to that brand's stores.

**Example:**

```json
{
  "_type": "article",
  "title": "Acme Premium Product Line",
  "slug": "acme-premium-products",
  "brand": {
    "_type": "reference",
    "_ref": "brand-acme-premium"
  }
}
```

### Store-scoped content

Content scoped to a store is only visible to that store.

**Example:**

```json
{
  "_type": "faqItem",
  "question": "What are your store hours?",
  "answer": "Mon-Fri 9AM-9PM, Sat-Sun 10AM-8PM",
  "store": {
    "_type": "reference",
    "_ref": "store-downtown"
  }
}
```

---

## Onboarding a new customer

Follow these steps to onboard a new customer in a multi-tenant deployment:

### 1. Create Sanity dataset (optional)

For true data isolation, create a separate Sanity dataset per customer:

```bash
sanity dataset create brand-acme
```

Update `.env`:

```bash
SANITY_DATASET=brand-acme
```

### 2. Create organization document

In Sanity Studio:

1. Navigate to **Organizations**.
2. Click **Create new**.
3. Fill in:
   - Slug: `acme-cannabis`
   - Display name: "Acme Cannabis Co."
   - Contact email: `support@acme-cannabis.com`
4. Publish.

### 3. Create brand document(s)

1. Navigate to **Brands**.
2. Click **Create new**.
3. Fill in:
   - Slug: `acme-premium`
   - Display name: "Acme Premium"
   - Organization: Select `acme-cannabis`
4. Publish.

### 4. Create store document(s)

1. Navigate to **Stores**.
2. Click **Create new**.
3. Fill in:
   - Slug: `store-downtown`
   - Display name: "Downtown Dispensary"
   - Address: "123 Main St, Denver, CO 80202"
   - Hours: "Mon-Fri 9AM-9PM, Sat-Sun 10AM-8PM"
   - Timezone: "America/Denver"
   - Brand: Select `acme-premium`
4. Publish.

### 5. Create brand-level theme

1. Navigate to **Theme Configs**.
2. Click **Create new**.
3. Set `_id`: `themeConfig-acme-premium` (important for deterministic resolution).
4. Fill in colors:
   - Primary color: `#1B5E3A`
   - Secondary color: `#A4D96C`
   - Accent color: `#4BAF75`
5. Upload logo asset and set alt text.
6. Publish.

### 6. Create legal documents

For each required legal doc type:

1. Navigate to **Legal Documents**.
2. Create documents for:
   - `type: 'terms'` – Terms of Service
   - `type: 'privacy'` – Privacy Policy
   - `type: 'accessibility'` – Accessibility Statement
   - `type: 'ageGate'` – Age verification
3. Set `effectiveFrom` date (today).
4. Set `stateCode` if state-specific.
5. Publish.

### 7. Provision admin users

Create JWT tokens for admin users with appropriate roles:

- `OWNER` – full access (your internal team)
- `ORG_ADMIN` – customer's org admin
- `BRAND_ADMIN` – customer's brand admin
- `STORE_MANAGER` – store manager

See [RBAC_MATRIX.md](./RBAC_MATRIX.md) for role details.

### 8. Test customer endpoints

- `/content/theme?brand=acme-premium` → returns Acme theme
- `/content/theme?brand=acme-premium&store=store-downtown` → returns store override (if exists)
- `/content/articles?brand=acme-premium` → returns brand-scoped articles
- `/content/faq?store=store-downtown` → returns store-scoped FAQs

---

## Multi-dataset vs. single-dataset

### Single dataset (simpler)

- All tenants share one Sanity dataset (e.g., `main`).
- Content is scoped via `organization`, `brand`, `store` references.
- Easier to manage (one Studio, one dataset).
- **Use case:** Small to medium deployments (< 10 brands).

### Multi-dataset (isolated)

- Each tenant has a separate Sanity dataset (e.g., `brand-acme`, `brand-greenleaf`).
- True data isolation (no risk of cross-tenant leaks).
- Requires separate Studio deployments or dataset switching.
- **Use case:** Large enterprise deployments, regulated industries, or SaaS with hundreds of tenants.

---

## Dataset switching strategies

### Option 1: Subdomain routing

Route requests based on subdomain:

- `acme.cms.example.com` → dataset: `brand-acme`
- `greenleaf.cms.example.com` → dataset: `brand-greenleaf`

**Implementation:**

Update `server/src/lib/sanity.ts` to resolve dataset from request hostname.

### Option 2: Query parameter

Pass dataset in query param:

- `/content/theme?dataset=brand-acme`

**Implementation:**

Middleware resolves `req.query.dataset` and initializes Sanity client dynamically.

### Option 3: JWT claim

Encode dataset in JWT token claim (`scope.dataset`).

**Implementation:**

Decode JWT and use `scope.dataset` to initialize Sanity client per request.

---

## Best practices

- **Always scope uploads** – logos, assets, and personalization rules must be scoped to a brand or store.
- **Enforce RBAC** – never allow cross-tenant access; always validate JWT scope against requested org/brand/store.
- **Test theme resolution** – verify store-level overrides take precedence over brand-level themes.
- **Monitor compliance** – run `/api/admin/compliance/overview` regularly to detect missing legal docs.
- **Use deterministic IDs** – always use `themeConfig-<brand>` or `themeConfig-<brand>-store-<store>` for idempotent upserts.

---

## Troubleshooting

### Theme not loading

- Verify `themeConfig` document exists with correct `_id` pattern.
- Check `/content/theme?brand=your-brand` returns expected JSON.
- Ensure logo asset is published and has `alt` text.

### Content not scoped correctly

- Verify `brand` or `store` reference is set on content documents.
- Check GROQ queries in `/server/src/routes/content/` filter by brand/store.

### RBAC errors

- Verify JWT token includes `scope.brand` or `scope.store` claims.
- Check middleware `ensureBrandScope` / `ensureStoreScope` logic.
- See [RBAC_MATRIX.md](./RBAC_MATRIX.md) for endpoint requirements.

---

**Questions?** Refer to:

- [WHITE_LABEL_SETUP.md](./WHITE_LABEL_SETUP.md) – white-label customization
- [REBRANDING_CHECKLIST.md](./REBRANDING_CHECKLIST.md) – deployment checklist
- [RBAC_MATRIX.md](./RBAC_MATRIX.md) – access control matrix
- [ARCHITECTURE.md](./ARCHITECTURE.md) – system architecture
