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

## Dry Run Restore Procedure (Checklist)

Use this checklist for a repeatable restore drill. Record the outcome in `docs/DRY_RUN_RESTORE_LOG.md`.

### Dry Run Restore Procedure

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
