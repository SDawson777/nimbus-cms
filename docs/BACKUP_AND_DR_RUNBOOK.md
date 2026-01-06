# Backup and DR Runbook (CMS Source of Truth)

## Scope

- Postgres backups (Railway or your DB host)
- Sanity dataset export/import (DEMO + PROD)
- Restore drills (non-prod)

## Postgres Backups (Railway)

For each database (DEMO + PROD):

- Enable automated backups
  - Minimum: daily
  - Preferred: hourly (exceeds expectations)
- Retention: 7–30 days (choose based on cost)

**Proof artifacts (you will attach screenshots):**

- Screenshot: backup schedule
- Export: backup policy/config JSON if your provider supports it

## Sanity Dataset Backups

### One-shot export (CLI)

This repo already exposes:

- `pnpm sanity:dataset:export`
- `pnpm sanity:dataset:import`

For buyer-facing DR, use the convenience wrappers added here:

- `pnpm sanity:export-demo`
- `pnpm sanity:import-demo-restore -- ./backups/sanity/<file>.tar.gz`

Exports are written to `./backups/sanity/` by default.

### Storage guidance

Do NOT commit `.tgz/.tar.gz` exports.

Store exports in one of:

- S3 (recommended)
- GCS
- Backblaze

## Restore Drill (Dry Run)

1. Export the demo dataset.
2. Import into a new dataset (example: `demo-restore`).
3. Open Studio against the restore dataset and validate:
   - Studio loads
   - Document counts are reasonable (#products/#articles/etc)
4. Record the drill in `docs/DRY_RUN_RESTORE_LOG.md`.

## Disaster Recovery Steps (High Level)

- Identify outage type (DB vs Sanity vs deploy)
- Restore the last known-good DB snapshot (or failover)
- Restore Sanity dataset from last export if needed
- Re-point environment variables:
  - API `DATABASE_URL`
  - Studio/admin dataset vars
- Validate:
  - `/healthz` is 200
  - `/ready` is 200
  - Key user journeys work
