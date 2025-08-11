# JARS CMS → Mobile App Content Contract

This document defines the CMS data types, GROQ queries, and API proxy endpoints used by the Jars-mobile-app across Phases 1–4.

## Phase 1 — Core content
- `legalPage`: Terms, Privacy Policy
- `faqItem`: FAQ screen
- `storeInfo`: Hours, amenities
- `filters`: Categories, strains, brands

**GROQ Examples**

## Phase 2 — Deals & Personalization flags
- `deal`: CMS-curated deal with start/end date, tags, "reason text"
- `collection`: Curated product set for "For You Today"

## Phase 3 — Greenhouse & Concierge
- `article`: Educational Greenhouse articles
- `category`: Article category
- `module`: Quiz/module for completion
- `author`: Author details

## Phase 4 — Transparency & Awards
- `transparencyPage`: Data & AI policy
- `accessibilityPage`: Accessibility statement
- `awardsExplainer`: Loyalty & Jars Awards explainer

---

### Public API Paths
The mobile app consumes these via the backend proxy:

- `/content/legal`
- `/content/faq`
- `/content/deals`
- `/content/greenhouse`
- `/content/transparency`
- `/content/accessibility`
- `/content/awards-explainer`

