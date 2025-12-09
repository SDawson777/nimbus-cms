# Nimbus Demo Database Seed Kit

⚠️ **DEMO/PREVIEW ENVIRONMENTS ONLY — NEVER RUN AGAINST PRODUCTION**

## Overview

This seed kit provides a complete demo dataset for Nimbus Cloud, including:
- Multi-tenant setup (Tenant, Store, Theme, FeatureFlags)
- Demo user with preferences and loyalty status
- Product catalog with variants and inventory
- Sample content (Articles, ContentPages, LegalPages)
- Synthetic analytics data (UserEvents, JournalEntries, Reviews)

## Usage

### Seed Demo Data (Without Reset)

```bash
cd server
DATABASE_URL=<demo-db-url> npm run db:seed:demo
```

### Full Reset + Seed

```bash
cd server
DATABASE_URL=<demo-db-url> npm run db:reset:demo
```

**Note:** The `db:reset:demo` command will:
1. Drop all tables
2. Reapply all migrations
3. Run the seed script

## Demo Credentials

After seeding, the following demo data is available:

- **User Email:** `demo@nimbuscloud.app`
- **User Phone:** `+15555550123`
- **Password Hash:** Demo only (not production-ready)

## Demo Store

- **Store Name:** Nimbus Demo Dispensary
- **Store Slug:** `nimbus-demo-dispensary`
- **Tenant:** `demo-tenant` (Nimbus Demo Tenant)

## Demo Products

1. **Nimbus OG** (Flower)
   - 3.5g variant ($45.00)
   - 7g variant ($80.00)

2. **Nimbus Gummy Flight** (Edible)
   - 10-pack variant ($25.00)

3. **Nimbus Live Resin** (Concentrate)
   - 1g variant ($60.00)

## Demo Features

- **Loyalty Status:** Gold tier with 420 points
- **Badges:** Early Adopter, Weekend Warrior, Connoisseur
- **Journal Entries:** 3 sample entries
- **User Events:** 5 sample events (login, product views, checkout)
- **Reviews:** 1 sample review
- **Articles:** 2 published articles
- **System Banner:** Demo welcome message

## Environment-Specific URLs

### Demo
```bash
DATABASE_URL=postgresql://postgres:YRXSqaJORvZekgVVNjySKzrrKCvRaYDY@switchyard.proxy.rlwy.net:54142/railway
```

### Preview
```bash
DATABASE_URL=postgresql://postgres:hGVNYlBcOYGMiITZkRARpcPfAmGSYTjB@ballast.proxy.rlwy.net:26363/railway
```

### Production
⚠️ **NEVER RUN SEED SCRIPTS AGAINST PRODUCTION**

## Safety Guards

The seed script includes:
- Clear warning messages
- `NODE_ENV=development` requirement
- Explicit "DEMO ONLY" warnings in code and output

## File Structure

```
server/
├── package.json              # Added db:seed:demo and db:reset:demo scripts
└── prisma/
    └── seed-demo.cjs         # Demo seed script
```

## Troubleshooting

### Cross-env Not Found

Install the dependency:
```bash
cd server
npm install --save-dev cross-env
```

### Permission Denied

Ensure you're using the correct DATABASE_URL for the demo/preview environment.

### Foreign Key Errors

The seed script clears data in dependency-safe order. If you encounter foreign key errors, use the full reset:
```bash
DATABASE_URL=<demo-db-url> npm run db:reset:demo
```
