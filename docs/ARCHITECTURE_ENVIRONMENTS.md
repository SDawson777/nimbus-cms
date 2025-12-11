# Nimbus Environments & Variables

This project uses three isolated environments:

| Environment | API Service               | DB                        | Admin SPA                  | Sanity Dataset | Auto Seed | Tenant Slug      |
| ----------- | ------------------------- | ------------------------- | -------------------------- | -------------- | --------- | ---------------- |
| **demo**    | nimbus-api-demo (Railway) | nimbus-demo-db (Postgres) | nimbus-admin-demo (Vercel) | nimbus_demo    | true      | demo-operator    |
| **preview** | nimbus-api-preview        | nimbus-preview-db         | nimbus-admin-preview       | nimbus_preview | true      | preview-operator |
| **prod**    | nimbus-api-prod           | nimbus-prod-db            | nimbus-admin-prod          | _buyer_        | false     | (none)           |

## Required API Variables

- `APP_ENV` – `demo` | `preview` | `prod`
- `DATABASE_URL` – Postgres connection string
- `SANITY_DATASET_DEFAULT` – dataset name for Sanity
- `JWT_SECRET`
- `ADMIN_SEED_ENABLED` – whether to seed control plane (true for demo/preview)
- `DEMO_TENANT_SLUG` – slug for seeded tenant
- `CORS_ORIGIN_ADMIN`, `CORS_ORIGIN_MOBILE`
- Third‑party keys: Stripe, OpenAI, Weather, Firebase, Sentry.

See `/server/src/config/env.ts` for complete list.
