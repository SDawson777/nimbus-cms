# Legal Content Swap Guide

This guide explains how to replace the demo/sample legal content with a buyer’s final Terms of Service, Privacy Policy, and Disclaimers using Nimbus CMS.

## 1) Where Legal Docs Live (Sanity)

All legal content is stored in Sanity as documents of type `legalDoc` (schema: `apps/studio/schemaTypes/__cms/legalPage.ts`).

### Legal Doc Types

The `legalDoc.type` field defines what the document is:

- `terms` → Terms of Service
- `privacy` → Privacy Policy
- `disclaimer` → Disclaimers

Additional supported types (used by some deployments):

- `accessibility`
- `ageGate`

## 2) How Legal Docs Are Versioned & Targeted

Nimbus uses a simple, auditable versioning model:

- **Effective window**
  - `effectiveFrom` (required): must be in the past/now to be served
  - `effectiveTo` (optional): set to end/sunset an older version
- **Version label**
  - `version` (string): e.g., `1.0`, `2026-01`, `v2`
- **Jurisdiction**
  - `stateCode` (optional): 2-letter US state code (e.g., `CA`)
  - If `stateCode` is set, that doc is considered state-specific.
- **Tenant scoping**
  - `brand` (recommended): tie the legal doc to the buyer’s brand
  - `stores` (optional): overrides for specific stores
- **Channel scoping**
  - `channels` (optional): e.g., `mobile`, `web`, `kiosk`

### Which Version Is Served

For a given `type` + scope, the API serves the **currently effective** document:

- `effectiveFrom <= now` and (`effectiveTo` unset or `effectiveTo > now`)
- If multiple match, the newest `effectiveFrom` wins (then `version` as a tie-breaker)
- If a request includes a `state` filter, it requires an exact `stateCode` match

## 3) Step-by-Step: Create New Buyer Legal Docs

Do this in the buyer’s target dataset (e.g., production dataset, or `nimbus_demo` for demos).

1. Open Sanity Studio (`pnpm studio:dev`) and locate **Legal Doc** content.
2. Create one new `legalDoc` per required type:
   - `terms`
   - `privacy`
   - `disclaimer`
3. For each new doc, set:
   - `title`: buyer-friendly title (no “sample” language)
   - `type`: one of `terms` / `privacy` / `disclaimer`
   - `body`: paste the buyer’s approved text
   - `version`: counsel-provided label (e.g., `1.0`)
   - `effectiveFrom`: the go-live timestamp (UTC recommended)
   - `brand`: set to the buyer brand (recommended)
   - `stateCode`: set only if this doc is a state-specific variant
   - `channels`: set only if you want channel-specific legal copy
4. Publish each document.

If you want the **Compliance** dashboard to show 100% completion, also create the additional supported types that the compliance check expects in your deployment (by default: `accessibility` and `ageGate`).

### Cutover Without Downtime (Recommended)

When replacing a currently-live legal doc:

1. Create the new doc with a future `effectiveFrom`.
2. Set the old doc’s `effectiveTo` to exactly the same time.
3. Publish the old doc update.

This creates a clean handoff with an auditable effective-date history.

## 4) Step-by-Step: Mark Demo/Sample Docs as “SAMPLE TEMPLATE – REPLACE”

If you are maintaining a demo environment, keep sample legal docs clearly labeled:

1. Open each sample `legalDoc`.
2. Set `title` to start with: `SAMPLE TEMPLATE – REPLACE: ...`
3. In `body`, add the same banner in the first paragraph.
4. Set `version` to something unmistakable (e.g., `SAMPLE`).
5. Add a note in `notes` describing what must be replaced.
6. Publish.

Optional helper: `pnpm sanity:seed-legal-demo` upserts demo placeholders in the configured dataset.

## 5) Verify: Compliance Dashboard Shows Required Docs Present

Nimbus Admin includes a compliance dashboard that flags missing legal docs.

1. In Admin, open **Compliance**.
2. Set **Brand scope** to the buyer brand (or leave “All brands” for org-wide checks).
3. Click **Run snapshot** (recommended), then wait for the overview to refresh.
4. In **Per-store compliance**:
   - **Missing** should be `—` (empty) for each store.
   - **Current Docs** should list the expected types and versions (e.g., `terms@1.0, privacy@1.0`).

Note: the default required set for the compliance dashboard is `terms`, `privacy`, `accessibility`, and `ageGate` (see `server/src/lib/compliance.ts`). `disclaimer` is supported and may be required by policy, but is not counted by default.

## For Buyer Legal Counsel

Nimbus provides the CMS mechanism to publish and version legal content, but it does not provide legal advice. The buyer (and their counsel) owns the final copy, jurisdictional applicability, and the decision of effective dates/rollout strategy. Ensure counsel approves the exact text stored in `legalDoc.body` before publishing to production.
