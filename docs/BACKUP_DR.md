# Backup and disaster recovery

This guide describes how to back up and restore the Nimbus Cannabis OS CMS datasets and configuration, and how to think about recovery objectives (RPO/RTO).

## What needs to be backed up

The CMS is largely stateless; persistent state lives in:

- **Sanity datasets** (content, legal docs, personalization rules, theme configs).
- **Environment configuration** (env vars, secrets in your secret manager).
- Optional external systems (analytics/event pipelines) that you operate separately.

The application itself (Docker image + code) can always be rebuilt from Git.

## Recovery objectives (RPO / RTO)

Define these with your buyer:

- **RPO (Recovery Point Objective)** – how much content change can you afford to lose in a disaster.
  - Example: RPO = 1 hour (you take hourly Sanity exports).
- **RTO (Recovery Time Objective)** – how long you can be down while recovering.
  - Example: RTO = 2 hours (time to provision a new environment, restore dataset, and verify).

The scripts in this repo support aggressive RPO/RTO if scheduled correctly.

## Backup process (Sanity datasets)

Use the provided npm scripts (see `scripts/README.md`):

- `npm run cms:export` – exports the current dataset to `backups/`.
- `npm run cms:import` – imports a JSON snapshot into the configured dataset.
- `npm run cms:promote` – promotes documents from one dataset to another.

### Recommended backup cadence

1. Choose a dedicated **backup environment** (e.g., a CI job or a scheduled container).
2. Configure env vars with read + write access to your production dataset.
3. On a schedule (for example, every hour or every 4 hours):
   - Run `npm run cms:export`.
   - Compress the resulting JSON file.
   - Upload it to a secure object store (S3, GCS, etc.) with lifecycle policies.
4. Periodically prune old backups according to your compliance policy (e.g., keep 30 days).

### Validating backups

At least monthly, perform a **restore drill**:

1. Create a temporary Sanity dataset (e.g., `recovery-test-YYYYMMDD`).
2. Set `SANITY_DATASET` to this test dataset.
3. Run `npm run cms:import -- ./backups/your-backup.json --dry-run`.
4. If output looks correct, run the same command with `--force`.
5. Point a non-production CMS instance at this dataset and verify content.

## Disaster recovery runbook

In the event of data loss or environment failure:

1. **Assess scope** – determine which environment (staging, production) and which components are affected (Sanity dataset, API, Admin SPA).
2. **Provision replacement infrastructure** – deploy a fresh instance using the existing Docker image and your IaC templates (see `infra/`).
3. **Restore secrets and config** – re-create secrets/config maps from your secret manager.
4. **Restore Sanity dataset**:
   - Create a new dataset (e.g., `production-restore-YYYYMMDD`).
   - Import the latest good backup with `npm run cms:import -- ./backups/latest.json --force`.
   - Point the CMS API at this dataset by setting `SANITY_DATASET`.
5. **Verify**:
   - Run `npm test` or basic smoke tests.
   - Hit `/status`, `/content/*`, and key admin routes.
6. **Cut over** – update DNS or load balancer to direct traffic to the restored environment.

## Notes and best practices

- Treat backup files as **sensitive**; they may contain legal copy and internal notes. Store them encrypted at rest.
- Use tokens with **least privilege** for backup jobs: read/write for the relevant dataset, not full project-admin.
- Document your chosen RPO/RTO and keep them in your runbooks so on-call engineers know what to target.

For command details and examples, see `scripts/README.md`.
