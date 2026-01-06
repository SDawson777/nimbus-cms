# Close Process Playbook (Nimbus CMS)

This is a CEO/CTO-ready checklist to move a buyer from first contact to close with minimal thrash, clear owners, and an explicit “definition of done” (DoD) for each stage.

**Last updated:** 2026-01-05

## Roles (owners)

Seller-side:
- **CEO (Deal Lead):** process owner, timeline, buyer comms, pricing/terms, LOI/APA negotiation
- **CTO (Technical Lead):** architecture/security diligence, deployment walkthrough, engineering Q&A, integration feasibility
- **Legal Counsel (Seller):** NDA/LOI/APA drafting + redlines, IP chain-of-title, contract assignment details
- **Finance/Controller:** financials, revenue quality, AR/AP, tax items, working-capital inputs
- **Ops/Support Lead (if any):** support model, SLAs, TSA scope, handoff readiness

Buyer-side (typical counterparts):
- **Corp Dev / Sponsor:** timeline, LOI/APA alignment
- **Buyer CTO / Eng Lead:** technical diligence
- **Buyer Security/IT:** security review and hosting posture
- **Buyer Legal:** NDA/LOI/APA
- **Buyer Finance:** valuation model, purchase price mechanism

## Stage 0 — Freeze (Prep and control scope)

**Owner:** CEO (primary), CTO (support)

Checklist:
- Confirm the “as-is” product scope for diligence (no new features during close).
- Identify any known risks and write them down (tech debt, missing docs, env var inconsistencies, etc.).
- Create a single source-of-truth for updates (one email thread or deal Slack channel).
- Lock a high-level timeline (demo → diligence → LOI → APA → close).

Definition of done (DoD):
- Internal “freeze date” agreed; only critical fixes allowed.
- A single deal lead (CEO) and technical lead (CTO) are assigned.

## Stage 1 — NDA Gate

**Owner:** CEO + Legal Counsel

Checklist:
- Send NDA template (mutual or buyer paper) and enforce signature before sharing sensitive materials.
- Confirm buyer entity name and signer authority.
- Create deal folder (internal) for: NDA, notes, redlines, buyer list, timeline.

DoD:
- Executed NDA stored and counterparty confirmed.
- Buyer added to controlled-access data room.

## Stage 2 — Data Room Ready (Curated diligence package)

**Owner:** CEO (primary), CTO (technical pack), Finance (financial pack)

Checklist:
- Publish a single “Start Here” index:
  - `docs/START_HERE_DATA_ROOM_INDEX.md`
- Ensure core technical pack is present and current:
  - `docs/SYSTEM_INVENTORY.md`
  - `docs/SECURITY_POSTURE_MEMO.md`
  - `docs/DEPLOY_DOCKER.md`
  - `docs/BACKUP_AND_DR_RUNBOOK.md`
  - `BUYER_SMOKE_TEST.md`
- Confirm deploy + env docs are consistent:
  - `DEPLOYMENT.md`, `ENV_VARIABLES.md`, `ENVIRONMENT_VARIABLES.md`
- Prepare “known deltas” memo (1 page):
  - what’s production-grade vs demo-grade
  - what’s legacy/reference (e.g., `nimbus-mobile-app/`)
  - any environment-variable naming mismatches and the source of truth

DoD:
- Buyer can navigate the data room without seller guidance.
- Buyer can run the smoke test checklist with only URLs/credentials filled in.

## Stage 3 — Demo (Show the product and the ops story)

**Owner:** CEO (story), CTO (tech credibility)

Checklist:
- Run demo against the canonical demo environment.
- Use the buyer smoke test flow as the narrative:
  - Admin login + RBAC
  - CMS content update (deal/theme/legal)
  - API health/readiness
  - Sentry/error capture (non-prod)
- Capture buyer questions and commit to follow-ups with owners + dates.

DoD:
- Buyer acknowledges the product matches expectations.
- A concrete diligence plan/timeline is agreed (technical deep dive date, LOI target date).

## Stage 4 — Technical Diligence (Deep dive + verification)

**Owner:** CTO (primary)

Checklist:
- Architecture walkthrough:
  - deploy topology (API/Admin/Studio)
  - data stores (Postgres + Sanity; Redis optional)
  - auth model (JWT cookie + RBAC)
  - CSRF + CORS controls
  - observability (Sentry) and ops endpoints
- Deployment walkthrough:
  - Docker: `server/Dockerfile` vs root `Dockerfile`
  - local compose: `infra/docker-compose.yml`
  - readiness endpoints expectations
- Security posture review:
  - confirm secrets handling expectations
  - rate limiting, CSRF, CORS allowlists
  - incident response basics (rotate `JWT_SECRET`, etc.)
- DR posture review:
  - Postgres backups + restore concept
  - Sanity dataset export/import drill
- Optional: buyer runs `docs/DEPLOY_DOCKER.md` and reports results.

DoD:
- Buyer technical lead signs off “we can deploy and operate this.”
- Any remediation items are triaged into:
  - (A) pre-close blockers
  - (B) post-close plan
  - (C) out-of-scope

## Stage 5 — LOI (Commercial alignment)

**Owner:** CEO + Finance + Legal

Checklist:
- Align on deal path (acquisition vs license) and headline terms:
  - price and structure
  - exclusivity window
  - closing timeline
  - TSA/support expectations
  - key representations (IP ownership, non-infringement, etc.)
- Define what is included in the asset schedule (repos, domains, docs, customer contracts, etc.).

DoD:
- Executed LOI with:
  - purchase price / economics
  - exclusivity period
  - target close date
  - defined diligence scope and open items list

## Stage 6 — APA / Definitive Agreements

**Owner:** Legal Counsel (primary), CEO (business), CTO (schedules)

Checklist:
- Draft and negotiate:
  - asset schedule (exact repos, domains, docs, deliverables)
  - IP assignment terms
  - customer/vendor contract assignment (if applicable)
  - TSA/support schedule (if any): scope, hours, rate, exclusions
  - confidentiality, non-disparagement, non-solicit (as applicable)
- CTO produces/validates technical schedules:
  - list of repos and deploy artifacts
  - production environment list (without secrets)
  - third-party services list (Sanity/Sentry/etc.)
  - security/ops runbooks included
- Prepare “keys and access” transfer plan (see Close stage).

DoD:
- APA substantially agreed (no open business terms).
- Schedules match the real system inventory.

## Stage 7 — Close (Execution and transfer)

**Owner:** CEO (primary), Legal (paper), CTO (technical cutover)

Checklist:
- Sign definitive docs and confirm funds flow.
- Transfer assets (as applicable):
  - git repos (ownership transfer or escrow delivery)
  - domains and DNS
  - cloud accounts/projects (or export/import plan)
  - Sanity project/datasets access (or dataset export/import plan)
  - Sentry org/project access (or handoff plan)
- Rotate/replace secrets:
  - `JWT_SECRET`, Sanity tokens, Sentry DSNs, analytics keys, any API keys
- Validate buyer operational readiness:
  - buyer can deploy API
  - buyer can access Studio and Admin
  - buyer runs `BUYER_SMOKE_TEST.md` successfully

DoD:
- Buyer has control of code + deploy + required third-party accounts (or documented migration plan).
- Secrets rotated and old access removed.
- A post-close plan exists for remaining non-blocker remediation items.

## Operating rules (to keep close fast)

- One thread, one timeline, one owner per question.
- Default to written answers and link to repo docs.
- Any request that expands scope becomes a change request with explicit pricing/time impact.
