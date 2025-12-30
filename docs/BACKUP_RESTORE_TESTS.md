# Backup & Restore Test (CI)

This document describes the CI job and local script used to validate backup restore procedures for Sanity and Postgres test environments.

## Purpose
- Provide a reproducible CI job that will validate the ability to restore backups into a test environment (Sanity dataset + Postgres) to validate DR and migration procedures.

## CI job
- Workflow: `.github/workflows/ci.yml` — job name: `backup_restore_test`.
- Trigger: `workflow_dispatch` (manual) and `schedule` only. This prevents accidental runs on every PR.
- Dependencies: job depends on `vuln_scan` (so dependency issues are checked first).
- The job runs `scripts/backup_restore_test.sh` and requires the following secrets to be configured in GitHub Actions:

Required secrets (create these in repository `Settings -> Secrets`):
- `SANITY_ADMIN_TOKEN` — an admin token for the Sanity project used for test imports.
- `SANITY_EXPORT_TARBALL_URL` (optional) — a pre-generated export tarball URL for importing data into a test dataset. If not provided, Sanity restore is skipped.
- `POSTGRES_TEST_URL` — Postgres connection string (e.g. `postgresql://user@host:5432/dbname`).
- `POSTGRES_DUMP_URL` (optional) — URL to a Postgres dump (plain SQL or custom dump). If not provided, Postgres restore is skipped.

Notes:
- The CI runner must have Postgres client tools (`psql`, `pg_restore`) available for restoring dumps. The script attempts `pg_restore` first, then `psql` for plain SQL.
- The Sanity import step uses `@sanity/cli` (`npx sanity dataset import`) and may require network access and a valid admin token.

## Local run (developer)
1. Ensure you have `psql` or `pg_restore` available and Node.js installed.
2. Export required env vars locally (example):

```bash
export SANITY_ADMIN_TOKEN=...
export SANITY_STUDIO_PROJECT_ID=ygbu28p2
export SANITY_TEST_DATASET=nimbus_demo_test
export SANITY_EXPORT_TARBALL_URL="https://example.com/sanity-export.tar.gz"
export POSTGRES_TEST_URL="postgresql://user:password@host:5432/dbname"
export POSTGRES_DUMP_URL="https://example.com/pg_dump.sql.gz"
```

3. Run the script (from repo root):

```bash
chmod +x ./scripts/backup_restore_test.sh
./scripts/backup_restore_test.sh
```

### Placeholder run (no secrets)
You can dispatch the CI workflow manually without configuring repository secrets — the workflow will set placeholder values for missing secrets. The script will not perform real restores when placeholders are present and will print informative messages. This is useful to validate runner tooling and script behavior without touching real systems.

To perform a placeholder/manual run, open the workflow in GitHub Actions and use "Run workflow". If you later provide real secrets, re-run the workflow to execute actual restores.

## Security & cleanup
- Use ephemeral test environments and credentials that are scoped and revocable.
- Do not use production database or Sanity project tokens for these tests.
- When importing test data, ensure the dataset name is isolated (e.g. `nimbus_demo_test`) and that existing test datasets are safe to replace.

## Next steps
- Provide the required test secrets in GitHub and run the workflow manually via Actions -> the workflow -> Run workflow.
- If you want, I can also add an optional step to upload and store a sanitized exported dataset into GitHub Actions artifacts or a private S3 bucket for reproducible runs — tell me which storage you prefer.

## How to export Sanity datasets and Postgres dumps

Sanity (export dataset):

```bash
# Export a dataset to a tarball using the Sanity CLI
npx @sanity/cli dataset export <dataset> ./sanity-export-$(date +%Y%m%d).tar.gz --project <projectId>
```

Sanity (import dataset):

```bash
# Import a dataset into a target dataset (requires SANITY_ADMIN_TOKEN)
npx @sanity/cli dataset import ./sanity-export-2025XXXXX.tar.gz <targetDataset> --project <projectId> --replace
```

Postgres (logical dump using custom format, recommended):

```bash
# Dump (custom format):
pg_dump -Fc --no-acl --no-owner -h <host> -U <user> -d <db> -f dump-$(date +%Y%m%d).dump

# Restore (pg_restore):
pg_restore -h <host> -U <user> -d <db> -c --if-exists dump-2025XXXXX.dump
```

Postgres (plain SQL):

```bash
# Dump (plain SQL):
pg_dump -h <host> -U <user> -d <db> -f dump.sql

# Restore (psql):
psql -h <host> -U <user> -d <db> -f dump.sql
```

Notes:
- Prefer custom-format `pg_dump -Fc` for faster and more flexible restores with `pg_restore`.
- Always restore into a non-production test database and verify credentials are ephemeral.
