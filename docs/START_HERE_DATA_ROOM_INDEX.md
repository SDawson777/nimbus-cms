# Start Here — Data Room Index (Diligence)

This index is a structured table of contents for buyer diligence. Replace `TBD` links with your data-room URLs (Google Drive, Dropbox, Datasite, etc.) or point to specific files in this repo.

## Executive Assets

| Item | Link | Description |
|---|---|---|
| Teaser (1–2 pages) | [TBD](#) | High-level overview: problem, solution, traction, why now. |
| Investor/Buyer Deck | [TBD](#) | Full pitch deck with product, roadmap, market, and deal thesis. |
| Product Demo Video | [TBD](#) | 5–10 minute walkthrough of Admin + CMS + Mobile + API. |
| Pricing Sheet | [TBD](#) | Current pricing, packages, and assumptions (COGS, margins). |
| Competitive Replacement List | [TBD](#) | Competitors and migration/replace narrative (who we displace and why). |

## Technical Pack

| Item | Link | Description |
|---|---|---|
| Architecture Diagram | [../ARCHITECTURE.md](../ARCHITECTURE.md) | Visual diagram of Admin, API, Sanity, Postgres, Sentry, hosting. |
| Architecture (Environments) | [ARCHITECTURE_ENVIRONMENTS.md](ARCHITECTURE_ENVIRONMENTS.md) | Environment-specific deployment architecture and configuration. |
| Data Flow Diagram | [../ARCHITECTURE.md#data-flow](../ARCHITECTURE.md) | Content flow (Sanity → API → clients) and auth flows (Admin JWT/CSRF). |
| System Inventory | [SYSTEM_INVENTORY.md](SYSTEM_INVENTORY.md) | Services, repos, third-party dependencies, data stores, secrets locations. |
| **Asset List & Support** | [**ASSET_LIST_AND_SUPPORT.md**](ASSET_LIST_AND_SUPPORT.md) | **Comprehensive asset inventory: repos, scripts, artifacts; what buyer must provision (Sanity, Sentry, Stripe, hosting).** |
| Security Posture Memo | [SECURITY_POSTURE_MEMO.md](SECURITY_POSTURE_MEMO.md) | Security posture summary, auth flow, RBAC, tenant isolation, Sentry config, DB/logging policies. |
| Security Notes | [SECURITY_NOTES.md](SECURITY_NOTES.md) | Detailed security controls: rate limiting, CSRF, CORS, upload validation, analytics HMAC. |
| RBAC Matrix | [RBAC_MATRIX.md](RBAC_MATRIX.md) | Role-based access control matrix for Admin users (OWNER, ORG_ADMIN, EDITOR, VIEWER). |
| SDLC Proof | [../CONTRIBUTING.md](../CONTRIBUTING.md) | Development process: PRs, CI checks, testing, linting. Also see [../RELEASING.md](../RELEASING.md). |
| Deployment Guides | [../DEPLOYMENT.md](../DEPLOYMENT.md) | How to deploy demo/preview/prod, env var matrix, and runtime ops. |
| Environment Variables | [ENV_VARIABLES.md](ENV_VARIABLES.md) | Canonical reference for all environment configuration (server, admin, studio). |
| Backup & DR Runbook | [BACKUP_AND_DR_RUNBOOK.md](BACKUP_AND_DR_RUNBOOK.md) | Postgres + Sanity backup procedures, restore steps, and verification drills. |
| Observability/Monitoring | [OPS_MONITORING_AND_ALERTS.md](OPS_MONITORING_AND_ALERTS.md) | Sentry setup, uptime checks, logs, alerting, runbooks. |
| Sentry Setup | [SENTRY_SETUP.md](SENTRY_SETUP.md) | Sentry configuration for server and Admin SPA error tracking. |
| Buyer Smoke Test | [BUYER_SMOKE_TEST.md](BUYER_SMOKE_TEST.md) | 30-minute acceptance checklist for Admin/CMS/Mobile/API/Sentry. |
| Software Bill of Materials | [SBOM-nimbus-cms.json](SBOM-nimbus-cms.json) | CycloneDX SBOM with all dependencies and licenses (1,696 components). |

## Commercial / Legal Pack

| Item | Link | Description |
|---|---|---|
| IP Assignment Packet | [TBD](#) | Chain-of-title: assignments, contributor agreements, work-for-hire documents. |
| License Summary | [licenses.md](licenses.md) | Third-party OSS/commercial licenses, obligations, and notices. Generate with `pnpm licenses:generate`. |
| Asset Purchase Outline | [TBD](#) | Draft outline of transaction structure, assets, liabilities, and transition plan. |
| Legal Compliance Notes | [LEGAL_COMPLIANCE_NOTES.md](LEGAL_COMPLIANCE_NOTES.md) | Age verification, privacy/terms docs, CCPA/GDPR considerations. |

## Notes

- Replace links with your data-room URLs.
- If you want this index to link directly into the repo, change links to file paths (e.g., `docs/BACKUP_AND_DR_RUNBOOK.md`).
