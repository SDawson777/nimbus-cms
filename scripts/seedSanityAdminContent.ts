#!/usr/bin/env npx ts-node
/**
 * Sanity Admin & System Content Seeder
 * 
 * Creates content for operational/admin schema types:
 * - Accessibility Page, Transparency Page, Awards Explainer
 * - Legal Documents (Terms, Privacy, etc.)
 * - Theme Configuration
 * - Analytics Settings
 * - Banners (hero, carousel, promotional)
 * - Product Drops (limited releases)
 * - Organizations, Brands, Stores
 * - Personalization Rules
 * - Product Types
 * - Filter Groups
 * - Effect Tags
 * 
 * Note: Compliance Monitor/Snapshot and Recall Audits are typically 
 * system-generated, not manually seeded.
 */

import { createClient } from "@sanity/client";
import { v4 as uuid } from "uuid";

const SANITY_PROJECT_ID = "ygbu28p2";
const SANITY_DATASET = "nimbus_demo";
const SANITY_TOKEN = process.env.SANITY_WRITE_TOKEN || "";

const client = createClient({
  projectId: SANITY_PROJECT_ID,
  dataset: SANITY_DATASET,
  token: SANITY_TOKEN,
  useCdn: false,
  apiVersion: "2024-08-01",
});

// ============================================================================
// ACCESSIBILITY PAGE
// ============================================================================
const ACCESSIBILITY_PAGE = {
  _id: "accessibility-page-main",
  _type: "accessibilityPage",
  title: "Accessibility Statement",
  body: [
    { _type: "block", _key: uuid(), style: "h2", children: [{ _type: "span", text: "Our Commitment to Accessibility" }] },
    { _type: "block", _key: uuid(), style: "normal", children: [{ _type: "span", text: "We are committed to ensuring digital accessibility for people with disabilities. We continually improve the user experience for everyone and apply the relevant accessibility standards to achieve these goals." }] },
    { _type: "block", _key: uuid(), style: "h2", children: [{ _type: "span", text: "Conformance Status" }] },
    { _type: "block", _key: uuid(), style: "normal", children: [{ _type: "span", text: "We aim to conform to the Web Content Accessibility Guidelines (WCAG) 2.1, Level AA. These guidelines explain how to make web content more accessible for people with disabilities and more user-friendly for everyone." }] },
    { _type: "block", _key: uuid(), style: "h2", children: [{ _type: "span", text: "Accessibility Features" }] },
    { _type: "block", _key: uuid(), style: "normal", children: [{ _type: "span", text: "• Keyboard Navigation: Full site navigation using keyboard only\n• Screen Reader Compatibility: Optimized for JAWS, NVDA, and VoiceOver\n• Text Alternatives: All images include descriptive alt text\n• Color Contrast: Minimum 4.5:1 contrast ratio for text\n• Resizable Text: Content readable at 200% zoom\n• Focus Indicators: Visible focus states for all interactive elements" }] },
    { _type: "block", _key: uuid(), style: "h2", children: [{ _type: "span", text: "Assistive Technologies Supported" }] },
    { _type: "block", _key: uuid(), style: "normal", children: [{ _type: "span", text: "Our website is designed to be compatible with:\n• Screen readers (JAWS, NVDA, VoiceOver, TalkBack)\n• Voice recognition software (Dragon NaturallySpeaking)\n• Screen magnification software\n• Alternative input devices" }] },
    { _type: "block", _key: uuid(), style: "h2", children: [{ _type: "span", text: "Feedback & Contact" }] },
    { _type: "block", _key: uuid(), style: "normal", children: [{ _type: "span", text: "We welcome your feedback on the accessibility of our website. Please let us know if you encounter accessibility barriers:\n\nEmail: accessibility@example.com\nPhone: 1-800-555-0123\n\nWe aim to respond to accessibility feedback within 2 business days." }] },
  ],
};

// ============================================================================
// TRANSPARENCY PAGE
// ============================================================================
const TRANSPARENCY_PAGE = {
  _id: "transparency-page-main",
  _type: "transparencyPage",
  title: "Our Transparency Commitment",
  body: [
    { _type: "block", _key: uuid(), style: "h2", children: [{ _type: "span", text: "Seed-to-Sale Transparency" }] },
    { _type: "block", _key: uuid(), style: "normal", children: [{ _type: "span", text: "Every product we sell can be traced from cultivation to your hands. We believe in complete transparency about what's in your cannabis and how it was produced." }] },
    { _type: "block", _key: uuid(), style: "h2", children: [{ _type: "span", text: "Lab Testing & Quality Assurance" }] },
    { _type: "block", _key: uuid(), style: "normal", children: [{ _type: "span", text: "100% of our products are tested by independent, state-licensed laboratories. Every product is tested for:\n\n• Cannabinoid Potency: THC, CBD, and other cannabinoids\n• Terpene Profiles: Full terpene analysis\n• Pesticide Screening: 66+ pesticides tested\n• Heavy Metals: Lead, arsenic, cadmium, mercury\n• Microbial Contaminants: Mold, bacteria, yeast\n• Residual Solvents: For extracted products\n• Mycotoxins: Aflatoxins and ochratoxins" }] },
    { _type: "block", _key: uuid(), style: "h2", children: [{ _type: "span", text: "How to Access Lab Results" }] },
    { _type: "block", _key: uuid(), style: "normal", children: [{ _type: "span", text: "1. Scan the QR code on any product packaging\n2. View the Certificate of Analysis (COA) on each product page\n3. Ask any budtender to pull up results on their tablet\n4. Search by batch number at our Lab Results portal" }] },
    { _type: "block", _key: uuid(), style: "h2", children: [{ _type: "span", text: "Cultivation Practices" }] },
    { _type: "block", _key: uuid(), style: "normal", children: [{ _type: "span", text: "We partner with cultivators who meet our strict standards:\n\n• Clean Green Certified or equivalent sustainable practices\n• No synthetic pesticides or harmful chemicals\n• Responsible water and energy usage\n• Living wage and fair treatment for workers\n• Regular facility audits and compliance checks" }] },
    { _type: "block", _key: uuid(), style: "h2", children: [{ _type: "span", text: "Pricing Transparency" }] },
    { _type: "block", _key: uuid(), style: "normal", children: [{ _type: "span", text: "We believe in fair, transparent pricing. All prices shown include:\n\n• State excise tax\n• Local cannabis tax\n• Sales tax (where applicable)\n\nNo hidden fees. The price you see is the price you pay." }] },
  ],
};

// ============================================================================
// AWARDS EXPLAINER
// ============================================================================
const AWARDS_EXPLAINER = {
  _id: "awards-explainer-main",
  _type: "awardsExplainer",
  title: "How Our Awards System Works",
  body: [
    { _type: "block", _key: uuid(), style: "h2", children: [{ _type: "span", text: "Earn Points, Get Rewards" }] },
    { _type: "block", _key: uuid(), style: "normal", children: [{ _type: "span", text: "Our loyalty program rewards you for every purchase and engagement. Here's how it works:" }] },
    { _type: "block", _key: uuid(), style: "h2", children: [{ _type: "span", text: "Earning Points" }] },
    { _type: "block", _key: uuid(), style: "normal", children: [{ _type: "span", text: "• 1 point per $1 spent on all purchases\n• 50-100 bonus points for completing educational quizzes\n• 200 points for referring a friend\n• 2X points during promotional events\n• 25 points on your birthday" }] },
    { _type: "block", _key: uuid(), style: "h2", children: [{ _type: "span", text: "Redeeming Rewards" }] },
    { _type: "block", _key: uuid(), style: "normal", children: [{ _type: "span", text: "Points can be redeemed at checkout:\n\n• 100 points = $5 off\n• 200 points = $12 off\n• 500 points = $35 off\n• 1,000 points = $80 off\n\nThe more you save, the better the value!" }] },
    { _type: "block", _key: uuid(), style: "h2", children: [{ _type: "span", text: "Tier Benefits" }] },
    { _type: "block", _key: uuid(), style: "normal", children: [{ _type: "span", text: "🌱 Seedling (0-499 lifetime points): Base earning rate\n🌿 Sprout (500-1,999 points): 1.25x point multiplier\n🌳 Cultivar (2,000-4,999 points): 1.5x multiplier + early access to drops\n👑 Connoisseur (5,000+ points): 2x multiplier + exclusive events + free delivery" }] },
    { _type: "block", _key: uuid(), style: "h2", children: [{ _type: "span", text: "Points Never Expire" }] },
    { _type: "block", _key: uuid(), style: "normal", children: [{ _type: "span", text: "Your points are yours forever. No expiration dates, no tricks. Accumulate rewards at your own pace." }] },
  ],
};

// ============================================================================
// LEGAL DOCUMENTS
// ============================================================================
const LEGAL_DOCS = [
  {
    _id: "legal-terms-v1",
    _type: "legalDoc",
    title: "Terms of Service",
    slug: { _type: "slug", current: "terms-of-service" },
    type: "terms",
    version: "1.0.0",
    effectiveFrom: new Date().toISOString(),
    isPublished: true,
    summary: "These terms govern your use of our website and services. By using our platform, you agree to be bound by these terms.",
    body: [
      { _type: "block", _key: uuid(), style: "h2", children: [{ _type: "span", text: "1. Acceptance of Terms" }] },
      { _type: "block", _key: uuid(), style: "normal", children: [{ _type: "span", text: "By accessing or using our services, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using our services." }] },
      { _type: "block", _key: uuid(), style: "h2", children: [{ _type: "span", text: "2. Age Requirements" }] },
      { _type: "block", _key: uuid(), style: "normal", children: [{ _type: "span", text: "You must be at least 21 years of age to use our services for recreational cannabis, or 18 years of age with a valid medical cannabis card where applicable by state law. By using our services, you represent and warrant that you meet these age requirements." }] },
      { _type: "block", _key: uuid(), style: "h2", children: [{ _type: "span", text: "3. Account Responsibility" }] },
      { _type: "block", _key: uuid(), style: "normal", children: [{ _type: "span", text: "You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use." }] },
      { _type: "block", _key: uuid(), style: "h2", children: [{ _type: "span", text: "4. Prohibited Uses" }] },
      { _type: "block", _key: uuid(), style: "normal", children: [{ _type: "span", text: "You may not use our services: (a) for any unlawful purpose; (b) to solicit others to perform unlawful acts; (c) to violate any regulations; (d) to infringe upon our intellectual property rights; (e) to harass or discriminate; (f) to submit false information; (g) to upload malicious code." }] },
      { _type: "block", _key: uuid(), style: "h2", children: [{ _type: "span", text: "5. Limitation of Liability" }] },
      { _type: "block", _key: uuid(), style: "normal", children: [{ _type: "span", text: "To the maximum extent permitted by law, we shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of our services." }] },
    ],
  },
  {
    _id: "legal-privacy-v1",
    _type: "legalDoc",
    title: "Privacy Policy",
    slug: { _type: "slug", current: "privacy-policy" },
    type: "privacy",
    version: "1.0.0",
    effectiveFrom: new Date().toISOString(),
    isPublished: true,
    summary: "This policy describes how we collect, use, and protect your personal information when you use our services.",
    body: [
      { _type: "block", _key: uuid(), style: "h2", children: [{ _type: "span", text: "1. Information We Collect" }] },
      { _type: "block", _key: uuid(), style: "normal", children: [{ _type: "span", text: "We collect information you provide directly: name, email, phone, date of birth (for age verification), and address for delivery. We also collect usage data: browsing history, purchase history, and device information." }] },
      { _type: "block", _key: uuid(), style: "h2", children: [{ _type: "span", text: "2. How We Use Your Information" }] },
      { _type: "block", _key: uuid(), style: "normal", children: [{ _type: "span", text: "• Process orders and provide customer service\n• Verify your age and identity as required by law\n• Send order updates and marketing (with consent)\n• Improve our products and services\n• Comply with legal obligations" }] },
      { _type: "block", _key: uuid(), style: "h2", children: [{ _type: "span", text: "3. Data Retention" }] },
      { _type: "block", _key: uuid(), style: "normal", children: [{ _type: "span", text: "We retain your data as required by state cannabis tracking regulations (typically 7 years for transaction records). You may request deletion of non-regulated data at any time." }] },
      { _type: "block", _key: uuid(), style: "h2", children: [{ _type: "span", text: "4. Your Rights" }] },
      { _type: "block", _key: uuid(), style: "normal", children: [{ _type: "span", text: "You have the right to: access your personal data, correct inaccuracies, request deletion (subject to legal requirements), opt out of marketing communications, and request a copy of your data." }] },
      { _type: "block", _key: uuid(), style: "h2", children: [{ _type: "span", text: "5. Contact Us" }] },
      { _type: "block", _key: uuid(), style: "normal", children: [{ _type: "span", text: "For privacy inquiries: privacy@example.com" }] },
    ],
  },
  {
    _id: "legal-returns-v1",
    _type: "legalDoc",
    title: "Return & Exchange Policy",
    slug: { _type: "slug", current: "return-policy" },
    type: "returns",
    version: "1.0.0",
    effectiveFrom: new Date().toISOString(),
    isPublished: true,
    summary: "Due to state regulations, cannabis products cannot be returned. Defective products may be eligible for exchange or store credit.",
    body: [
      { _type: "block", _key: uuid(), style: "h2", children: [{ _type: "span", text: "Cannabis Product Returns" }] },
      { _type: "block", _key: uuid(), style: "normal", children: [{ _type: "span", text: "Due to state cannabis regulations, we cannot accept returns of cannabis products once purchased. All sales of cannabis products are final." }] },
      { _type: "block", _key: uuid(), style: "h2", children: [{ _type: "span", text: "Defective Products" }] },
      { _type: "block", _key: uuid(), style: "normal", children: [{ _type: "span", text: "If you receive a defective product (non-functional cartridge, damaged packaging, etc.), contact us within 24 hours with your receipt. We will evaluate and may offer store credit or exchange at our discretion." }] },
      { _type: "block", _key: uuid(), style: "h2", children: [{ _type: "span", text: "Accessories & Non-Cannabis Items" }] },
      { _type: "block", _key: uuid(), style: "normal", children: [{ _type: "span", text: "Unopened accessories may be returned within 14 days with original receipt for a full refund. Items must be in original, sealed packaging." }] },
    ],
  },
  {
    _id: "legal-agegate-v1",
    _type: "legalDoc",
    title: "Age Verification Policy",
    slug: { _type: "slug", current: "age-verification" },
    type: "ageGate",
    version: "1.0.0",
    effectiveFrom: new Date().toISOString(),
    isPublished: true,
    summary: "You must be 21+ for recreational cannabis or 18+ with valid medical card. Valid government ID required.",
    body: [
      { _type: "block", _key: uuid(), style: "h2", children: [{ _type: "span", text: "Age Requirements" }] },
      { _type: "block", _key: uuid(), style: "normal", children: [{ _type: "span", text: "• Recreational Cannabis: You must be 21 years of age or older\n• Medical Cannabis: 18+ with valid state-issued medical cannabis card\n• Accessories: 21+ in most jurisdictions" }] },
      { _type: "block", _key: uuid(), style: "h2", children: [{ _type: "span", text: "Acceptable Identification" }] },
      { _type: "block", _key: uuid(), style: "normal", children: [{ _type: "span", text: "• State-issued driver's license\n• State-issued ID card\n• U.S. Passport or Passport Card\n• Military ID\n• Tribal ID (state-dependent)\n\nExpired IDs are not accepted. IDs must be physical, not digital copies." }] },
    ],
  },
];

// ============================================================================
// THEME CONFIGURATION
// ============================================================================
const THEME_CONFIG = {
  _id: "theme-config-demo",
  _type: "themeConfig",
  brandSlug: "demo-operator",
  primaryColor: "#10B981",
  secondaryColor: "#6366F1",
  accentColor: "#F59E0B",
  backgroundColor: "#FFFFFF",
  surfaceColor: "#F9FAFB",
  textColor: "#111827",
  textSecondaryColor: "#6B7280",
  fontHeading: "Inter",
  fontBody: "Inter",
  borderRadius: "8px",
  logoUrl: "https://placehold.co/200x60/10B981/FFFFFF?text=NIMBUS",
  faviconUrl: "https://placehold.co/32x32/10B981/FFFFFF?text=N",
};

// ============================================================================
// ANALYTICS SETTINGS
// ============================================================================
const ANALYTICS_SETTINGS = {
  _id: "analytics-settings-demo",
  _type: "analyticsSettings",
  orgSlug: "demo-operator",
  windowDays: 30,
  recentDays: 7,
  wRecentClicks: 2.5,
  wRecentViews: 0.2,
  wHistoricClicks: 1.0,
  wHistoricViews: 0.05,
  thresholdRising: 200,
  thresholdSteady: 40,
  thresholdFalling: 10,
};

// ============================================================================
// BANNERS - Hero, Carousel, Promotional
// ============================================================================
const BANNERS = [
  {
    _id: "banner-hero-welcome",
    _type: "banner",
    title: "Welcome Hero Banner",
    headline: "Premium Cannabis, Exceptional Experience",
    subheadline: "Discover lab-tested, hand-selected products from trusted cultivators.",
    ctaText: "Shop Now",
    ctaLink: "/shop",
    ctaStyle: "primary",
    placement: "home.hero",
    priority: 100,
    isActive: true,
    schedule: { publishAt: new Date().toISOString(), isScheduled: true },
  },
  {
    _id: "banner-hero-420",
    _type: "banner",
    title: "420 Celebration Hero",
    headline: "420 Celebration Week",
    subheadline: "20% off storewide + exclusive drops. Use code 420WEEK.",
    ctaText: "Shop the Sale",
    ctaLink: "/deals",
    ctaStyle: "primary",
    placement: "home.hero",
    priority: 90,
    isActive: true,
    schedule: { isScheduled: false },
  },
  {
    _id: "banner-carousel-newdrops",
    _type: "banner",
    title: "New Arrivals Carousel",
    headline: "Fresh Drops Weekly",
    subheadline: "Be the first to try new strains and products.",
    ctaText: "See What's New",
    ctaLink: "/new-arrivals",
    ctaStyle: "secondary",
    placement: "home.carousel",
    priority: 80,
    isActive: true,
    schedule: { isScheduled: false },
  },
  {
    _id: "banner-carousel-loyalty",
    _type: "banner",
    title: "Loyalty Program Carousel",
    headline: "Earn While You Shop",
    subheadline: "Join our rewards program and earn points on every purchase.",
    ctaText: "Learn More",
    ctaLink: "/rewards",
    ctaStyle: "secondary",
    placement: "home.carousel",
    priority: 70,
    isActive: true,
    schedule: { isScheduled: false },
  },
  {
    _id: "banner-shop-edibles",
    _type: "banner",
    title: "Edibles Category Banner",
    headline: "Explore Edibles",
    subheadline: "Gummies, chocolates, beverages & more. Precisely dosed.",
    ctaText: "Shop Edibles",
    ctaLink: "/shop/edibles",
    ctaStyle: "primary",
    placement: "shop.top",
    priority: 60,
    isActive: true,
    schedule: { isScheduled: false },
  },
  {
    _id: "banner-cart-upsell",
    _type: "banner",
    title: "Cart Upsell - Free Delivery",
    headline: "Free Delivery on Orders $75+",
    subheadline: "Add a little more to unlock free delivery.",
    ctaText: "Keep Shopping",
    ctaLink: "/shop",
    ctaStyle: "link",
    placement: "cart.upsell",
    priority: 50,
    isActive: true,
    schedule: { isScheduled: false },
  },
];

// ============================================================================
// PRODUCT DROPS - Limited Releases
// ============================================================================
const PRODUCT_DROPS = [
  {
    _id: "drop-summer-2026",
    _type: "drop",
    title: "Summer 2026 Collection",
    dropDate: new Date("2026-06-21T12:00:00Z").toISOString(),
    highlight: "Exclusive summer strains and limited-edition merchandise. Get them before they're gone!",
  },
  {
    _id: "drop-holiday-2025",
    _type: "drop",
    title: "Holiday Gift Box 2025",
    dropDate: new Date("2025-12-01T10:00:00Z").toISOString(),
    highlight: "Curated gift sets featuring premium flower, edibles, and accessories. Perfect for the cannabis enthusiast.",
  },
  {
    _id: "drop-collab-genetix",
    _type: "drop",
    title: "Exclusive Collab: Exotic Genetix",
    dropDate: new Date("2026-02-14T09:00:00Z").toISOString(),
    highlight: "Limited partnership with Exotic Genetix bringing you exclusive, never-before-seen cultivars.",
  },
];

// ============================================================================
// ORGANIZATIONS
// ============================================================================
const ORGANIZATIONS = [
  {
    _id: "org-nimbus-holdings",
    _type: "organization",
    name: "Nimbus Holdings Corp",
    slug: { _type: "slug", current: "nimbus-holdings" },
    primaryContact: "operations@nimbusholdings.example.com",
    notes: "Parent organization operating multiple cannabis retail brands across the western United States.",
  },
  {
    _id: "org-demo-operator",
    _type: "organization",
    name: "Demo Dispensary Group",
    slug: { _type: "slug", current: "demo-operator" },
    primaryContact: "admin@demo-dispensary.example.com",
    notes: "Demo organization for showcasing multi-tenant CMS capabilities. Operates 3 stores in Colorado.",
  },
];

// ============================================================================
// PERSONALIZATION RULES
// ============================================================================
const PERSONALIZATION_RULES = [
  {
    _id: "rule-new-customer-edibles",
    _type: "personalizationRule",
    name: "New Customer - Promote Edibles",
    description: "Boost edibles content for customers with low purchase history (first-time or infrequent shoppers)",
    enabled: true,
    conditions: [
      { key: "purchaseCount", operator: "lessThan", value: "3" },
      { key: "hasViewedEdibles", operator: "equals", value: "true" },
    ],
    actions: [
      { targetType: "article", targetSlugOrKey: "edibles-dosing-guide", priorityBoost: 50, channel: "mobile" },
      { targetType: "deal", targetSlugOrKey: "bogo-edibles", priorityBoost: 40 },
    ],
  },
  {
    _id: "rule-high-value-concentrates",
    _type: "personalizationRule",
    name: "High-Value Customer - Concentrate Upsell",
    description: "Show premium concentrate content to customers with high average order value",
    enabled: true,
    conditions: [
      { key: "avgOrderValue", operator: "greaterThanOrEqual", value: "100" },
    ],
    actions: [
      { targetType: "productCategory", targetSlugOrKey: "concentrates", priorityBoost: 30 },
      { targetType: "article", targetSlugOrKey: "live-resin-vs-rosin", priorityBoost: 40 },
    ],
  },
  {
    _id: "rule-wellness-seeker",
    _type: "personalizationRule",
    name: "Wellness Seeker Profile",
    description: "Boost CBD and wellness content for users who frequently browse tinctures and topicals",
    enabled: true,
    conditions: [
      { key: "categoryViews.tincture", operator: "greaterThanOrEqual", value: "5" },
    ],
    actions: [
      { targetType: "article", targetSlugOrKey: "cbd-beginners-guide", priorityBoost: 60 },
      { targetType: "article", targetSlugOrKey: "cannabis-for-sleep", priorityBoost: 50 },
      { targetType: "deal", targetSlugOrKey: "tincture-tuesday", priorityBoost: 40 },
    ],
  },
  {
    _id: "rule-dormant-reengagement",
    _type: "personalizationRule",
    name: "Dormant Customer Re-engagement",
    description: "Target customers who haven't purchased in 30+ days with special offers",
    enabled: true,
    conditions: [
      { key: "daysSinceLastPurchase", operator: "greaterThanOrEqual", value: "30" },
    ],
    actions: [
      { targetType: "deal", targetSlugOrKey: "first-time-20-off", priorityBoost: 80 },
      { targetType: "banner", targetSlugOrKey: "banner-hero-welcome", priorityBoost: 50 },
    ],
  },
];

// ============================================================================
// PRODUCT TYPES
// ============================================================================
const PRODUCT_TYPES = [
  { _id: "producttype-flower", _type: "productType", title: "Flower", description: "Premium cannabis flower including indica, sativa, and hybrid strains. Hand-trimmed, lab-tested buds." },
  { _id: "producttype-preroll", _type: "productType", title: "Pre-Roll", description: "Ready-to-smoke joints and blunts. Singles and multi-packs available." },
  { _id: "producttype-edible", _type: "productType", title: "Edible", description: "Cannabis-infused foods and beverages including gummies, chocolates, drinks, and baked goods." },
  { _id: "producttype-vape", _type: "productType", title: "Vape", description: "Vaporizer cartridges, disposables, and pods. Multiple oil types available." },
  { _id: "producttype-concentrate", _type: "productType", title: "Concentrate", description: "Cannabis extracts including wax, shatter, live resin, rosin, and diamonds." },
  { _id: "producttype-tincture", _type: "productType", title: "Tincture", description: "Sublingual drops and oils for precise, fast-acting dosing." },
  { _id: "producttype-topical", _type: "productType", title: "Topical", description: "Lotions, balms, salves, and transdermal patches for external application." },
  { _id: "producttype-capsule", _type: "productType", title: "Capsule", description: "Cannabis-infused capsules and pills for easy, discreet consumption." },
  { _id: "producttype-accessory", _type: "productType", title: "Accessory", description: "Vaporizers, grinders, rolling supplies, storage, and lifestyle products." },
];

// ============================================================================
// FILTER GROUPS - Product Browsing Facets
// ============================================================================
const FILTER_GROUPS = [
  {
    _id: "filtergroup-effects",
    _type: "filterGroup",
    key: "effects",
    title: "Effects",
    slug: { _type: "slug", current: "effects" },
    description: "Filter by desired effects and feelings",
    filterType: "checkbox",
    displayOrder: 1,
    icon: "sparkles",
    iconEmoji: "✨",
    color: "#8B5CF6",
    isActive: true,
  },
  {
    _id: "filtergroup-thc",
    _type: "filterGroup",
    key: "thcPercent",
    title: "THC %",
    slug: { _type: "slug", current: "thc-percent" },
    description: "Filter by THC potency range",
    filterType: "range",
    displayOrder: 2,
    icon: "chart-bar",
    iconEmoji: "📊",
    color: "#10B981",
    isActive: true,
  },
  {
    _id: "filtergroup-cbd",
    _type: "filterGroup",
    key: "cbdPercent",
    title: "CBD %",
    slug: { _type: "slug", current: "cbd-percent" },
    description: "Filter by CBD content",
    filterType: "range",
    displayOrder: 3,
    icon: "heart",
    iconEmoji: "💚",
    color: "#06B6D4",
    isActive: true,
  },
  {
    _id: "filtergroup-price",
    _type: "filterGroup",
    key: "priceRange",
    title: "Price",
    slug: { _type: "slug", current: "price-range" },
    description: "Filter by price range",
    filterType: "range",
    displayOrder: 4,
    icon: "currency-dollar",
    iconEmoji: "💰",
    color: "#F59E0B",
    isActive: true,
  },
  {
    _id: "filtergroup-strain",
    _type: "filterGroup",
    key: "strainType",
    title: "Strain Type",
    slug: { _type: "slug", current: "strain-type" },
    description: "Filter by indica, sativa, or hybrid",
    filterType: "checkbox",
    displayOrder: 5,
    icon: "leaf",
    iconEmoji: "🌿",
    color: "#22C55E",
    isActive: true,
  },
  {
    _id: "filtergroup-brand",
    _type: "filterGroup",
    key: "brand",
    title: "Brand",
    slug: { _type: "slug", current: "brand" },
    description: "Filter by product brand",
    filterType: "checkbox",
    displayOrder: 6,
    icon: "tag",
    iconEmoji: "🏷️",
    color: "#6366F1",
    isActive: true,
  },
  {
    _id: "filtergroup-terpene",
    _type: "filterGroup",
    key: "dominantTerpene",
    title: "Terpene",
    slug: { _type: "slug", current: "dominant-terpene" },
    description: "Filter by dominant terpene profile",
    filterType: "checkbox",
    displayOrder: 7,
    icon: "beaker",
    iconEmoji: "🧪",
    color: "#EC4899",
    isActive: true,
  },
];

// ============================================================================
// EFFECT TAGS - Product Effect Metadata
// ============================================================================
const EFFECT_TAGS = [
  {
    _id: "effect-relaxed",
    _type: "effectTag",
    key: "relaxed",
    title: "Relaxed",
    slug: { _type: "slug", current: "relaxed" },
    description: "Calming effects that ease tension and promote tranquility. Great for unwinding after a long day.",
    icon: "moon",
    iconEmoji: "😌",
    color: "#6366F1",
    boostWeight: 1.0,
  },
  {
    _id: "effect-energetic",
    _type: "effectTag",
    key: "energetic",
    title: "Energetic",
    slug: { _type: "slug", current: "energetic" },
    description: "Uplifting effects that boost energy and motivation. Perfect for daytime use and activities.",
    icon: "sun",
    iconEmoji: "⚡",
    color: "#F59E0B",
    boostWeight: 1.0,
  },
  {
    _id: "effect-creative",
    _type: "effectTag",
    key: "creative",
    title: "Creative",
    slug: { _type: "slug", current: "creative" },
    description: "Enhances creativity and opens the mind to new ideas. Favored by artists and musicians.",
    icon: "lightbulb",
    iconEmoji: "🎨",
    color: "#EC4899",
    boostWeight: 1.0,
  },
  {
    _id: "effect-focused",
    _type: "effectTag",
    key: "focused",
    title: "Focused",
    slug: { _type: "slug", current: "focused" },
    description: "Sharpens concentration and mental clarity. Useful for work, study, or detailed tasks.",
    icon: "target",
    iconEmoji: "🎯",
    color: "#10B981",
    boostWeight: 1.0,
  },
  {
    _id: "effect-euphoric",
    _type: "effectTag",
    key: "euphoric",
    title: "Euphoric",
    slug: { _type: "slug", current: "euphoric" },
    description: "Produces feelings of happiness and bliss. Elevates mood and promotes positivity.",
    icon: "star",
    iconEmoji: "🌟",
    color: "#8B5CF6",
    boostWeight: 1.0,
  },
  {
    _id: "effect-sleepy",
    _type: "effectTag",
    key: "sleepy",
    title: "Sleepy",
    slug: { _type: "slug", current: "sleepy" },
    description: "Strong sedating effects ideal for nighttime use. Helps with insomnia and sleep difficulties.",
    icon: "moon",
    iconEmoji: "😴",
    color: "#1E40AF",
    boostWeight: 1.0,
  },
  {
    _id: "effect-hungry",
    _type: "effectTag",
    key: "hungry",
    title: "Hungry",
    slug: { _type: "slug", current: "hungry" },
    description: "Stimulates appetite, commonly known as 'the munchies.' Helpful for medical patients needing appetite support.",
    icon: "cake",
    iconEmoji: "🍴",
    color: "#EA580C",
    boostWeight: 0.8,
  },
  {
    _id: "effect-talkative",
    _type: "effectTag",
    key: "talkative",
    title: "Talkative",
    slug: { _type: "slug", current: "talkative" },
    description: "Promotes sociability and conversation. Great for social gatherings and connecting with friends.",
    icon: "chat",
    iconEmoji: "💬",
    color: "#0EA5E9",
    boostWeight: 0.9,
  },
  {
    _id: "effect-giggly",
    _type: "effectTag",
    key: "giggly",
    title: "Giggly",
    slug: { _type: "slug", current: "giggly" },
    description: "Induces laughter and lightheartedness. Makes everything a little funnier.",
    icon: "face-smile",
    iconEmoji: "😂",
    color: "#FACC15",
    boostWeight: 0.9,
  },
  {
    _id: "effect-uplifted",
    _type: "effectTag",
    key: "uplifted",
    title: "Uplifted",
    slug: { _type: "slug", current: "uplifted" },
    description: "Raises spirits and improves overall mood. Counters feelings of sadness or heaviness.",
    icon: "arrow-up",
    iconEmoji: "🙌",
    color: "#22D3EE",
    boostWeight: 1.0,
  },
  {
    _id: "effect-calm",
    _type: "effectTag",
    key: "calm",
    title: "Calm",
    slug: { _type: "slug", current: "calm" },
    description: "Gentle soothing effects without heavy sedation. Good for anxiety relief while remaining functional.",
    icon: "leaf",
    iconEmoji: "🧘",
    color: "#84CC16",
    boostWeight: 1.0,
  },
  {
    _id: "effect-tingly",
    _type: "effectTag",
    key: "tingly",
    title: "Tingly",
    slug: { _type: "slug", current: "tingly" },
    description: "Produces pleasant physical sensations throughout the body. Often associated with body-high effects.",
    icon: "sparkles",
    iconEmoji: "✨",
    color: "#A855F7",
    boostWeight: 0.8,
  },
];

// ============================================================================
// MAIN SEEDING FUNCTION
// ============================================================================
async function seedAdminContent() {
  console.log("🏢 Starting Admin & System Content Seed...\n");

  const allDocuments = [
    ACCESSIBILITY_PAGE,
    TRANSPARENCY_PAGE,
    AWARDS_EXPLAINER,
    ...LEGAL_DOCS,
    THEME_CONFIG,
    ANALYTICS_SETTINGS,
    ...BANNERS,
    ...PRODUCT_DROPS,
    ...ORGANIZATIONS,
    ...PERSONALIZATION_RULES,
    ...PRODUCT_TYPES,
    ...FILTER_GROUPS,
    ...EFFECT_TAGS,
  ];

  console.log(`📦 Preparing ${allDocuments.length} admin/system documents:`);
  console.log(`   • 1 Accessibility Page`);
  console.log(`   • 1 Transparency Page`);
  console.log(`   • 1 Awards Explainer`);
  console.log(`   • ${LEGAL_DOCS.length} Legal Documents`);
  console.log(`   • 1 Theme Configuration`);
  console.log(`   • 1 Analytics Settings`);
  console.log(`   • ${BANNERS.length} Banners`);
  console.log(`   • ${PRODUCT_DROPS.length} Product Drops`);
  console.log(`   • ${ORGANIZATIONS.length} Organizations`);
  console.log(`   • ${PERSONALIZATION_RULES.length} Personalization Rules`);
  console.log(`   • ${PRODUCT_TYPES.length} Product Types`);
  console.log(`   • ${FILTER_GROUPS.length} Filter Groups`);
  console.log(`   • ${EFFECT_TAGS.length} Effect Tags\n`);

  let transaction = client.transaction();

  for (const doc of allDocuments) {
    transaction = transaction.createOrReplace(doc as any);
  }

  try {
    const result = await transaction.commit();
    console.log(`✅ Successfully seeded ${result.documentIds?.length || allDocuments.length} admin documents!`);
    console.log("\n📋 Note: The following are system-generated and not manually seeded:");
    console.log("   • Compliance Monitor (auto-populated by compliance checks)");
    console.log("   • Compliance Snapshot (auto-populated by compliance checks)");
    console.log("   • Product Recall Audit (auto-populated by recall events)");
    console.log("   • Variant Inventory (synced from POS/inventory system)");
    console.log("\n🎉 Full admin content is now complete!");
    console.log("   View at: https://nimbus-cms.sanity.studio/\n");
  } catch (error) {
    console.error("❌ Error seeding content:", error);
    process.exit(1);
  }
}

seedAdminContent().catch(console.error);
