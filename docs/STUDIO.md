# Sanity Studio (apps/studio)

The repository includes a Sanity Studio at `apps/studio/` used by editors. This document explains where schemas live and notes about new fields and flows (org/brand/store, legal versioning, theming).

## Where schemas live

- `apps/studio/sanity.config.ts` - Studio configuration
- `apps/studio/schemas` - document and object schemas
- `apps/studio/config/preview.ts` - preview config

## New/important fields and flows

- Org/Brand/Store model: Studio introduces `organization`, `brand`, and `store` documents (under `schemas/__admin/`) so content can be scoped to a brand or a store. These are used by the API when you provide `org`, `brand`, or `store` slugs in requests.

- Theme documents (`themeConfig`): contains color tokens, typography, and a `logo` image reference. Editors can set `logo` and `logoAlt`; the Admin SPA persists `logoAssetId` and `logoAlt` to the `logo` image reference.

- Legal content: documents include `type` (e.g. `terms`, `privacy`), `stateCode` (optional), `version`, `effectiveFrom`, and optional `effectiveTo`. The API returns the most-recent effective version.

## Running Studio locally

```bash
npm run dev:studio
```

For CLI builds/deploys:

```bash
npx sanity build --cwd apps/studio
npx sanity deploy --cwd apps/studio
```

## Handoff notes for editors

- Use the Studio to manage content, publish documents, and preview with `X-Preview: true` enabled on the API.
- To avoid creating duplicate theme documents, prefer the Admin SPA for theme edits (server-side idempotency enforced by deterministic document ids). The Studio will allow editing theme docs directly if needed.
