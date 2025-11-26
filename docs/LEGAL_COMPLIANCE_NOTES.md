# Legal and compliance scope

This document clarifies what the Nimbus Cannabis OS CMS compliance features cover, and what remains the responsibility of the buyer and their legal counsel.

## What the CMS provides

The system includes:

- **State-aware legal documents** – `legalDoc` documents support `type` (terms, privacy, accessibility, ageGate, disclaimer), `stateCode`, `effectiveFrom`, `effectiveTo`, and `version` fields.
- **Per-store compliance scoring** – the compliance engine evaluates whether each store has all required legal document types in effect.
- **Admin compliance overview** – `/api/admin/compliance/overview` exposes per-store compliance scores and missing types, respecting RBAC and tenant scope.
- **Compliance snapshots** – the scheduler can persist snapshots of compliance status over time for auditability.

These features help you **operationalize** legal content, but they do not constitute legal advice.

## What remains buyer responsibility

Buyers are responsible for:

- Defining which legal documents are required for their jurisdictions and business model.
- Authoring and maintaining the **content** of legal documents (terms, privacy policies, accessibility statements, age restrictions, etc.).
- Ensuring that legal text complies with applicable laws and regulations (e.g., GDPR/CCPA-style rights, age-gating rules, local advertising regulations).
- Configuring per-state or per-country variants where required by law.
- Reviewing compliance snapshots and addressing gaps the system surfaces.

The CMS does not:

- Guarantee that a particular configuration achieves regulatory compliance.
- Perform automated regulatory analysis.
- Replace consultation with qualified legal counsel.

## Data and privacy considerations

- The primary data stored in the CMS is marketing/content copy and legal text.
- Analytics and personalization payloads **can** contain user attributes, but schemas and usage are controlled by the buyer.
- Buyers should:
  - Avoid storing unnecessary personal data in content or analytics events.
  - Anonymize or pseudonymize identifiers where feasible.
  - Document their own data retention and deletion policies.

## Recommended buyer actions

- Have legal counsel review the legal schemas and example documents.
- Configure required document types and state mappings per jurisdiction.
- Periodically review compliance reports and snapshots for gaps.
- Document internal policies for how marketing and legal teams should maintain content in the CMS.
