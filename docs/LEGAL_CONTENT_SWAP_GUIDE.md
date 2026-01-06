# Legal Content Swap Guide (CMS)

## Where legal docs live

Legal content is stored in **Sanity** as documents of type `legalDoc` (see `apps/studio/schemaTypes/__cms/legalPage.ts`).

Supported `type` values include:

- `terms`
- `privacy`
- `disclaimer`
- `ageGate`
- `accessibility`

## Demo placeholder requirements

For buyer demos, create placeholder legal docs with obvious labels:

- Terms of Service: id `tos-demo`
- Privacy Policy: id `privacy-demo`
- Disclaimers: id `disclaimer-demo`

Each should include a banner/title like: **SAMPLE TEMPLATE – REPLACE**.

## How to publish updates

1. Edit the relevant `legalDoc` document.
2. Set `version` and `effectiveFrom`.
3. Publish.

## How it flows into Admin + Mobile

- Admin and mobile fetch legal docs from Sanity via the API.
- When you publish updated legal docs, they become available immediately to consumers (subject to CDN/cache behavior).

## Helper script

This repo includes a helper script to upsert demo placeholder docs into the configured dataset:

- `pnpm sanity:seed-legal-demo`

It uses `SANITY_PROJECT_ID`, `SANITY_DATASET`, and `SANITY_API_TOKEN`/`SANITY_TOKEN` from your environment.
