# Backup and Disaster Recovery Runbook

This runbook is written for an acquiring team to operate Nimbus CMS without prior context. It covers **Postgres backups** (typical host: Railway), **Sanity dataset export/import**, and a repeatable **restore drill**.

## What This System Stores Where

- **Postgres**: operational data (tenants, stores, users, products, orders, loyalty, etc.)
- **Sanity**: CMS content (brand/store docs, theme config, deals, articles, FAQs, legal docs, etc.)

In a real outage you may need to restore **one** or **both**.

## Definitions (RPO / RTO)

- **RPO (Recovery Point Objective)**: how much data loss is acceptable (e.g., “up to 24 hours”).
- **RTO (Recovery Time Objective)**: how quickly service must be restored (e.g., “within 60 minutes”).

Choose RPO/RTO per environment:

- **Demo**: typically looser (e.g., daily RPO)
- **Production**: tighter (often hourly or better)

## Postgres Backups (Typical Host: Railway)

### Conceptual Model (Railway)

Railway-managed Postgres generally provides:

- **Daily automatic backups** (provider-managed snapshots)
- A UI to **restore** the database from a snapshot to a point-in-time (depending on plan/host features)

Even when Railway provides backups, we still recommend a **secondary backup** strategy for enterprise needs (see “Hourly recommendation”).

### Minimum Standard (Daily)

For each Postgres environment (Demo + Production):

1. Verify **daily automatic backups** are enabled.
2. Confirm **retention** meets business needs (commonly 7–30 days).
3. Confirm who has access to restore operations (least privilege + break-glass).

### Recommendation (Hourly) — Enterprise Requirement

If you require an RPO better than 24 hours (or must be independent of the host), implement **hourly logical backups**:

- Run `pg_dump` hourly via a scheduler (GitHub Actions, cron on a worker, or a managed job runner).
- Encrypt at rest (S3 SSE, GCS KMS, etc.).
- Retain at least 7–30 days.
- Test restores monthly.

Example `pg_dump` (conceptual):

```bash
DATE=$(date -u +%Y%m%dT%H%M%SZ)
pg_dump -Fc --no-acl --no-owner "$DATABASE_URL" > "pgdump-${DATE}.dump"
```

## Sanity Dataset Backups

Sanity backups are performed by exporting a dataset to a `.tar.gz` using the Sanity CLI.

### Prerequisites

You need:

- `SANITY_PROJECT_ID`
- A dataset name (Demo is typically `nimbus_demo`)
- A token with permissions to export/import datasets (`SANITY_API_TOKEN` or equivalent)

This repo includes Sanity CLI access via the Studio workspace.

### Export a Sanity Dataset (CLI)

**Demo dataset export (`nimbus_demo`)**:

```bash
mkdir -p backups/sanity
DATE=$(date -u +%Y-%m-%d)
pnpm -C apps/studio exec sanity dataset export nimbus_demo "../../backups/sanity/nimbus_demo-${DATE}.tar.gz"
```

Notes:

- The output path is relative to `apps/studio/` because the command runs there.
- Do **not** commit exports to git.

This repo also provides a convenience wrapper:

```bash
pnpm sanity:export-demo
```

### Import a Dataset into a New Dataset Name (Restore Drill)

Restores should be done into a **new dataset name** (never overwrite the live demo/production dataset during a drill).

Example: import the demo export into `nimbus_demo_restore`:

```bash
pnpm -C apps/studio exec sanity dataset import "../../backups/sanity/nimbus_demo-YYYY-MM-DD.tar.gz" nimbus_demo_restore --replace
```

Tips:

- If the dataset doesn’t exist, create it first in the Sanity dashboard or via CLI (depending on your permissions).
- Use `--replace` only for non-production drills.

## Postgres Restore Steps

### From Railway Snapshot (Fastest)

1. Log into Railway dashboard.
2. Navigate to your Postgres service.
3. Go to **Backups** or **Snapshots** section.
4. Select the snapshot closest to your desired recovery point.
5. Click **Restore** (typically creates a new database instance or overwrites the existing one).
6. Update `DATABASE_URL` in your API deployment to point at the restored database.
7. Restart the API service.

### From `pg_dump` Backup (Custom/Hourly)

If you've implemented hourly `pg_dump` backups (recommended for enterprise):

1. **Identify the backup file**:
   ```bash
   ls -lh s3://your-bucket/postgres-backups/ | grep "pgdump-"
   ```

2. **Download the backup**:
   ```bash
   aws s3 cp s3://your-bucket/postgres-backups/pgdump-20260107T120000Z.dump ./restore.dump
   ```

3. **Restore to a new database** (do NOT restore directly to production during first attempt):
   ```bash
   # Create a new empty database (example: nimbus_restore)
   psql "$POSTGRES_ADMIN_URL" -c "CREATE DATABASE nimbus_restore;"
   
   # Restore the dump
   pg_restore -d "postgres://user:pass@host:port/nimbus_restore" --no-acl --no-owner restore.dump
   ```

4. **Validate the restored database**:
   - Check row counts: `SELECT COUNT(*) FROM "Tenant";` (and other key tables).
   - Verify recent records exist.

5. **Point your API at the restored database**:
   - Update `DATABASE_URL` to the restore database.
   - Run Prisma migrations if needed: `pnpm prisma migrate deploy`.
   - Restart the API.

6. **Promote to production** (if validation passes):
   - Option A: Rename databases (swap `nimbus_restore` → `nimbus_production`).
   - Option B: Update `DATABASE_URL` permanently.

## Dry Run Restore Procedure (Checklist)

Use this checklist for a repeatable restore drill. Record the outcome in `docs/DRY_RUN_RESTORE_LOG.md`.

### Postgres Restore Drill

1. **Export a recent `pg_dump` backup** (or use an existing one).
2. **Create a temporary database**: `nimbus_restore_drill`.
3. **Restore the dump** into the temporary database (see steps above).
4. **Run validation queries**:
   ```sql
   SELECT COUNT(*) FROM "Tenant";
   SELECT COUNT(*) FROM "Store";
   SELECT COUNT(*) FROM "Order";
   SELECT MAX("createdAt") FROM "Order"; -- verify recent data
   ```
5. **Spin up a test API instance** pointing at `nimbus_restore_drill`.
6. **Test critical endpoints**:
   - `GET /healthz` → 200
   - `GET /ready` → 200
   - `POST /admin/login` → successful login
   - `GET /api/admin/orders?tenant=tenant-a` → returns orders
7. **Log the drill** in `docs/DRY_RUN_RESTORE_LOG.md`:
   - date/time, operator, backup filename, database name, pass/fail, issues, follow-ups.
8. **Clean up**: drop `nimbus_restore_drill` database after validation.

### Sanity Restore Drill

1. **Choose the source dataset**: `nimbus_demo` (or production).
2. **Export Sanity dataset** to `backups/sanity/` (see export command above).
3. **Create a restore target dataset** (example): `nimbus_demo_restore`.
4. **Import** the export into the restore target dataset (see import command above).
5. **Point Studio** at the restore dataset temporarily:
   - Set `SANITY_STUDIO_DATASET=nimbus_demo_restore` (or equivalent in your deployment).
6. **Validate content exists**:
   - Brand/store docs load
   - Theme config resolves
   - Deals/articles/FAQs/legal docs render
7. **Validate API readiness** (if the API uses Sanity in readiness checks):
   - `GET /healthz` returns 200
   - `GET /ready` returns 200
8. **Roll back** Studio (and any clients) to the original dataset.
9. **Log the drill** in `docs/DRY_RUN_RESTORE_LOG.md`:
   - date/time, operator, export filename, target dataset, pass/fail, issues, follow-ups.

## Verification Steps for Restored Environments

After restoring either Postgres or Sanity (or both), verify the environment is fully operational:

### API Health Checks

```bash
# Liveness (always returns 200 if server is up)
curl -i http://localhost:8080/healthz

# Readiness (checks DB + Sanity connectivity)
curl -i http://localhost:8080/ready
```

Expected: both return `200 OK`.

### Admin Login Test

```bash
# Login with E2E admin credentials (or a known admin)
curl -i -X POST http://localhost:8080/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"e2e-admin@example.com","password":"e2e-password"}'
```

Expected: `200 OK` with `Set-Cookie: admin_token=...` and `Set-Cookie: admin_csrf=...`.

### Database Query Test

```bash
# Check that tenant data is present
curl -i http://localhost:8080/api/admin/tenants \
  -H "Cookie: admin_token=<TOKEN_FROM_LOGIN>" \
  -H "X-CSRF-Token: <CSRF_FROM_LOGIN>"
```

Expected: JSON array of tenants.

### Sanity Content Test

```bash
# Fetch a known brand/store document from Sanity (via API)
curl -i http://localhost:8080/api/content/brands
```

Expected: JSON array of brands/stores (depending on your API routes).

### End-to-End Test (Admin UI)

1. Open Admin SPA: `http://localhost:8080/admin` (if served by API) or Vercel URL.
2. Log in with admin credentials.
3. Navigate to **Dashboard** → verify metrics load.
4. Navigate to **Orders** → verify orders list loads.
5. Navigate to **Settings** → verify theme/personalization loads.

### Sanity Studio Test

1. Open Studio: `http://localhost:3333` (local) or Vercel URL.
2. Verify brand/store documents are visible.
3. Create a test document (e.g., a new article).
4. Publish it.
5. Verify the document appears in the API (if applicable).

### Log the Results

Record all test results in `docs/DRY_RUN_RESTORE_LOG.md`:

- Date/time of drill
- Operator name
- Backup files used (Postgres dump filename, Sanity export filename)
- Target environment (restore database name, restore dataset name)
- Pass/fail for each verification step
- Issues encountered
- Follow-up actions

## Disaster Recovery: Practical Recovery Steps

When there is an incident, use this sequence:

1. **Identify the failure domain**:
  - API deployment issue
  - Postgres unavailable/corrupted
  - Sanity unavailable/corrupted
2. **Restore Postgres** (if needed):
  - Restore from Railway snapshot (fastest), or
  - Restore from your hourly `pg_dump` backups (if configured)
3. **Restore Sanity dataset** (if needed):
  - Export/Import workflow into a new dataset
  - Re-point dataset environment variables to the restored dataset
4. **Re-point runtime configuration**:
  - API: `DATABASE_URL`, `SANITY_DATASET_DEFAULT`
  - Admin SPA / Studio: dataset vars as needed
5. **Validate service**:
  - `GET /healthz` is 200
  - `GET /ready` is 200
  - Admin login works
  - Key content endpoints return data

## Storage & Security Requirements

- Do not commit secrets or exports (`.tar.gz`, `.dump`) to git.
- Store backup artifacts in managed object storage (S3/GCS) with:
  - encryption at rest
  - access logging
  - least-privilege access
- Keep separate retention policies for Demo vs Production.
