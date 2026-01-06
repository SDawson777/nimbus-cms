# Deal Structures (Nimbus CMS)

This document outlines two common transaction paths for Nimbus CMS and gives buyers a clear view of what they receive, what drives price, and what support is (and is not) included.

**Last updated:** 2026-01-05

## Path 1 — Full Acquisition (Asset Purchase / IP + Product)

### What the buyer gets

Typical “full acquisition” deliverables (final list governed by APA/asset schedule):

- **Source code + history**: full git repository (this repo) and any related private repos used in production.
- **Intellectual property**: assignment of all IP rights in the software (copyright, trade secrets), including the right to create derivatives.
- **Build/deploy assets**: Docker artifacts (`Dockerfile`, `server/Dockerfile`, `infra/docker-compose.yml`), CI config, runbooks, and env variable references.
- **Operational documentation**: deployment/ops/security/DR documentation already in the repo (e.g., `DEPLOYMENT.md`, `ENV_VARIABLES.md`, `docs/SECURITY_NOTES.md`, `docs/BACKUP_AND_DR_RUNBOOK.md`).
- **Data + demo assets (optional)**: demo dataset and seed scripts (Postgres + Sanity) to reproduce the canonical demo environment.
- **Brand assets (optional)**: trademarks, domains, marketing site content, demo collateral, pitch materials (as applicable).
- **Customer contracts (optional)**: assignment/novation of customer and vendor agreements (subject to consent/terms).
- **People (optional)**: transition services, consulting, or key hires (separate agreements).

### Key pricing levers

- **Rebuild cost avoided**
  - The buyer is effectively purchasing a working product and known architecture rather than funding a rebuild.
- **Speed-to-market**
  - Time saved to launch a compliant, multi-tenant CMS + Admin console with seeded demo and deploy runbooks.
- **Compliance posture + operational hardening**
  - Security controls, DR runbooks, readiness endpoints, and observed production patterns reduce risk and engineering time.
- **Multi-tenant leverage**
  - A multi-tenant system-of-record (Sanity + Postgres) generally reduces the buyer’s marginal cost per new brand/store.
- **Transferability of knowledge**
  - Quality of docs, repeatable seeding, and clarity of environment variables reduce the buyer’s integration and onboarding cost.

### Boundaries around support (typical acquisition stance)

Unless a Transition Services Agreement (TSA) is executed, acquisition is generally delivered **as-is** with reasonable handoff.

Common TSA boundaries (if included):

- **Time box**: e.g., 2–6 weeks of transition assistance.
- **Scope**: knowledge transfer, deployment walkthroughs, environment setup, and answering diligence questions.
- **Exclusions**:
  - net-new feature development
  - major re-architecture
  - custom integration work (POS, payments, SSO, etc.) unless explicitly scoped
  - 24/7 on-call or production SLAs unless explicitly contracted
- **Bug/security response**: best-effort guidance during TSA; ongoing security patching becomes the buyer’s responsibility post-close.

## Path 2 — Multi-Buyer Licensing (Non-Exclusive Product License)

This path is appropriate when the seller retains ownership of the core IP and licenses rights to multiple buyers/operators.

### What the buyer gets

Licensing structures vary; common options:

- **Option A: Source-available license (non-exclusive)**
  - Buyer receives source code under a license with defined rights (use/modify/deploy), without ownership transfer.
- **Option B: Hosted offering (SaaS / managed service)**
  - Buyer consumes the product as a service; buyer may not receive source.
- **Option C: White-label distribution rights**
  - Buyer can rebrand and deploy for its own portfolio or clients, subject to license constraints.

Typical licensed deliverables:

- Access to the build/deploy artifacts and the product runtime (API + Admin + Studio workflow)
- Documentation/runbooks sufficient to operate in the buyer’s environment
- Defined update cadence and support channel (contractual)

### Key pricing levers

- **Seat/store/tenant scale**
  - Price commonly scales by brand/store count, MAU, or environments.
- **Rights granted**
  - Modify/derivative rights, white-label rights, sublicensing, and exclusivity (if any) drive price.
- **Hosting model**
  - Buyer-hosted vs seller-hosted (managed) changes COGS and support scope.
- **Compliance requirements**
  - Jurisdiction-specific workflows, compliance reporting, and audit needs increase implementation burden.
- **Speed-to-market / implementation effort**
  - Whether the buyer needs data migrations, custom integrations, or bespoke branding.

### Boundaries around support (licensing)

Licensing should explicitly define support so multiple buyers are operationally manageable:

- **Support channel and hours**: e.g., business-hours support with defined response targets.
- **SLA/SLO**:
  - If seller-hosted: uptime SLOs, incident response expectations, maintenance windows.
  - If buyer-hosted: seller supports software defects; buyer owns infra/network.
- **Updates and security patches**:
  - Patch cadence, how updates are delivered, and buyer obligations to apply them.
- **Customization policy**:
  - What qualifies as configuration vs custom development, and how custom work is priced.
- **Data responsibility**:
  - Backup/restore expectations, RPO/RTO targets, and who performs restores.

## Decision Guide (When to choose which path)

- Choose **Full Acquisition** when the buyer wants full control, indefinite internal operation, and the ability to fold Nimbus into an existing platform.
- Choose **Licensing** when the seller intends to operate and monetize Nimbus across multiple buyers and can support a product roadmap and support obligations.

## Contractual notes (non-legal)

- Final terms are governed by NDA/LOI/APA/license agreements.
- Ensure asset schedules match reality: repos, domains, tokens/keys rotation, third-party contracts, and any customer data handling.
