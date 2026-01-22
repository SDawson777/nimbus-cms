# Nimbus CMS Demo Content Summary

> **Live Studio:** https://nimbus-cms.sanity.studio/  
> **Dataset:** nimbus_demo  
> **Last Updated:** January 22, 2026

## Content Inventory

| Content Type | Count | Description |
|--------------|-------|-------------|
| **Articles** | 25 | Educational cannabis content across all categories |
| **Categories** | 14 | Article taxonomy (Flower, Edibles, Concentrates, Vapes, etc.) |
| **Authors** | 5 | Staff writers with bios and avatars |
| **Deals** | 18 | Promotional offers with dates and discount details |
| **Promos** | 4 | Hero promotional banners |
| **Quizzes** | 5 | Interactive quizzes with loyalty point rewards |
| **FAQ Items** | 14 | Common questions with detailed answers |
| **Banners** | 6 | Marketing banners for various placements |
| **Product Drops** | 3 | Scheduled product releases with linked products |
| **Filter Groups** | 7 | Product filtering facets |
| **Effect Tags** | 13 | Cannabis effect taxonomy (Relaxed, Uplifted, Creative, etc.) |
| **Product Types** | 9 | Product categorization schema |
| **Organizations** | 2 | Multi-tenant org structures |
| **Personalization Rules** | 4 | Dynamic content targeting rules |
| **Theme Configs** | 3 | Brand/store theming (light, dark, store-specific) |
| **Analytics Settings** | 1 | Trend detection configuration |
| **Accessibility Page** | 1 | WCAG compliance documentation |
| **Transparency Page** | 1 | Lab testing & sourcing info |
| **Awards Explainer** | 1 | Industry awards program |
| **Legal Documents** | 4 | Terms, Privacy, Cookie, Age verification |
| **Brands** | 2 | Multi-brand support (Nimbus, AeroWorks) |
| **Stores** | 4 | Physical locations |
| **Products** | 27 | Demo product catalog |

**Total Documents:** 165+

---

## Featured Content Highlights

### 📚 Articles (25)
Complete educational library covering:
- **Flower Guides:** Strain selection, storage, terpene profiles
- **Edibles:** Dosing guides, onset times, safety tips
- **Concentrates:** Live resin vs rosin, dabbing techniques
- **Vapes:** Safety knowledge, hardware guide
- **Tinctures & Topicals:** CBD applications, pain relief
- **Accessories:** Rolling techniques, storage solutions
- **Lifestyle:** Social consumption, travel tips

### 🎯 Quizzes (5 with 24 questions)
Interactive engagement with loyalty point rewards:
1. **Cannabis 101** - 50 points (beginner fundamentals)
2. **Terpenes 101** - 75 points (aromatic compounds)
3. **Edibles Safety** - 75 points (dosing knowledge)
4. **Concentrate Connoisseur** - 100 points (advanced extracts)
5. **Vape Safety** - 75 points (harm reduction)

**Total Available Points:** 375

### 💰 Deals (18)
Diverse promotional content:
- First-time customer discounts (20% off)
- Category-specific deals (BOGO edibles, concentrate Fridays)
- Loyalty member exclusives
- Seasonal promotions (420, holidays)
- Bundle deals (vape starter kits)

### 🏷️ Banners (6)
Strategic placement units:
- Hero welcome banner
- Shop page promotional
- Category highlighting
- Loyalty program promotion
- New arrival announcements
- Deal showcase carousels

---

## Multi-Tenant Architecture

### Organizations
1. **Demo Dispensary Group** - 3 Colorado locations
2. **Nimbus Holdings Corp** - Parent organization for western US

### Brands
1. **Nimbus** - Primary demo brand (light theme)
2. **AeroWorks** - Secondary brand (dark theme)

### Theme Configurations
| Theme | Brand | Mode | Primary Color |
|-------|-------|------|---------------|
| Nimbus Default | Nimbus | Light | #10B981 (Emerald) |
| AeroWorks | AeroWorks | Dark | #3B82F6 (Blue) |
| Downtown Store | Nimbus | Light | #059669 (Dark Emerald) |

---

## Personalization Rules

1. **New Customer - Promote Edibles**
   - Target: Users with <3 purchases who viewed edibles
   - Action: Boost edibles content + BOGO deals

2. **High-Value Customer - Concentrate Upsell**
   - Target: AOV ≥ $100
   - Action: Promote premium concentrates

3. **Wellness Seeker Profile**
   - Target: Tincture category viewers
   - Action: Boost CBD/wellness content

4. **Dormant Customer Re-engagement**
   - Target: 30+ days since last purchase
   - Action: Show welcome-back offers

---

## Legal & Compliance Documents

- **Terms of Service** - Comprehensive service agreement
- **Privacy Policy** - CCPA/GDPR compliant data handling
- **Cookie Policy** - Tracking disclosure with opt-out
- **Age Verification** - 21+ compliance requirements

Additional pages:
- **Accessibility Statement** - WCAG 2.1 AA compliance
- **Transparency Page** - Lab testing, sourcing, and quality standards
- **Awards Explainer** - Industry recognition program details

---

## Filter & Taxonomy System

### Filter Groups (7)
| Key | Title | Type |
|-----|-------|------|
| effects | Effects | Checkbox |
| thcPercent | THC % | Range slider |
| cbdPercent | CBD % | Range slider |
| priceRange | Price | Range slider |
| category | Category | Checkbox |
| brand | Brand | Checkbox |
| terpenes | Terpene Profile | Checkbox |

### Effect Tags (13)
Relaxed, Uplifted, Creative, Energetic, Euphoric, Focused, Happy, Hungry, Sleepy, Tingly, Calm, Social, Pain Relief

### Product Types (9)
Flower, Pre-Roll, Edible, Vape Cartridge, Concentrate, Tincture, Topical, Accessory, Beverage

---

## Scripts for Content Management

Located in `/scripts/`:

| Script | Purpose |
|--------|---------|
| `seedSanityDemoContent.ts` | Initial demo content (43 docs) |
| `seedSanityAdditionalContent.ts` | Category coverage (29 docs) |
| `seedSanityAdminContent.ts` | Admin/system content (52 docs) |
| `fixThemeConfig.ts` | Schema field corrections |
| `enhanceCmsContent.ts` | Content enhancements & audit |

**Run with:** 
```bash
SANITY_WRITE_TOKEN="your_token" npx ts-node scripts/<script>.ts
```

---

## Verification

All content types verified via Sanity API query on 2026-01-22. No schema validation errors. All document relationships (references) are valid.

Studio accessible at: **https://nimbus-cms.sanity.studio/**
