# Sanity dataset scripts

This directory contains helper scripts for exporting, importing, and promoting Sanity datasets used by the CMS. They are wired to npm scripts so you can run them without compiling TypeScript manually.

## Available commands

From the repository root:

- `npm run cms:export` — export a snapshot of documents from the configured dataset to `backups/`.
- `npm run cms:import` — import a snapshot file into the configured dataset.
- `npm run cms:promote` — promote documents from one dataset to another (source ➝ target).

Each command is implemented in the `scripts/` folder:

- `scripts/exportContent.ts`
- `scripts/importContent.ts`
- `scripts/promoteDataset.ts`
- `scripts/backfillMetrics.ts` (optional helper for analytics backfill; not wired to a public npm script by default).

## Required environment

All scripts talk directly to Sanity. They require the same core environment variables:

- `SANITY_PROJECT_ID`
- `SANITY_DATASET` (for export/import)
- `SANITY_API_TOKEN` (with the necessary scopes)
- `SANITY_SOURCE_DATASET` and `SANITY_TARGET_DATASET` (for promotion)

You can provide these via a local `.env` file (when running locally) or via your platforms secret manager in non-local environments.

> **Security note**: Never commit real API tokens. Rotate any token that may have been exposed.

## Usage patterns

### 1. Export the current dataset

Exports the current dataset to a timestamped JSON file under `backups/`.

- Reads from: `SANITY_PROJECT_ID` + `SANITY_DATASET`
- Writes to: `backups/export-YYYYMMDD-HHmmss.json` (exact naming may vary slightly)

Typical flow:

1. Ensure env vars are set (`SANITY_PROJECT_ID`, `SANITY_DATASET`, `SANITY_API_TOKEN`).
2. Run:
   - `npm run cms:export`
3. Confirm that a new file appears under `backups/`.

### 2. Import a backup into a dataset

Imports a previously exported JSON file into the dataset pointed at by `SANITY_DATASET`.

The import script supports two important safety flags:

- `--dry-run` — parse the file and compute intended mutations, but do not write anything.
- `--force` — overwrite existing documents with matching `_id` values instead of skipping them.

Recommended flow:

1. Configure your **target** dataset (e.g. `staging`) via `SANITY_DATASET`.
2. Run a dry-run to preview:
   - `npm run cms:import -- ./backups/export-YYYYMMDD-HHmmss.json --dry-run`
3. Review the output for the number of creates/updates that would occur.
4. When satisfied, run the actual import:
   - `npm run cms:import -- ./backups/export-YYYYMMDD-HHmmss.json --force`

### 3. Promote between datasets

Promotes documents from one dataset to another (for example: `staging` ➝ `production`). This is a convenience wrapper around export+import that uses Sanitys APIs directly.

Required env vars:

- `SANITY_PROJECT_ID`
- `SANITY_SOURCE_DATASET`
- `SANITY_TARGET_DATASET`
- `SANITY_API_TOKEN`

Safety flags:

- `--dry-run` — show which documents would be copied/updated.
- `--force` — overwrite existing ids in the target dataset.

Recommended flow:

1. Set `SANITY_SOURCE_DATASET` to the dataset you want to promote **from** (for example `staging`).
2. Set `SANITY_TARGET_DATASET` to the dataset you want to promote **to** (for example `production`).
3. Run a dry-run:
   - `npm run cms:promote -- --dry-run`
4. Review output, then run the real promotion:
   - `npm run cms:promote -- --force`

## Backup and safety best practices

- Always take an export before running **import** or **promote** against a production dataset.
- Treat exported JSON files as sensitive data (they may contain legal copy, internal notes, or other PII depending on your schema). Store them in a secure bucket if you need to keep them long term.
- Prefer running destructive operations (`--force` imports, large promotions) in a staging environment first.
- For very large datasets, consider splitting exports by type or using the official Sanity CLI import/export tooling to avoid excessively large JSON files.

## Warnings and footguns

- Imports and promotions are **not** transactional. If a run is interrupted, you may end up with a partially applied dataset. Re-running with the same file and `--force` usually converges the target dataset to the intended state.
- These scripts trust the `_id` field where present. If you manually edit export files, be careful not to create id collisions.
- `SANITY_API_TOKEN` must have write scopes for import/promote. A token with only read permissions will cause failures.
- When in doubt, run with `--dry-run` first and keep a recent export from the target dataset so you can roll back if needed.
