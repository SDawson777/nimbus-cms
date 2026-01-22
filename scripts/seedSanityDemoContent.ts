#!/usr/bin/env npx ts-node
/**
 * Sanity Demo Content Seeder - Enterprise CMS Showcase
 * 
 * Creates comprehensive demo content to WOW potential buyers:
 * - Authors (industry experts, educators, medical professionals)
 * - Categories (all product types with rich metadata)
 * - Articles (education, strain guides, wellness, lifestyle)
 * - Deals (happy hour, loyalty, new customer, flash sales)
 * - Promos (seasonal campaigns, product launches)
 * - FAQ Items (customer support, compliance, education)
 * - Quiz (educational with loyalty point rewards)
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
// AUTHORS - Cannabis Industry Experts
// ============================================================================
const AUTHORS = [
  {
    _id: "author-dr-maya-chen",
    _type: "author",
    name: "Dr. Maya Chen",
    bio: "Board-certified pharmacologist with 15+ years researching cannabinoid therapeutics. Former Stanford researcher, now leading cannabis science education initiatives.",
  },
  {
    _id: "author-jordan-rivers",
    _type: "author",
    name: "Jordan Rivers",
    bio: "Award-winning cannabis sommelier and cultivar expert. Certified by the Trichome Institute with expertise in terpene profiles and strain genetics.",
  },
  {
    _id: "author-alex-martinez",
    _type: "author",
    name: "Alex Martinez",
    bio: "Former dispensary manager turned cannabis educator. 8 years in retail operations, passionate about responsible consumption education.",
  },
  {
    _id: "author-sam-wellness",
    _type: "author",
    name: "Sam Wellness",
    bio: "Holistic wellness practitioner integrating cannabis into therapeutic routines. Yoga instructor and mindfulness coach specializing in plant medicine.",
  },
  {
    _id: "author-chef-antoine",
    _type: "author",
    name: "Chef Antoine Dubois",
    bio: "Michelin-trained chef pioneering cannabis-infused culinary arts. Creator of dosing guides and gourmet edible recipes for the modern consumer.",
  },
];

// ============================================================================
// CATEGORIES - Product Taxonomy with Rich Metadata
// ============================================================================
const CATEGORIES = [
  {
    _id: "category-flower",
    _type: "category",
    key: "Flower",
    title: "Premium Flower",
    slug: { _type: "slug", current: "flower" },
    description: "Hand-trimmed, lab-tested cannabis flower. From classic strains to exclusive cultivars, discover the plant in its purest form.",
    icon: "🌿",
    sortOrder: 1,
  },
  {
    _id: "category-edibles",
    _type: "category",
    key: "Edibles",
    title: "Edibles & Infused",
    slug: { _type: "slug", current: "edibles" },
    description: "Precisely dosed gummies, chocolates, beverages, and culinary creations. Long-lasting effects with delicious delivery.",
    icon: "🍫",
    sortOrder: 2,
  },
  {
    _id: "category-vape",
    _type: "category",
    key: "Vape",
    title: "Vape & Cartridges",
    slug: { _type: "slug", current: "vape" },
    description: "Premium vape cartridges, disposables, and pod systems. Clean extraction, smooth vapor, consistent dosing.",
    icon: "💨",
    sortOrder: 3,
  },
  {
    _id: "category-concentrate",
    _type: "category",
    key: "Concentrate",
    title: "Concentrates",
    slug: { _type: "slug", current: "concentrates" },
    description: "Artisan extracts including live resin, rosin, diamonds, and wax. For experienced consumers seeking potency and flavor.",
    icon: "💎",
    sortOrder: 4,
  },
  {
    _id: "category-preroll",
    _type: "category",
    key: "PreRoll",
    title: "Pre-Rolls",
    slug: { _type: "slug", current: "pre-rolls" },
    description: "Ready-to-enjoy joints and blunts. From classic singles to infused multi-packs, convenience meets quality.",
    icon: "🚬",
    sortOrder: 5,
  },
  {
    _id: "category-topical",
    _type: "category",
    key: "Topical",
    title: "Topicals & Balms",
    slug: { _type: "slug", current: "topicals" },
    description: "Therapeutic lotions, balms, and transdermal patches. Targeted relief without psychoactive effects.",
    icon: "🧴",
    sortOrder: 6,
  },
  {
    _id: "category-tincture",
    _type: "category",
    key: "Tincture",
    title: "Tinctures & Oils",
    slug: { _type: "slug", current: "tinctures" },
    description: "Sublingual drops and oils for precise dosing. Fast-acting with easy dose control.",
    icon: "💧",
    sortOrder: 7,
  },
  {
    _id: "category-gear",
    _type: "category",
    key: "Gear",
    title: "Accessories & Gear",
    slug: { _type: "slug", current: "gear" },
    description: "Premium accessories including vaporizers, storage solutions, rolling supplies, and lifestyle products.",
    icon: "🎒",
    sortOrder: 8,
  },
];

// ============================================================================
// ARTICLES - Educational Content Across Categories
// ============================================================================
const ARTICLES = [
  // === FLOWER EDUCATION ===
  {
    _id: "article-understanding-terpenes",
    _type: "article",
    title: "The Complete Guide to Cannabis Terpenes",
    slug: { _type: "slug", current: "understanding-terpenes" },
    excerpt: "Discover how terpenes shape your cannabis experience—from the calming effects of myrcene to the energizing properties of limonene. Learn to choose strains by their terpene profiles.",
    publishedAt: new Date().toISOString(),
    category: { _type: "reference", _ref: "category-flower" },
    author: { _type: "reference", _ref: "author-jordan-rivers" },
    readingTime: "8 min read",
    tags: ["terpenes", "education", "flower", "strain-selection"],
    channels: ["mobile", "web"],
    body: [
      { _type: "block", _key: uuid(), style: "h2", children: [{ _type: "span", text: "What Are Terpenes?" }] },
      { _type: "block", _key: uuid(), style: "normal", children: [{ _type: "span", text: "Terpenes are aromatic compounds found in many plants, including cannabis. They're responsible for the distinctive smells and flavors of different strains—from the piney scent of Jack Herer to the citrusy notes of Super Lemon Haze." }] },
      { _type: "block", _key: uuid(), style: "h2", children: [{ _type: "span", text: "The Entourage Effect" }] },
      { _type: "block", _key: uuid(), style: "normal", children: [{ _type: "span", text: "Research suggests terpenes work synergistically with cannabinoids like THC and CBD to modulate and enhance effects. This 'entourage effect' means the whole plant often delivers better results than isolated compounds." }] },
      { _type: "block", _key: uuid(), style: "h2", children: [{ _type: "span", text: "Top 5 Cannabis Terpenes" }] },
      { _type: "block", _key: uuid(), style: "normal", children: [{ _type: "span", text: "1. Myrcene - Earthy, musky. Found in mangoes. Promotes relaxation.\n2. Limonene - Citrus, lemon. Elevates mood and relieves stress.\n3. Pinene - Pine, forest. Enhances alertness and memory.\n4. Linalool - Floral, lavender. Calming and anti-anxiety.\n5. Caryophyllene - Spicy, peppery. Anti-inflammatory properties." }] },
    ],
  },
  {
    _id: "article-indica-vs-sativa",
    _type: "article",
    title: "Indica vs. Sativa: The Truth About Cannabis Classification",
    slug: { _type: "slug", current: "indica-vs-sativa-truth" },
    excerpt: "Move beyond the outdated indica/sativa binary. Learn what actually determines a strain's effects and how to choose the right cultivar for your needs.",
    publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    category: { _type: "reference", _ref: "category-flower" },
    author: { _type: "reference", _ref: "author-dr-maya-chen" },
    readingTime: "6 min read",
    tags: ["education", "strains", "indica", "sativa", "hybrid"],
    channels: ["mobile", "web", "kiosk"],
    body: [
      { _type: "block", _key: uuid(), style: "h2", children: [{ _type: "span", text: "The Myth of Indica = Sleepy, Sativa = Energetic" }] },
      { _type: "block", _key: uuid(), style: "normal", children: [{ _type: "span", text: "For decades, consumers have been told indica strains are sedating while sativas are uplifting. Modern cannabis science reveals this classification system is botanically meaningful but pharmacologically limited." }] },
      { _type: "block", _key: uuid(), style: "h2", children: [{ _type: "span", text: "What Actually Matters" }] },
      { _type: "block", _key: uuid(), style: "normal", children: [{ _type: "span", text: "Your experience is determined by: 1) Cannabinoid profile (THC:CBD ratio), 2) Terpene content, 3) Your individual endocannabinoid system, and 4) Consumption method. Focus on these factors rather than indica/sativa labels." }] },
    ],
  },
  // === EDIBLES EDUCATION ===
  {
    _id: "article-edibles-dosing-guide",
    _type: "article",
    title: "First-Time Edibles: The Complete Dosing Guide",
    slug: { _type: "slug", current: "edibles-dosing-guide" },
    excerpt: "Start low, go slow—but what does that actually mean? Our evidence-based guide helps you find your perfect edible dose safely.",
    publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    category: { _type: "reference", _ref: "category-edibles" },
    author: { _type: "reference", _ref: "author-dr-maya-chen" },
    readingTime: "7 min read",
    tags: ["edibles", "dosing", "beginners", "safety"],
    channels: ["mobile", "web"],
    body: [
      { _type: "block", _key: uuid(), style: "h2", children: [{ _type: "span", text: "Understanding Edible Potency" }] },
      { _type: "block", _key: uuid(), style: "normal", children: [{ _type: "span", text: "Unlike smoking or vaping, edibles are processed through your digestive system and liver, converting THC to 11-hydroxy-THC—a more potent metabolite. This is why edibles feel stronger and last longer (4-8 hours vs 1-3 hours for inhalation)." }] },
      { _type: "block", _key: uuid(), style: "h2", children: [{ _type: "span", text: "Recommended Starting Doses" }] },
      { _type: "block", _key: uuid(), style: "normal", children: [{ _type: "span", text: "• New consumers: 2.5-5mg THC\n• Occasional consumers: 5-10mg THC\n• Regular consumers: 10-25mg THC\n• High tolerance: 25-50mg+ THC\n\nAlways wait at least 2 hours before taking more. Effects can take 30 minutes to 2 hours to onset." }] },
    ],
  },
  {
    _id: "article-cooking-with-cannabis",
    _type: "article",
    title: "Gourmet Cannabis: Infusion Techniques from a Michelin Chef",
    slug: { _type: "slug", current: "cooking-with-cannabis" },
    excerpt: "Elevate your edibles beyond brownies. Learn professional techniques for infusing oils, butters, and creating restaurant-quality cannabis cuisine.",
    publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    category: { _type: "reference", _ref: "category-edibles" },
    author: { _type: "reference", _ref: "author-chef-antoine" },
    readingTime: "12 min read",
    tags: ["edibles", "cooking", "recipes", "infusion"],
    channels: ["mobile", "web"],
    body: [
      { _type: "block", _key: uuid(), style: "h2", children: [{ _type: "span", text: "The Science of Decarboxylation" }] },
      { _type: "block", _key: uuid(), style: "normal", children: [{ _type: "span", text: "Raw cannabis contains THCA, which isn't psychoactive. Heat converts THCA to THC through decarboxylation. The ideal conditions: 240°F (115°C) for 40 minutes. Too hot destroys cannabinoids; too cool leaves them inactive." }] },
      { _type: "block", _key: uuid(), style: "h2", children: [{ _type: "span", text: "Fat-Based Infusions" }] },
      { _type: "block", _key: uuid(), style: "normal", children: [{ _type: "span", text: "Cannabinoids are fat-soluble. High-fat carriers like clarified butter (ghee), coconut oil, and olive oil extract cannabinoids most efficiently. For maximum potency, add sunflower lecithin to improve bioavailability." }] },
    ],
  },
  // === VAPE EDUCATION ===
  {
    _id: "article-vape-cartridge-guide",
    _type: "article",
    title: "Vape Cartridges 101: Oil Types, Hardware & Safety",
    slug: { _type: "slug", current: "vape-cartridge-guide" },
    excerpt: "Navigate the world of vape cartridges with confidence. Learn the differences between distillate, live resin, and rosin carts—plus how to spot quality hardware.",
    publishedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    category: { _type: "reference", _ref: "category-vape" },
    author: { _type: "reference", _ref: "author-alex-martinez" },
    readingTime: "9 min read",
    tags: ["vape", "cartridges", "safety", "hardware"],
    channels: ["mobile", "web", "kiosk"],
    body: [
      { _type: "block", _key: uuid(), style: "h2", children: [{ _type: "span", text: "Types of Vape Oil" }] },
      { _type: "block", _key: uuid(), style: "normal", children: [{ _type: "span", text: "• Distillate: Pure THC/CBD, often with added terpenes. Clean, consistent, affordable.\n• Live Resin: Flash-frozen fresh plant extraction. Preserves full terpene profile for authentic strain experience.\n• Rosin: Solventless extraction using heat and pressure. Premium quality, no residual solvents." }] },
    ],
  },
  // === CONCENTRATE EDUCATION ===
  {
    _id: "article-concentrates-explained",
    _type: "article",
    title: "Cannabis Concentrates: From Wax to Diamonds",
    slug: { _type: "slug", current: "concentrates-explained" },
    excerpt: "Explore the world of cannabis extracts. Understand the differences between shatter, budder, live resin, and THCA diamonds—and how to consume them safely.",
    publishedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    category: { _type: "reference", _ref: "category-concentrate" },
    author: { _type: "reference", _ref: "author-jordan-rivers" },
    readingTime: "10 min read",
    tags: ["concentrates", "dabs", "extraction", "advanced"],
    channels: ["mobile", "web"],
    body: [
      { _type: "block", _key: uuid(), style: "h2", children: [{ _type: "span", text: "Extraction Methods" }] },
      { _type: "block", _key: uuid(), style: "normal", children: [{ _type: "span", text: "• BHO (Butane Hash Oil): Common solvent extraction. Creates shatter, wax, budder.\n• CO2 Extraction: Clean, food-safe. Often used for vape cartridges.\n• Rosin Press: Solventless, heat and pressure only. Purest form.\n• Ice Water Hash: Traditional method, agitation and filtration." }] },
    ],
  },
  // === WELLNESS / TOPICALS ===
  {
    _id: "article-cannabis-for-sleep",
    _type: "article",
    title: "Cannabis for Sleep: What Science Actually Says",
    slug: { _type: "slug", current: "cannabis-for-sleep" },
    excerpt: "Millions use cannabis for sleep, but does it work? Review the latest research on cannabinoids, sleep architecture, and finding the right approach.",
    publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    category: { _type: "reference", _ref: "category-tincture" },
    author: { _type: "reference", _ref: "author-dr-maya-chen" },
    readingTime: "8 min read",
    tags: ["wellness", "sleep", "CBD", "research"],
    channels: ["mobile", "web"],
    body: [
      { _type: "block", _key: uuid(), style: "h2", children: [{ _type: "span", text: "THC and Sleep Stages" }] },
      { _type: "block", _key: uuid(), style: "normal", children: [{ _type: "span", text: "THC may help you fall asleep faster, but research shows it can reduce REM sleep—the stage associated with dreaming and memory consolidation. Long-term use may lead to dependence for sleep. CBD, by contrast, may improve sleep quality without these trade-offs." }] },
    ],
  },
  {
    _id: "article-topicals-guide",
    _type: "article",
    title: "Topical Cannabis: Targeted Relief Without the High",
    slug: { _type: "slug", current: "topicals-guide" },
    excerpt: "Learn how cannabis topicals work, what conditions they help, and how to choose between lotions, balms, patches, and bath products.",
    publishedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    category: { _type: "reference", _ref: "category-topical" },
    author: { _type: "reference", _ref: "author-sam-wellness" },
    readingTime: "6 min read",
    tags: ["topicals", "wellness", "pain-relief", "non-psychoactive"],
    channels: ["mobile", "web", "kiosk"],
    body: [
      { _type: "block", _key: uuid(), style: "h2", children: [{ _type: "span", text: "How Topicals Work" }] },
      { _type: "block", _key: uuid(), style: "normal", children: [{ _type: "span", text: "Cannabis topicals interact with CB1 and CB2 receptors in your skin without entering the bloodstream. This means localized relief for sore muscles, joint pain, and skin conditions—without psychoactive effects. Even high-THC topicals won't get you high when applied externally." }] },
    ],
  },
  // === LIFESTYLE ===
  {
    _id: "article-cannabis-yoga",
    _type: "article",
    title: "Cannabis + Yoga: A Mindful Combination",
    slug: { _type: "slug", current: "cannabis-and-yoga" },
    excerpt: "Explore the growing trend of 'ganja yoga.' Learn how to safely integrate cannabis with your practice for enhanced body awareness and relaxation.",
    publishedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
    category: { _type: "reference", _ref: "category-flower" },
    author: { _type: "reference", _ref: "author-sam-wellness" },
    readingTime: "7 min read",
    tags: ["lifestyle", "yoga", "mindfulness", "wellness"],
    channels: ["mobile", "web"],
    body: [
      { _type: "block", _key: uuid(), style: "h2", children: [{ _type: "span", text: "Historical Roots" }] },
      { _type: "block", _key: uuid(), style: "normal", children: [{ _type: "span", text: "Cannabis has been intertwined with yoga traditions for millennia. Sadhus in India have used cannabis to facilitate meditation for thousands of years. Modern 'ganja yoga' classes are reviving this ancient practice in a wellness context." }] },
    ],
  },
  // === PRE-ROLLS ===
  {
    _id: "article-preroll-quality",
    _type: "article",
    title: "How to Spot a Quality Pre-Roll",
    slug: { _type: "slug", current: "preroll-quality-guide" },
    excerpt: "Not all pre-rolls are created equal. Learn what separates premium joints from shake-filled disappointments—and how to read the signs.",
    publishedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    category: { _type: "reference", _ref: "category-preroll" },
    author: { _type: "reference", _ref: "author-alex-martinez" },
    readingTime: "5 min read",
    tags: ["pre-rolls", "quality", "shopping-guide"],
    channels: ["mobile", "web", "kiosk"],
    body: [
      { _type: "block", _key: uuid(), style: "h2", children: [{ _type: "span", text: "What's Inside Matters" }] },
      { _type: "block", _key: uuid(), style: "normal", children: [{ _type: "span", text: "Premium pre-rolls use whole flower buds, not trim or shake. Look for brands that specify 'flower only' or 'nug run.' Check for even packing—too loose and it burns fast; too tight and it won't draw. Quality joints should have a consistent burn line without canoeing." }] },
    ],
  },
];

// ============================================================================
// DEALS - Business Offers with Targeting
// ============================================================================
const DEALS = [
  {
    _id: "deal-happy-hour",
    _type: "deal",
    title: "Happy Hour: 15% Off All Flower (4-7pm)",
    slug: { _type: "slug", current: "happy-hour-flower" },
    shortDescription: "15% off all flower products, 4-7pm daily",
    badgeText: "15% OFF",
    badgeColor: "green",
    discountType: "percent",
    discountValue: 15,
    minPurchase: 0,
    isStackable: false,
    isActive: true,
    description: [
      { _type: "block", _key: uuid(), style: "normal", children: [{ _type: "span", text: "Wind down your day with our Happy Hour special! Every day from 4pm to 7pm, enjoy 15% off our entire premium flower selection. No code needed—discount applies automatically at checkout." }] },
    ],
    schedule: {
      publishAt: new Date().toISOString(),
      isScheduled: true,
    },
  },
  {
    _id: "deal-first-time-customer",
    _type: "deal",
    title: "Welcome! 20% Off Your First Order",
    slug: { _type: "slug", current: "first-time-20-off" },
    shortDescription: "New customers get 20% off their first purchase",
    badgeText: "20% OFF",
    badgeColor: "blue",
    discountType: "percent",
    discountValue: 20,
    minPurchase: 0,
    isStackable: false,
    isActive: true,
    description: [
      { _type: "block", _key: uuid(), style: "normal", children: [{ _type: "span", text: "Welcome to the family! As a thank you for choosing us, enjoy 20% off your entire first order. Valid on all products, no minimum purchase required. Just verify it's your first visit and the discount is yours." }] },
    ],
  },
  {
    _id: "deal-bogo-edibles",
    _type: "deal",
    title: "BOGO 50% Off Edibles",
    slug: { _type: "slug", current: "bogo-edibles" },
    shortDescription: "Buy one edible, get second 50% off",
    badgeText: "BOGO",
    badgeColor: "purple",
    discountType: "bogo",
    discountValue: 50,
    minPurchase: 0,
    isStackable: false,
    isActive: true,
    description: [
      { _type: "block", _key: uuid(), style: "normal", children: [{ _type: "span", text: "Double the sweetness! Buy any edible at full price and get your second edible at 50% off. Mix and match gummies, chocolates, beverages, and more. Perfect for trying new flavors." }] },
    ],
  },
  {
    _id: "deal-loyalty-double-points",
    _type: "deal",
    title: "Double Points Weekend",
    slug: { _type: "slug", current: "double-points-weekend" },
    shortDescription: "Earn 2X loyalty points on all purchases",
    badgeText: "2X POINTS",
    badgeColor: "gold",
    discountType: "loyalty",
    discountValue: 2,
    minPurchase: 0,
    isStackable: true,
    isActive: true,
    description: [
      { _type: "block", _key: uuid(), style: "normal", children: [{ _type: "span", text: "This weekend only! Every dollar you spend earns double loyalty points. Stack with other offers and watch your rewards grow twice as fast. Points never expire and can be redeemed for discounts on future purchases." }] },
    ],
  },
  {
    _id: "deal-concentrate-flash",
    _type: "deal",
    title: "Flash Sale: 25% Off Concentrates",
    slug: { _type: "slug", current: "concentrate-flash-sale" },
    shortDescription: "25% off all concentrates for 24 hours only",
    badgeText: "FLASH",
    badgeColor: "red",
    discountType: "percent",
    discountValue: 25,
    minPurchase: 50,
    isStackable: false,
    isActive: true,
    description: [
      { _type: "block", _key: uuid(), style: "normal", children: [{ _type: "span", text: "24 hours only! Take 25% off our entire concentrate collection—live resin, rosin, diamonds, and more. Minimum $50 purchase. Stock up on your favorites before this deal disappears." }] },
    ],
  },
  {
    _id: "deal-vape-bundle",
    _type: "deal",
    title: "Vape Starter Bundle: $59.99",
    slug: { _type: "slug", current: "vape-starter-bundle" },
    shortDescription: "Battery + 2 carts for one low price",
    badgeText: "$59.99",
    badgeColor: "blue",
    discountType: "fixed",
    discountValue: 59.99,
    minPurchase: 0,
    isStackable: false,
    isActive: true,
    description: [
      { _type: "block", _key: uuid(), style: "normal", children: [{ _type: "span", text: "Everything you need to start vaping! Get a premium 510-thread battery plus your choice of two half-gram cartridges for just $59.99 (over $30 in savings). Perfect for new vapers or as a gift." }] },
    ],
  },
];

// ============================================================================
// PROMOS - Marketing Campaigns
// ============================================================================
const PROMOS = [
  {
    _id: "promo-420-celebration",
    _type: "promo",
    title: "420 Celebration Week",
    slug: { _type: "slug", current: "420-celebration" },
    code: "420WEEK",
    discount: 0.20,
    active: true,
    channels: ["mobile", "web", "email"],
    description: [
      { _type: "block", _key: uuid(), style: "normal", children: [{ _type: "span", text: "The biggest week in cannabis is here! Celebrate 420 with 20% off storewide, exclusive product drops, giveaways, and special events. Use code 420WEEK at checkout or mention it in-store." }] },
    ],
  },
  {
    _id: "promo-summer-vibes",
    _type: "promo",
    title: "Summer Vibes: Beverage Launch",
    slug: { _type: "slug", current: "summer-vibes" },
    code: "SUMMERVIBES",
    discount: 0.15,
    active: true,
    channels: ["mobile", "web"],
    description: [
      { _type: "block", _key: uuid(), style: "normal", children: [{ _type: "span", text: "Beat the heat with our new cannabis-infused beverages! From sparkling waters to craft sodas and lemonades, discover refreshing ways to enjoy this summer. Use code SUMMERVIBES for 15% off all beverages." }] },
    ],
  },
  {
    _id: "promo-veterans-discount",
    _type: "promo",
    title: "Veterans Appreciation",
    slug: { _type: "slug", current: "veterans-appreciation" },
    code: "VETAPPRECIATE",
    discount: 0.15,
    active: true,
    channels: ["mobile", "web", "kiosk"],
    description: [
      { _type: "block", _key: uuid(), style: "normal", children: [{ _type: "span", text: "Thank you for your service. All veterans and active military receive 15% off every purchase, every day. Simply show valid military ID at checkout. This is our ongoing commitment to those who served." }] },
    ],
  },
  {
    _id: "promo-referral",
    _type: "promo",
    title: "Refer a Friend, Get $20",
    slug: { _type: "slug", current: "refer-a-friend" },
    code: "REFER20",
    discount: 20,
    active: true,
    channels: ["mobile", "web", "email"],
    description: [
      { _type: "block", _key: uuid(), style: "normal", children: [{ _type: "span", text: "Share the love! Refer a friend and you both get $20 off your next purchase. Your friend gets 20% off their first order, and you receive $20 store credit when they make their first purchase. No limit on referrals." }] },
    ],
  },
];

// ============================================================================
// FAQ ITEMS - Customer Support & Education
// ============================================================================
const FAQ_ITEMS = [
  {
    _id: "faq-first-visit",
    _type: "faqItem",
    question: "What do I need for my first dispensary visit?",
    channels: ["mobile", "web", "kiosk"],
    answer: [
      { _type: "block", _key: uuid(), style: "normal", children: [{ _type: "span", text: "For your first visit, please bring: 1) A valid government-issued photo ID proving you're 21+ (or 18+ with a valid medical card in applicable states), 2) Cash or debit card (we accept both), 3) Your medical card if applicable. Our budtenders will guide you through product selection—no prior knowledge needed!" }] },
    ],
  },
  {
    _id: "faq-payment-methods",
    _type: "faqItem",
    question: "What payment methods do you accept?",
    channels: ["mobile", "web", "kiosk"],
    answer: [
      { _type: "block", _key: uuid(), style: "normal", children: [{ _type: "span", text: "We accept cash and debit cards at all locations. ATMs are available on-site for your convenience. Unfortunately, due to federal regulations, credit cards cannot be used for cannabis purchases. Some locations offer cashless ATM (CanPay) and Aeropay for app-based payments." }] },
    ],
  },
  {
    _id: "faq-dosing-help",
    _type: "faqItem",
    question: "How do I know what dose is right for me?",
    channels: ["mobile", "web"],
    answer: [
      { _type: "block", _key: uuid(), style: "normal", children: [{ _type: "span", text: "We follow the 'start low, go slow' principle. For new consumers, we recommend starting with 2.5-5mg of THC for edibles, or a single small puff for inhalables. Wait at least 2 hours for edibles before consuming more. Our budtenders can provide personalized recommendations based on your experience level and desired effects." }] },
    ],
  },
  {
    _id: "faq-loyalty-program",
    _type: "faqItem",
    question: "How does your loyalty program work?",
    channels: ["mobile", "web", "kiosk"],
    answer: [
      { _type: "block", _key: uuid(), style: "normal", children: [{ _type: "span", text: "Earn 1 point for every $1 spent. Points never expire! Redeem 100 points for $5 off, 200 points for $12 off, or 500 points for $35 off. Bonus: Earn extra points by completing educational quizzes in our app, referring friends, and during double-points events." }] },
    ],
  },
  {
    _id: "faq-online-ordering",
    _type: "faqItem",
    question: "Can I order online for pickup?",
    channels: ["mobile", "web"],
    answer: [
      { _type: "block", _key: uuid(), style: "normal", children: [{ _type: "span", text: "Yes! Browse our menu online or in the app, add items to your cart, and checkout for express pickup. Orders are typically ready within 15-30 minutes. You'll receive a text when your order is ready. Skip the line and head straight to our express pickup counter." }] },
    ],
  },
  {
    _id: "faq-product-testing",
    _type: "faqItem",
    question: "Are your products lab tested?",
    channels: ["mobile", "web", "kiosk"],
    answer: [
      { _type: "block", _key: uuid(), style: "normal", children: [{ _type: "span", text: "Absolutely. Every product we sell is tested by independent, state-licensed laboratories for potency, pesticides, heavy metals, microbials, and residual solvents. You can view lab results (COAs) on each product page or by scanning the QR code on the packaging. We never compromise on safety." }] },
    ],
  },
  {
    _id: "faq-return-policy",
    _type: "faqItem",
    question: "What is your return policy?",
    channels: ["mobile", "web"],
    answer: [
      { _type: "block", _key: uuid(), style: "normal", children: [{ _type: "span", text: "Due to state regulations, cannabis products cannot be returned once purchased. However, if you receive a defective product (faulty cartridge, damaged packaging, etc.), please contact us within 24 hours with your receipt. We'll work with you to make it right through store credit or exchange." }] },
    ],
  },
  {
    _id: "faq-medical-vs-recreational",
    _type: "faqItem",
    question: "What's the difference between medical and recreational?",
    channels: ["mobile", "web", "kiosk"],
    answer: [
      { _type: "block", _key: uuid(), style: "normal", children: [{ _type: "span", text: "Medical patients with valid cards often enjoy benefits like lower taxes, higher possession limits, access to higher-potency products, and sometimes lower prices. Recreational (adult-use) customers must be 21+ and pay standard state/local taxes. Both have access to our full product range and loyalty program." }] },
    ],
  },
];

// ============================================================================
// QUIZ - Educational Quiz with Loyalty Points
// ============================================================================
const QUIZZES = [
  {
    _id: "quiz-terpenes-101",
    _type: "quiz",
    title: "Terpenes 101 Quiz",
    slug: { _type: "slug", current: "terpenes-101-quiz" },
    description: "Test your knowledge of cannabis terpenes and earn loyalty points! Learn what makes each strain unique.",
    articleRef: { _type: "reference", _ref: "article-understanding-terpenes" },
    passThreshold: 0.7,
    pointsReward: 50,
    maxAttempts: 3,
    isActive: true,
    startAt: new Date().toISOString(),
    questions: [
      {
        _key: uuid(),
        prompt: "What are terpenes?",
        options: [
          "A type of cannabinoid like THC",
          "Aromatic compounds that create smell and flavor",
          "Pesticides used in cultivation",
          "A brand of cannabis products"
        ],
        correctIndex: 1,
        explanation: "Terpenes are aromatic compounds found in many plants, responsible for the distinctive smells and flavors of different cannabis strains."
      },
      {
        _key: uuid(),
        prompt: "Which terpene is known for its citrus aroma and mood-elevating effects?",
        options: ["Myrcene", "Pinene", "Limonene", "Linalool"],
        correctIndex: 2,
        explanation: "Limonene has a citrus, lemon scent and is associated with elevated mood and stress relief."
      },
      {
        _key: uuid(),
        prompt: "What is the 'entourage effect'?",
        options: [
          "When multiple people use cannabis together",
          "The synergistic interaction between cannabinoids and terpenes",
          "A type of cannabis strain",
          "The delayed onset of edibles"
        ],
        correctIndex: 1,
        explanation: "The entourage effect describes how cannabinoids and terpenes work together synergistically to enhance or modulate effects."
      },
      {
        _key: uuid(),
        prompt: "Which terpene has a floral, lavender aroma and is known for calming effects?",
        options: ["Caryophyllene", "Linalool", "Myrcene", "Terpinolene"],
        correctIndex: 1,
        explanation: "Linalool has a floral, lavender scent and is associated with calming, anti-anxiety effects."
      },
      {
        _key: uuid(),
        prompt: "True or False: Myrcene is the most common terpene found in cannabis.",
        options: ["True", "False"],
        correctIndex: 0,
        explanation: "Myrcene is indeed the most abundant terpene in most cannabis strains, contributing to earthy, musky aromas."
      },
    ],
  },
  {
    _id: "quiz-edibles-safety",
    _type: "quiz",
    title: "Edibles Safety Quiz",
    slug: { _type: "slug", current: "edibles-safety-quiz" },
    description: "Learn safe edible consumption practices and earn 75 loyalty points!",
    articleRef: { _type: "reference", _ref: "article-edibles-dosing-guide" },
    passThreshold: 0.8,
    pointsReward: 75,
    maxAttempts: 2,
    isActive: true,
    startAt: new Date().toISOString(),
    questions: [
      {
        _key: uuid(),
        prompt: "What is the recommended starting dose for a new cannabis edible consumer?",
        options: ["10-15mg THC", "2.5-5mg THC", "25-50mg THC", "No dose is too small"],
        correctIndex: 1,
        explanation: "New consumers should start with 2.5-5mg THC to assess their tolerance before increasing dose."
      },
      {
        _key: uuid(),
        prompt: "How long should you wait before taking more edibles if you don't feel effects?",
        options: ["15 minutes", "30 minutes", "At least 2 hours", "5 minutes"],
        correctIndex: 2,
        explanation: "Edibles can take 30 minutes to 2 hours to take effect. Always wait at least 2 hours before consuming more."
      },
      {
        _key: uuid(),
        prompt: "Why do edibles feel stronger and last longer than smoking?",
        options: [
          "They contain more THC",
          "THC is converted to 11-hydroxy-THC in the liver",
          "They're made with better cannabis",
          "It's a placebo effect"
        ],
        correctIndex: 1,
        explanation: "When eaten, THC is metabolized by the liver into 11-hydroxy-THC, a more potent compound that crosses the blood-brain barrier more easily."
      },
      {
        _key: uuid(),
        prompt: "How long can edible effects typically last?",
        options: ["30 minutes to 1 hour", "1-2 hours", "4-8 hours", "24 hours"],
        correctIndex: 2,
        explanation: "Edible effects typically last 4-8 hours, much longer than inhaled cannabis (1-3 hours)."
      },
      {
        _key: uuid(),
        prompt: "What should you do if you consume too much THC?",
        options: [
          "Take more CBD, stay hydrated, find a calm space",
          "Exercise vigorously",
          "Consume more THC to balance it out",
          "Nothing, effects can't be reduced"
        ],
        correctIndex: 0,
        explanation: "CBD may help counteract THC's effects. Stay hydrated, find a calm environment, and remember that the effects will pass."
      },
    ],
  },
];

// ============================================================================
// MAIN SEEDING FUNCTION
// ============================================================================
async function seedDemoContent() {
  console.log("🌱 Starting Sanity Demo Content Seed...\n");

  const allDocuments = [
    ...AUTHORS,
    ...CATEGORIES,
    ...ARTICLES,
    ...DEALS,
    ...PROMOS,
    ...FAQ_ITEMS,
    ...QUIZZES,
  ];

  console.log(`📦 Preparing ${allDocuments.length} documents across 7 content types:`);
  console.log(`   • ${AUTHORS.length} Authors`);
  console.log(`   • ${CATEGORIES.length} Categories`);
  console.log(`   • ${ARTICLES.length} Articles`);
  console.log(`   • ${DEALS.length} Deals`);
  console.log(`   • ${PROMOS.length} Promos`);
  console.log(`   • ${FAQ_ITEMS.length} FAQ Items`);
  console.log(`   • ${QUIZZES.length} Quizzes\n`);

  // Use transaction for atomic create/update
  let transaction = client.transaction();

  for (const doc of allDocuments) {
    // Cast to any to satisfy Sanity's strict types for heterogeneous documents
    transaction = transaction.createOrReplace(doc as any);
  }

  try {
    const result = await transaction.commit();
    console.log(`✅ Successfully seeded ${result.documentIds?.length || allDocuments.length} documents!`);
    console.log("\n🎉 Demo content is now live in Sanity Studio!");
    console.log("   View at: https://nimbus-cms.sanity.studio/\n");
  } catch (error) {
    console.error("❌ Error seeding content:", error);
    process.exit(1);
  }
}

// Run if called directly
seedDemoContent().catch(console.error);
