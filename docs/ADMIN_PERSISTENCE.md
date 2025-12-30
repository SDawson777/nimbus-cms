# Admin persistence (enterprise)

By default, demo environments store admin users in a file (`server/config/admins.json`) to keep previews simple. For enterprise deployments, switch to Prisma/Postgres to store admin users in a relational database with proper durability and auditing.

## Schema

The Prisma schema defines an `AdminUser` model and `AdminRole` enum:

```prisma
enum AdminRole {
  OWNER
  ORG_ADMIN
  EDITOR
  VIEWER
}

model AdminUser {
  id               String    @id @default(uuid())
  email            String    @unique
  passwordHash     String?
  role             AdminRole @default(EDITOR)
  organizationSlug String?
  brandSlug        String?
  storeSlug        String?
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt
}
```

This is already included in `prisma/schema.prisma`.

## Migrations

1. Set `DATABASE_URL` in your environment (e.g., Railway, Render, Kubernetes secret):
   - `DATABASE_URL=postgresql://user:password@host:5432/nimbus`.
2. Create and apply the migration locally:

```bash
# from repo root
npm --prefix server run build # optional: ensures TS types are fresh
npx prisma migrate dev --name add_admin_user --schema prisma/schema.prisma
```

3. In CI/CD or production, apply migrations:

```bash
npx prisma migrate deploy --schema prisma/schema.prisma
```

4. Generate Prisma client (already done via `postinstall`):

```bash
npm --prefix server install
```

If `prisma generate` was skipped during install in your environment, run it manually from the repo root:

```bash
npm --prefix server run prisma:generate
# or
npx prisma generate --schema prisma/schema.prisma
```

## Enable Prisma-backed store

Set:

- `DATABASE_URL` to your Postgres connection
- `ADMIN_STORE=prisma`

The `server` auto-selects Prisma when a DB URL is present; explicitly setting `ADMIN_STORE=prisma` ensures the DB-backed store is used.

## API behavior

- Admin management routes are under `/api/admin/users/*` and protected by `requireAdmin` + `requireRole("ORG_ADMIN")`.
- The server chooses the store implementation at runtime. If Prisma initialization fails, it falls back to file-backed storage and logs a warning.

## Seeding test admins

For e2e tests or local previews, you can still use the file-backed seeder:

```bash
npm --prefix server run seed:e2e
```

For DB-backed storage, seed via Prisma:

```bash
# Recommended: use the included server Prisma admin seeder which upserts an AdminUser.
# From the repo root:

npm --prefix server run seed:admin

# (This runs `server/prisma/seedAdmin.ts` via ts-node and will create/update the
# admin user defined by ADMIN_EMAIL/ADMIN_PASSWORD in env.)

# Alternatively you can run a compiled JS seeder in production if you build first:
node server/dist/prisma/seedAdmin.js
```

## Auditing and SSO

- The `AdminUser` table supports role assignment and basic scoping fields. For full enterprise SSO (OIDC/SAML), integrate your IdP and map IdP groups/claims to roles at login; store a linkage from external subject (`sub`) to `AdminUser.id` if desired.
- For audit trails, add an `AdminAudit` table capturing `adminId`, `action`, `target`, and timestamps.
