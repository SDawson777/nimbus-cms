# Nimbus Admin SPA Control Plane – CTO Overview

## Purpose and scope

The Admin SPA is Nimbus' control plane. It is the operator-facing surface that configures tenants, stores, themes, and system behavior without code changes. This document frames what the Admin SPA owns, how it connects to the CMS API and Studio, and which UI modules expose those controls.

## Topology: how the pieces fit

- **Admin SPA (Vite/React)** – secured UI that calls the CMS API only.
- **CMS API (Express/TypeScript)** – RBAC, tenant/store scoping, CORS, audit, caching, and data normalization. It talks to Sanity datasets, databases, POS/analytics/AI services.
- **CMS Studio (Sanity)** – editorial workspace for articles, deals, banners, filters, legal documents; organized per tenant dataset. Not used for operational config.
- **Consumer apps (mobile/web)** – consume the same CMS API; respect tenant + store context, themes, and behavior flags configured in Admin.

## The four control pillars

| Pillar              | Question answered      | Examples of what Admin configures                                                                                                         |
| ------------------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **Tenants**         | Who is this for?       | Tenant name/slug, domains, datasets, feature tier, API keys, SSO, plan/billing notes, enable/suspend state.                               |
| **Stores**          | Where is it operating? | Store metadata (address, hours, timezone), POS/inventory feed, delivery/pickup flags, local banners/deals, live/maintenance state.        |
| **Themes**          | How does it look?      | Palette (primary/accent/neutral), typography tokens, logo/icon assets, light/dark defaults, optional store overrides, versioned previews. |
| **System behavior** | How does it act?       | Feature flags, personalization strategy, legal/consent rules, notification policies, caching/preview controls, analytics/AI constraints.  |

Together these pillars let operators onboard new buyers, launch regions, and reskin or retune the platform in minutes while keeping security boundaries intact (auth, RBAC, CSRF, audit).

## Core Admin SPA modules

- **Auth & onboarding** – login, tenant selection, and optional setup wizard to seed a new tenant (name, region, default theme). Sessions use CMS API auth with RBAC.
- **Global layout shell** – tenant/store selectors plus navigation into Dashboard, Tenants, Stores, Content/Preview, Themes, Behavior/Flags, Legal, Analytics, and Settings. Maintains current context for all API calls.
- **Dashboard** – high-level metrics, recent changes, pending actions, and system health sourced from `/admin/overview` and `/admin/system/health` endpoints.
- **Tenants** – list/detail screens to create or edit tenants, map CMS datasets, attach domains, toggle feature tiers, manage users/roles per tenant, and note billing/plan metadata.
- **Stores** – list/detail with address/geo/timezone, hours/overrides, POS integration info, delivery/pickup toggles, local banners/deals links, and live/maintenance switches.
- **Themes/Branding** – global or tenant-level palette and typography tokens, logo/icon references, light/dark defaults, optional store overrides, live previews, and versioned saves through `/admin/theme`.
- **Content & Preview** – safe summaries of articles/deals/banners, deep links to open items in Sanity Studio, preview toggles, and cache purge controls per content type.
- **Legal & compliance** – maps legal document sets to tenants/regions, tracks active vs scheduled versions, and enforces re-consent or gating flows.
- **System behavior & feature flags** – enables AI Concierge, journaling, loyalty, A/B experiments; configures personalization weights and safety constraints; sets notification quiet hours and sinks.
- **Users & access** – manage users, invitations, and role assignments across tenants/stores; governs module-level access.
- **Analytics** – overviews for stores, content, and feature usage to demonstrate ROI and behavior impact.
- **System/settings** – environment and integration configuration (API base, datasets, POS, analytics, maps), health checks, and optional backup/export.

## Data flow examples

- **Authoring → delivery**: Content authored in Sanity for a tenant dataset is queried by the CMS API, normalized, cached, and consumed by Admin summaries and consumer apps; Admin can purge caches or toggle preview mode without touching Studio.
- **New tenant onboarding**: Admin creates a tenant, assigns a dataset and domains, seeds defaults (theme, flags, legal), then invites users. Consumer apps targeting that tenant immediately inherit theme, content source, and behavior flags.
- **Behavior change**: Operator toggles `ai_concierge` on in Admin; CMS API records the flag; consumer apps reading config for that tenant expose the feature on next load without redeploying.

## Why this architecture

- **Separation of concerns** – editorial work stays in Studio; operational and behavioral controls live in Admin SPA; enforcement and normalization sit in CMS API.
- **Multi-tenant and white-label ready** – tenants, stores, themes, and behavior are first-class records; onboarding a new operator is configuration, not a migration.
- **Security-first** – Admin routes are gated by auth/RBAC/CSRF with locked-down CORS; sensitive actions are auditable.
- **Buyer story** – shows an operator can launch new markets, reskin the experience, and tune behavior quickly—key proof for enterprise or acquisition diligence.
