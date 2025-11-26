# Legacy Jars CMS Artifacts

This directory contains the original **Jars CMS** repositories and artifacts preserved for provenance, auditing, and historical reference.

## Contents

- `jars-cms/` – Original monorepo and implementation of Jars CMS.
- `jars-cms-api/` – Original standalone Jars CMS API project.
- `jars-mobile-app/` – Original Jars mobile client application.
- Any Jars-specific documentation and contracts retained verbatim.

## Important Notes

- **Do not edit or rebrand anything in this directory.** These artifacts are preserved exactly as they existed when Jars CMS was migrated to **Nimbus Cannabis OS CMS**.
- Code, configuration, and documentation under `legacy/` may reference:
  - `Jars CMS`, `JARS`, or `Jars Cannabis` branding.
  - Old domains, endpoints, or infrastructure.
  - Deprecated schemas, APIs, or workflows.

These references are intentional and MUST remain unchanged to preserve an accurate record of the original system.

## Scope of the Nimbus Migration

The active Nimbus Cannabis OS CMS implementation lives **outside** this `legacy/` directory. All production code, schemas, workflows, and documentation for Nimbus should reference:

- `Nimbus Cannabis OS CMS` (or simply `Nimbus` where appropriate)
- `NIMBUS_*` / `nimbus_*` identifiers for environment variables, globals, and internal keys

Any remaining `Jars` references outside `legacy/` should be treated as bugs and removed as part of ongoing hardening.

## Usage Guidance

- Treat everything under `legacy/` as **read-only**.
- If you need to understand historical behavior, API contracts, or mobile interactions for Jars CMS, consult these artifacts directly.
- When implementing new features or fixes, work exclusively in the Nimbus codepaths outside `legacy/`.

## Compliance & Audit

This directory helps demonstrate provenance and change history from Jars CMS to Nimbus Cannabis OS CMS.

- It provides a clear separation between historical Jars code and the modern Nimbus implementation.
- It enables auditors and buyers to trace how contracts, schemas, and behaviors evolved over time.

Again: **Do not modify, rebrand, or delete files under `legacy/` unless you are explicitly archiving them elsewhere for legal or compliance reasons.**
