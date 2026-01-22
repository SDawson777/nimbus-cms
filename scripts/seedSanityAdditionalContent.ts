#!/usr/bin/env npx ts-node
/**
 * Additional Sanity Demo Content - Complete Category Coverage
 * 
 * Fills gaps in content coverage:
 * - Gear/Accessories articles
 * - More Concentrate content
 * - Tincture deep dives
 * - Beverage-focused content (Edibles subcategory)
 * - Wellness/medical content
 * - Beginner guides
 * - More quizzes for engagement
 * - Additional deals per category
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
// ADDITIONAL ARTICLES - Complete Category Coverage
// ============================================================================
const ADDITIONAL_ARTICLES = [
  // === GEAR / ACCESSORIES ===
  {
    _id: "article-vaporizer-buyers-guide",
    _type: "article",
    title: "The Ultimate Vaporizer Buyer's Guide 2026",
    slug: { _type: "slug", current: "vaporizer-buyers-guide" },
    excerpt: "From portable pens to desktop powerhouses—find the perfect vaporizer for your lifestyle and budget. Compare features, brands, and price points.",
    publishedAt: new Date().toISOString(),
    category: { _type: "reference", _ref: "category-gear" },
    author: { _type: "reference", _ref: "author-alex-martinez" },
    readingTime: "11 min read",
    tags: ["vaporizers", "gear", "buying-guide", "technology"],
    channels: ["mobile", "web", "kiosk"],
    body: [
      { _type: "block", _key: uuid(), style: "h2", children: [{ _type: "span", text: "Portable vs. Desktop: Which Is Right for You?" }] },
      { _type: "block", _key: uuid(), style: "normal", children: [{ _type: "span", text: "Portable vaporizers offer convenience and discretion—perfect for on-the-go use. Desktop units deliver superior vapor quality and session control, ideal for home enthusiasts. Consider your primary use case: solo sessions, group settings, or both." }] },
      { _type: "block", _key: uuid(), style: "h2", children: [{ _type: "span", text: "Key Features to Compare" }] },
      { _type: "block", _key: uuid(), style: "normal", children: [{ _type: "span", text: "• Heating Method: Conduction (direct heat) vs. convection (hot air) vs. hybrid\n• Temperature Control: Preset vs. precise digital control\n• Chamber Size: 0.1g-0.5g for portables, up to 1g+ for desktops\n• Battery Life: 60-120 minutes typical for portables\n• Materials: Ceramic, stainless steel, or glass vapor paths" }] },
      { _type: "block", _key: uuid(), style: "h2", children: [{ _type: "span", text: "Top Picks by Price Range" }] },
      { _type: "block", _key: uuid(), style: "normal", children: [{ _type: "span", text: "Budget ($50-100): Great for beginners exploring vaporization\nMid-Range ($100-200): Best value with quality features\nPremium ($200-350): Enthusiast-grade performance\nUltra-Premium ($350+): Best-in-class vapor quality and build" }] },
    ],
  },
  {
    _id: "article-cannabis-storage",
    _type: "article",
    title: "Proper Cannabis Storage: Keep Your Flower Fresh",
    slug: { _type: "slug", current: "cannabis-storage-guide" },
    excerpt: "Protect your investment. Learn the science of cannabis storage and how to maintain potency, flavor, and freshness for months.",
    publishedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    category: { _type: "reference", _ref: "category-gear" },
    author: { _type: "reference", _ref: "author-jordan-rivers" },
    readingTime: "6 min read",
    tags: ["storage", "gear", "freshness", "tips"],
    channels: ["mobile", "web"],
    body: [
      { _type: "block", _key: uuid(), style: "h2", children: [{ _type: "span", text: "The Enemies of Fresh Cannabis" }] },
      { _type: "block", _key: uuid(), style: "normal", children: [{ _type: "span", text: "Four factors degrade cannabis quality:\n\n1. Light: UV rays break down cannabinoids and terpenes\n2. Air: Oxygen oxidizes THC to CBN (less psychoactive)\n3. Humidity: Too dry = brittle, harsh; too wet = mold risk\n4. Temperature: Heat accelerates degradation" }] },
      { _type: "block", _key: uuid(), style: "h2", children: [{ _type: "span", text: "Ideal Storage Conditions" }] },
      { _type: "block", _key: uuid(), style: "normal", children: [{ _type: "span", text: "• Temperature: 60-70°F (15-21°C)\n• Humidity: 59-63% RH (use humidity packs)\n• Container: Airtight glass jars, opaque or UV-protected\n• Location: Cool, dark place away from appliances\n• Never: Refrigerate (humidity fluctuations) or freeze (trichomes become brittle)" }] },
    ],
  },
  {
    _id: "article-rolling-masterclass",
    _type: "article",
    title: "Rolling Masterclass: From Beginner to Expert",
    slug: { _type: "slug", current: "rolling-masterclass" },
    excerpt: "Master the art of rolling. Step-by-step techniques for joints, cones, and blunts—plus tips for perfectly even burns.",
    publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    category: { _type: "reference", _ref: "category-gear" },
    author: { _type: "reference", _ref: "author-alex-martinez" },
    readingTime: "8 min read",
    tags: ["rolling", "joints", "skills", "accessories"],
    channels: ["mobile", "web"],
    body: [
      { _type: "block", _key: uuid(), style: "h2", children: [{ _type: "span", text: "Essential Supplies" }] },
      { _type: "block", _key: uuid(), style: "normal", children: [{ _type: "span", text: "• Quality papers: Hemp, rice, or unbleached options\n• Grinder: Consistent grind = even burn\n• Filter tips/crutches: Stability and airflow\n• Rolling tray: Keep your workspace organized\n• Packing tool: Chopstick, pen, or dedicated poker" }] },
      { _type: "block", _key: uuid(), style: "h2", children: [{ _type: "span", text: "The Classic Joint Technique" }] },
      { _type: "block", _key: uuid(), style: "normal", children: [{ _type: "span", text: "1. Grind 0.5-1g of flower to medium consistency\n2. Create a crutch/filter and place at one end\n3. Distribute flower evenly in paper\n4. Shape with fingers, tucking the front edge\n5. Roll up, lick the glue strip, and seal\n6. Pack the open end and twist to close" }] },
    ],
  },
  // === TINCTURES - More Depth ===
  {
    _id: "article-tincture-guide",
    _type: "article",
    title: "Cannabis Tinctures: The Complete Guide",
    slug: { _type: "slug", current: "tincture-complete-guide" },
    excerpt: "Discover why tinctures are the most versatile cannabis product. Fast-acting, precise dosing, and endless applications.",
    publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    category: { _type: "reference", _ref: "category-tincture" },
    author: { _type: "reference", _ref: "author-dr-maya-chen" },
    readingTime: "9 min read",
    tags: ["tinctures", "dosing", "sublingual", "wellness"],
    channels: ["mobile", "web"],
    body: [
      { _type: "block", _key: uuid(), style: "h2", children: [{ _type: "span", text: "What Makes Tinctures Special" }] },
      { _type: "block", _key: uuid(), style: "normal", children: [{ _type: "span", text: "Tinctures are liquid cannabis extracts, typically in an alcohol or oil base. They offer unique advantages:\n\n• Precise Dosing: Measured droppers allow exact mg control\n• Fast Onset: Sublingual absorption bypasses digestion (15-30 min)\n• Discretion: No smoke, minimal odor\n• Versatility: Use directly or add to food/drinks" }] },
      { _type: "block", _key: uuid(), style: "h2", children: [{ _type: "span", text: "Sublingual vs. Swallowed" }] },
      { _type: "block", _key: uuid(), style: "normal", children: [{ _type: "span", text: "For fastest effects, hold the tincture under your tongue for 60-90 seconds before swallowing. This allows cannabinoids to absorb directly into bloodstream via sublingual glands. If swallowed immediately, effects are more like edibles (30-90 min onset, longer duration)." }] },
      { _type: "block", _key: uuid(), style: "h2", children: [{ _type: "span", text: "CBD:THC Ratios Explained" }] },
      { _type: "block", _key: uuid(), style: "normal", children: [{ _type: "span", text: "• 1:1 - Balanced effects, great for pain and relaxation\n• 2:1 CBD:THC - Mild psychoactivity, therapeutic focus\n• 4:1 or higher - Minimal high, maximum wellness benefits\n• Pure CBD - No psychoactive effects, pure wellness\n• Pure THC - Full psychoactive experience" }] },
    ],
  },
  {
    _id: "article-cbd-beginners",
    _type: "article",
    title: "CBD for Beginners: Everything You Need to Know",
    slug: { _type: "slug", current: "cbd-beginners-guide" },
    excerpt: "New to CBD? Understand what it is, how it works, what to expect, and how to find quality products that actually work.",
    publishedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    category: { _type: "reference", _ref: "category-tincture" },
    author: { _type: "reference", _ref: "author-dr-maya-chen" },
    readingTime: "10 min read",
    tags: ["CBD", "beginners", "wellness", "education"],
    channels: ["mobile", "web", "kiosk"],
    body: [
      { _type: "block", _key: uuid(), style: "h2", children: [{ _type: "span", text: "What Is CBD?" }] },
      { _type: "block", _key: uuid(), style: "normal", children: [{ _type: "span", text: "Cannabidiol (CBD) is one of 100+ cannabinoids found in cannabis. Unlike THC, CBD is non-intoxicating—it won't get you high. It interacts with your endocannabinoid system, which regulates mood, sleep, pain, and immune function." }] },
      { _type: "block", _key: uuid(), style: "h2", children: [{ _type: "span", text: "Potential Benefits (Research-Backed)" }] },
      { _type: "block", _key: uuid(), style: "normal", children: [{ _type: "span", text: "• Anxiety & Stress: Multiple studies show anxiolytic effects\n• Sleep: May improve sleep quality and duration\n• Pain & Inflammation: Anti-inflammatory properties\n• Epilepsy: FDA-approved for certain seizure disorders\n• General Wellness: Promotes homeostasis" }] },
      { _type: "block", _key: uuid(), style: "h2", children: [{ _type: "span", text: "How to Choose Quality CBD" }] },
      { _type: "block", _key: uuid(), style: "normal", children: [{ _type: "span", text: "Look for:\n• Third-party lab testing (COA)\n• Full-spectrum or broad-spectrum (entourage effect)\n• Organic, US-grown hemp\n• Clear mg dosing on label\n• Reputable brand with reviews" }] },
    ],
  },
  // === CONCENTRATES - More Depth ===
  {
    _id: "article-dabbing-guide",
    _type: "article",
    title: "Dabbing 101: A Beginner's Guide to Concentrates",
    slug: { _type: "slug", current: "dabbing-beginners-guide" },
    excerpt: "Ready to try concentrates? Learn the equipment, techniques, and safety tips for your first dabbing experience.",
    publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    category: { _type: "reference", _ref: "category-concentrate" },
    author: { _type: "reference", _ref: "author-jordan-rivers" },
    readingTime: "12 min read",
    tags: ["dabbing", "concentrates", "beginners", "equipment"],
    channels: ["mobile", "web"],
    body: [
      { _type: "block", _key: uuid(), style: "h2", children: [{ _type: "span", text: "Essential Equipment" }] },
      { _type: "block", _key: uuid(), style: "normal", children: [{ _type: "span", text: "• Dab Rig: Water pipe designed for concentrates\n• Banger/Nail: Quartz, titanium, or ceramic heating surface\n• Torch: Butane torch for heating (or e-nail for convenience)\n• Dab Tool: Metal pick for handling concentrates\n• Carb Cap: Covers banger for low-temp dabs\n• Timer: For consistent heating" }] },
      { _type: "block", _key: uuid(), style: "h2", children: [{ _type: "span", text: "Temperature Matters" }] },
      { _type: "block", _key: uuid(), style: "normal", children: [{ _type: "span", text: "Low-Temp (400-500°F): Maximum flavor, smoother hits, less vapor\nMid-Temp (500-600°F): Balance of flavor and vapor production\nHigh-Temp (600-700°F): Maximum vapor, harsher taste, potential for burning\n\nPro tip: Heat banger for 30-45 seconds, then wait 45-60 seconds before dabbing for ideal low-temp experience." }] },
    ],
  },
  {
    _id: "article-live-resin-vs-rosin",
    _type: "article",
    title: "Live Resin vs. Rosin: The Connoisseur's Comparison",
    slug: { _type: "slug", current: "live-resin-vs-rosin" },
    excerpt: "Two premium concentrates, different extraction methods. Understand the nuances that make each unique and which might be your perfect match.",
    publishedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    category: { _type: "reference", _ref: "category-concentrate" },
    author: { _type: "reference", _ref: "author-jordan-rivers" },
    readingTime: "7 min read",
    tags: ["live-resin", "rosin", "concentrates", "comparison"],
    channels: ["mobile", "web"],
    body: [
      { _type: "block", _key: uuid(), style: "h2", children: [{ _type: "span", text: "Live Resin: The Flavor King" }] },
      { _type: "block", _key: uuid(), style: "normal", children: [{ _type: "span", text: "Live resin is made from fresh-frozen cannabis, preserving the full terpene profile that's normally lost during drying. The result is an extract that tastes exactly like the living plant—aromatic, complex, and true to strain. Uses hydrocarbon extraction (butane/propane)." }] },
      { _type: "block", _key: uuid(), style: "h2", children: [{ _type: "span", text: "Rosin: Solventless Purity" }] },
      { _type: "block", _key: uuid(), style: "normal", children: [{ _type: "span", text: "Rosin is extracted using only heat and pressure—no solvents whatsoever. This appeals to purists who want zero residual chemicals. Live rosin (from fresh-frozen material) combines the best of both worlds: full terpene preservation and solventless extraction." }] },
      { _type: "block", _key: uuid(), style: "h2", children: [{ _type: "span", text: "Quick Comparison" }] },
      { _type: "block", _key: uuid(), style: "normal", children: [{ _type: "span", text: "Live Resin: ~$30-50/g, hydrocarbon extraction, exceptional flavor\nRosin: ~$50-80/g, solventless, appeals to health-conscious\nLive Rosin: ~$60-100/g, premium option, best of both worlds" }] },
    ],
  },
  // === EDIBLES - Beverages Focus ===
  {
    _id: "article-cannabis-beverages",
    _type: "article",
    title: "Cannabis Beverages: The Future of Edibles",
    slug: { _type: "slug", current: "cannabis-beverages-guide" },
    excerpt: "Fast-acting, precisely dosed, and socially familiar. Discover why cannabis drinks are the fastest-growing product category.",
    publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    category: { _type: "reference", _ref: "category-edibles" },
    author: { _type: "reference", _ref: "author-chef-antoine" },
    readingTime: "8 min read",
    tags: ["beverages", "edibles", "fast-acting", "social"],
    channels: ["mobile", "web"],
    body: [
      { _type: "block", _key: uuid(), style: "h2", children: [{ _type: "span", text: "Why Beverages Are Different" }] },
      { _type: "block", _key: uuid(), style: "normal", children: [{ _type: "span", text: "Unlike traditional edibles, most cannabis beverages use nano-emulsion technology. This breaks cannabinoids into tiny particles that absorb faster—onset in 10-20 minutes instead of 1-2 hours. Effects typically last 2-3 hours, more similar to smoking than traditional edibles." }] },
      { _type: "block", _key: uuid(), style: "h2", children: [{ _type: "span", text: "Types of Cannabis Drinks" }] },
      { _type: "block", _key: uuid(), style: "normal", children: [{ _type: "span", text: "• Seltzers & Sparkling Waters: Low-calorie, refreshing, 2.5-10mg THC\n• Sodas & Craft Sodas: Nostalgic flavors with cannabis\n• Teas & Coffees: Functional beverages for focus or relaxation\n• Energy Drinks: Sativa-forward formulations\n• Mocktails: Sophisticated, alcohol-free alternatives\n• Powder Mixes: Add to any beverage" }] },
    ],
  },
  {
    _id: "article-microdosing",
    _type: "article",
    title: "Microdosing Cannabis: Less Is More",
    slug: { _type: "slug", current: "microdosing-cannabis" },
    excerpt: "Discover the growing trend of sub-perceptual dosing. How 1-5mg can enhance your day without impairment.",
    publishedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    category: { _type: "reference", _ref: "category-edibles" },
    author: { _type: "reference", _ref: "author-dr-maya-chen" },
    readingTime: "7 min read",
    tags: ["microdosing", "low-dose", "wellness", "productivity"],
    channels: ["mobile", "web"],
    body: [
      { _type: "block", _key: uuid(), style: "h2", children: [{ _type: "span", text: "What Is Microdosing?" }] },
      { _type: "block", _key: uuid(), style: "normal", children: [{ _type: "span", text: "Microdosing means consuming very small amounts of cannabis—typically 1-5mg THC—to achieve subtle benefits without significant psychoactive effects. Think of it as tuning your endocannabinoid system rather than altering your state of mind." }] },
      { _type: "block", _key: uuid(), style: "h2", children: [{ _type: "span", text: "Potential Benefits" }] },
      { _type: "block", _key: uuid(), style: "normal", children: [{ _type: "span", text: "• Mood Enhancement: Subtle lift without impairment\n• Focus & Creativity: Some report enhanced flow states\n• Stress Reduction: Takes the edge off without sedation\n• Pain Management: Background relief for chronic conditions\n• Sleep Preparation: Gentle relaxation before bed" }] },
      { _type: "block", _key: uuid(), style: "h2", children: [{ _type: "span", text: "Best Products for Microdosing" }] },
      { _type: "block", _key: uuid(), style: "normal", children: [{ _type: "span", text: "Look for products with 2.5mg or 5mg individual doses: low-dose gummies, mints, beverages, and tinctures with graduated droppers. Start with 2.5mg and assess effects over several days before adjusting." }] },
    ],
  },
  // === FLOWER - Additional Depth ===
  {
    _id: "article-cannabis-freshness",
    _type: "article",
    title: "How to Tell If Your Cannabis Is Fresh",
    slug: { _type: "slug", current: "cannabis-freshness-signs" },
    excerpt: "Learn to spot the signs of quality flower versus stale or poorly cured cannabis. Your nose, eyes, and fingers know best.",
    publishedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
    category: { _type: "reference", _ref: "category-flower" },
    author: { _type: "reference", _ref: "author-jordan-rivers" },
    readingTime: "5 min read",
    tags: ["quality", "freshness", "flower", "shopping"],
    channels: ["mobile", "web", "kiosk"],
    body: [
      { _type: "block", _key: uuid(), style: "h2", children: [{ _type: "span", text: "Visual Inspection" }] },
      { _type: "block", _key: uuid(), style: "normal", children: [{ _type: "span", text: "Fresh cannabis should have:\n• Vibrant green color with orange/purple accents\n• Visible trichomes (frosty appearance)\n• No brown, yellow, or bleached patches\n• No visible mold, mildew, or pests\n• Dense but not rock-hard structure" }] },
      { _type: "block", _key: uuid(), style: "h2", children: [{ _type: "span", text: "The Nose Knows" }] },
      { _type: "block", _key: uuid(), style: "normal", children: [{ _type: "span", text: "Quality flower has a strong, distinct aroma. Stale cannabis smells like hay or has little scent at all. Moldy cannabis has a musty, basement-like odor. Trust your nose—if it doesn't smell right, don't buy it." }] },
      { _type: "block", _key: uuid(), style: "h2", children: [{ _type: "span", text: "The Touch Test" }] },
      { _type: "block", _key: uuid(), style: "normal", children: [{ _type: "span", text: "Properly cured cannabis should be slightly spongy—it springs back when gently squeezed. Too dry and it crumbles to dust. Too wet and it feels dense and doesn't bounce back. The stem should snap, not bend." }] },
    ],
  },
  {
    _id: "article-strain-hunting",
    _type: "article",
    title: "Strain Hunting: How to Find Your Perfect Match",
    slug: { _type: "slug", current: "strain-hunting-guide" },
    excerpt: "With thousands of strains available, finding 'the one' can be overwhelming. Use this systematic approach to discover your ideal cultivars.",
    publishedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    category: { _type: "reference", _ref: "category-flower" },
    author: { _type: "reference", _ref: "author-jordan-rivers" },
    readingTime: "9 min read",
    tags: ["strains", "selection", "flower", "personalization"],
    channels: ["mobile", "web"],
    body: [
      { _type: "block", _key: uuid(), style: "h2", children: [{ _type: "span", text: "Define Your Goals" }] },
      { _type: "block", _key: uuid(), style: "normal", children: [{ _type: "span", text: "Before shopping, ask yourself:\n• When will I consume? (Day vs. evening)\n• What effect do I want? (Energy, relaxation, creativity, pain relief)\n• What's my tolerance level?\n• Any flavors I love or hate?\n• Social setting or solo use?" }] },
      { _type: "block", _key: uuid(), style: "h2", children: [{ _type: "span", text: "Look Beyond THC Percentage" }] },
      { _type: "block", _key: uuid(), style: "normal", children: [{ _type: "span", text: "High THC doesn't mean better. A 18% strain with the right terpene profile for your goals can outperform a 30% strain with the wrong profile. Focus on:\n• Terpene content (especially dominant terpenes)\n• THC:CBD ratio\n• Strain lineage and genetics" }] },
    ],
  },
  // === TOPICALS - More Depth ===
  {
    _id: "article-transdermal-patches",
    _type: "article",
    title: "Transdermal Cannabis Patches: Extended Relief",
    slug: { _type: "slug", current: "transdermal-patches-guide" },
    excerpt: "12+ hours of consistent cannabinoid delivery. How patches differ from lotions and when they're the best choice.",
    publishedAt: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000).toISOString(),
    category: { _type: "reference", _ref: "category-topical" },
    author: { _type: "reference", _ref: "author-sam-wellness" },
    readingTime: "6 min read",
    tags: ["patches", "transdermal", "topicals", "extended-release"],
    channels: ["mobile", "web"],
    body: [
      { _type: "block", _key: uuid(), style: "h2", children: [{ _type: "span", text: "Transdermal vs. Topical" }] },
      { _type: "block", _key: uuid(), style: "normal", children: [{ _type: "span", text: "Standard topicals (lotions, balms) work on the skin surface and don't enter the bloodstream. Transdermal patches use permeation enhancers to push cannabinoids through all skin layers into systemic circulation. This means they can produce full-body effects, including mild psychoactivity with THC patches." }] },
      { _type: "block", _key: uuid(), style: "h2", children: [{ _type: "span", text: "Who Should Consider Patches?" }] },
      { _type: "block", _key: uuid(), style: "normal", children: [{ _type: "span", text: "• Chronic pain sufferers needing all-day relief\n• Those who can't smoke/vape or dislike edibles\n• People wanting consistent, steady-state dosing\n• Medical patients requiring predictable cannabinoid levels\n• Anyone needing discreet, long-lasting effects" }] },
    ],
  },
  // === PRE-ROLLS - More Depth ===
  {
    _id: "article-infused-prerolls",
    _type: "article",
    title: "Infused Pre-Rolls: The Next Level",
    slug: { _type: "slug", current: "infused-prerolls-guide" },
    excerpt: "Kief-dusted, hash-wrapped, diamond-infused—explore the world of enhanced pre-rolls and what makes each type unique.",
    publishedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    category: { _type: "reference", _ref: "category-preroll" },
    author: { _type: "reference", _ref: "author-alex-martinez" },
    readingTime: "7 min read",
    tags: ["prerolls", "infused", "concentrates", "potency"],
    channels: ["mobile", "web"],
    body: [
      { _type: "block", _key: uuid(), style: "h2", children: [{ _type: "span", text: "Types of Infused Pre-Rolls" }] },
      { _type: "block", _key: uuid(), style: "normal", children: [{ _type: "span", text: "• Kief-Coated: Rolled in powdered trichomes, +10-15% potency\n• Hash-Infused: Mixed with bubble hash or traditional hash\n• Live Resin: Coated or filled with live resin for max flavor\n• Diamond-Infused: THCA diamonds for extreme potency\n• Caviar/Moon Rocks: Flower dipped in oil, rolled in kief" }] },
      { _type: "block", _key: uuid(), style: "h2", children: [{ _type: "span", text: "Potency Expectations" }] },
      { _type: "block", _key: uuid(), style: "normal", children: [{ _type: "span", text: "Standard pre-roll: 15-25% THC\nKief-infused: 25-35% THC\nLive resin infused: 30-40% THC\nDiamond-infused: 40-50%+ THC\n\nStart with 2-3 puffs if you're new to infused products—they hit significantly harder than regular flower." }] },
    ],
  },
  // === VAPE - Additional ===
  {
    _id: "article-disposable-vapes",
    _type: "article",
    title: "Disposable Vapes: Convenience Guide",
    slug: { _type: "slug", current: "disposable-vapes-guide" },
    excerpt: "No charging, no cartridge swaps, no hassle. Everything you need to know about all-in-one disposable vaporizers.",
    publishedAt: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000).toISOString(),
    category: { _type: "reference", _ref: "category-vape" },
    author: { _type: "reference", _ref: "author-alex-martinez" },
    readingTime: "5 min read",
    tags: ["disposable", "vape", "convenience", "beginners"],
    channels: ["mobile", "web", "kiosk"],
    body: [
      { _type: "block", _key: uuid(), style: "h2", children: [{ _type: "span", text: "Why Choose Disposables?" }] },
      { _type: "block", _key: uuid(), style: "normal", children: [{ _type: "span", text: "Disposable vapes are perfect for:\n• Beginners who don't want to invest in hardware\n• Travelers who need hassle-free consumption\n• Trying new strains without committing to full cartridges\n• Backup devices when your main battery dies\n• Discreet use in various settings" }] },
      { _type: "block", _key: uuid(), style: "h2", children: [{ _type: "span", text: "What to Look For" }] },
      { _type: "block", _key: uuid(), style: "normal", children: [{ _type: "span", text: "• Oil Type: Distillate (affordable) vs. live resin (flavorful)\n• Size: 0.3g, 0.5g, or 1g options\n• Battery Indicator: Know when it's running low\n• Strain Selection: Indica, sativa, hybrid options\n• Brand Reputation: Stick with licensed, tested products" }] },
    ],
  },
];

// ============================================================================
// ADDITIONAL DEALS - Category-Specific
// ============================================================================
const ADDITIONAL_DEALS = [
  {
    _id: "deal-tincture-tuesday",
    _type: "deal",
    title: "Tincture Tuesday: 20% Off All Tinctures",
    slug: { _type: "slug", current: "tincture-tuesday" },
    shortDescription: "Every Tuesday, save 20% on all tinctures",
    badgeText: "20% OFF",
    badgeColor: "green",
    discountType: "percent",
    discountValue: 20,
    minPurchase: 0,
    isStackable: false,
    isActive: true,
    description: [
      { _type: "block", _key: uuid(), style: "normal", children: [{ _type: "span", text: "Make Tuesdays your wellness day! Every Tuesday, enjoy 20% off our entire tincture and oil collection. From CBD-only to high-THC formulations, find your perfect ratio at a great price." }] },
    ],
  },
  {
    _id: "deal-topical-relief",
    _type: "deal",
    title: "Pain Relief Bundle: $49.99",
    slug: { _type: "slug", current: "topical-pain-bundle" },
    shortDescription: "Topical balm + patches bundle deal",
    badgeText: "$49.99",
    badgeColor: "blue",
    discountType: "fixed",
    discountValue: 49.99,
    minPurchase: 0,
    isStackable: false,
    isActive: true,
    description: [
      { _type: "block", _key: uuid(), style: "normal", children: [{ _type: "span", text: "Targeted relief from head to toe. Get our best-selling CBD:THC balm plus a 3-pack of transdermal patches for just $49.99 (a $70+ value). Perfect for athletes, active lifestyles, or chronic pain management." }] },
    ],
  },
  {
    _id: "deal-preroll-friday",
    _type: "deal",
    title: "Pre-Roll Friday: Buy 4 Get 1 Free",
    slug: { _type: "slug", current: "preroll-friday" },
    shortDescription: "Buy any 4 pre-rolls, get 5th free",
    badgeText: "5 FOR 4",
    badgeColor: "purple",
    discountType: "bogo",
    discountValue: 100,
    minPurchase: 0,
    isStackable: false,
    isActive: true,
    description: [
      { _type: "block", _key: uuid(), style: "normal", children: [{ _type: "span", text: "Start your weekend right! Every Friday, buy any 4 pre-rolls and get your 5th one free. Mix and match strains, sizes, and even infused options. The cheapest pre-roll in your selection is free." }] },
    ],
  },
  {
    _id: "deal-gear-clearance",
    _type: "deal",
    title: "Accessory Clearance: Up to 40% Off",
    slug: { _type: "slug", current: "gear-clearance" },
    shortDescription: "Clearance sale on select accessories",
    badgeText: "40% OFF",
    badgeColor: "red",
    discountType: "percent",
    discountValue: 40,
    minPurchase: 0,
    isStackable: false,
    isActive: true,
    description: [
      { _type: "block", _key: uuid(), style: "normal", children: [{ _type: "span", text: "Upgrade your setup for less! Our accessory clearance includes vaporizers, grinders, storage solutions, and more—all at up to 40% off. Limited quantities, while supplies last." }] },
    ],
  },
  {
    _id: "deal-senior-discount",
    _type: "deal",
    title: "Senior Appreciation: 15% Off Daily",
    slug: { _type: "slug", current: "senior-appreciation" },
    shortDescription: "Customers 65+ save 15% every day",
    badgeText: "15% OFF",
    badgeColor: "green",
    discountType: "percent",
    discountValue: 15,
    minPurchase: 0,
    isStackable: true,
    isActive: true,
    description: [
      { _type: "block", _key: uuid(), style: "normal", children: [{ _type: "span", text: "We appreciate our senior customers! If you're 65 or older, enjoy 15% off every purchase, every day. Simply show valid ID at checkout. Can be combined with loyalty points for extra savings." }] },
    ],
  },
  {
    _id: "deal-industry-night",
    _type: "deal",
    title: "Industry Night: 25% Off (Wednesdays)",
    slug: { _type: "slug", current: "industry-night" },
    shortDescription: "Cannabis industry workers save 25%",
    badgeText: "25% OFF",
    badgeColor: "blue",
    discountType: "percent",
    discountValue: 25,
    minPurchase: 0,
    isStackable: false,
    isActive: true,
    description: [
      { _type: "block", _key: uuid(), style: "normal", children: [{ _type: "span", text: "We support our own! Every Wednesday is Industry Night. Cannabis industry employees receive 25% off their entire purchase. Bring your dispensary badge, cultivation badge, or pay stub as proof of employment." }] },
    ],
  },
];

// ============================================================================
// ADDITIONAL QUIZZES - More Engagement
// ============================================================================
const ADDITIONAL_QUIZZES = [
  {
    _id: "quiz-concentrate-knowledge",
    _type: "quiz",
    title: "Concentrate Connoisseur Quiz",
    slug: { _type: "slug", current: "concentrate-connoisseur-quiz" },
    description: "Test your knowledge of cannabis extracts and earn 100 loyalty points! From wax to diamonds, prove your expertise.",
    articleRef: { _type: "reference", _ref: "article-concentrates-explained" },
    passThreshold: 0.8,
    pointsReward: 100,
    maxAttempts: 2,
    isActive: true,
    startAt: new Date().toISOString(),
    questions: [
      {
        _key: uuid(),
        prompt: "What extraction method uses only heat and pressure, with no solvents?",
        options: ["BHO Extraction", "CO2 Extraction", "Rosin Press", "Ethanol Extraction"],
        correctIndex: 2,
        explanation: "Rosin is made using only heat and pressure, making it a completely solventless extraction method."
      },
      {
        _key: uuid(),
        prompt: "What makes 'live resin' different from regular resin?",
        options: [
          "It's made from higher THC plants",
          "It's extracted from fresh-frozen cannabis",
          "It contains living bacteria",
          "It's aged for longer periods"
        ],
        correctIndex: 1,
        explanation: "Live resin is made from cannabis that was flash-frozen immediately after harvest, preserving the full terpene profile."
      },
      {
        _key: uuid(),
        prompt: "What temperature range is considered 'low-temp' for dabbing?",
        options: ["300-400°F", "400-500°F", "600-700°F", "700-800°F"],
        correctIndex: 1,
        explanation: "Low-temp dabbing (400-500°F) maximizes flavor and provides smoother hits, though with less visible vapor."
      },
      {
        _key: uuid(),
        prompt: "THCA diamonds are:",
        options: [
          "Synthetic THC crystals",
          "Highly purified crystalline THCA",
          "A type of CBD product",
          "Infused edibles"
        ],
        correctIndex: 1,
        explanation: "THCA diamonds are highly purified, crystalline forms of THCA that can exceed 99% purity."
      },
      {
        _key: uuid(),
        prompt: "Which concentrate typically has the highest terpene content?",
        options: ["Distillate", "Shatter", "Live Resin", "Isolate"],
        correctIndex: 2,
        explanation: "Live resin preserves the most terpenes because it's made from fresh-frozen plant material before terpenes can degrade."
      },
    ],
  },
  {
    _id: "quiz-vape-safety",
    _type: "quiz",
    title: "Vape Safety & Knowledge Quiz",
    slug: { _type: "slug", current: "vape-safety-quiz" },
    description: "Learn essential vaping safety and earn 50 loyalty points! Protect yourself and enjoy responsibly.",
    articleRef: { _type: "reference", _ref: "article-vape-cartridge-guide" },
    passThreshold: 0.7,
    pointsReward: 50,
    maxAttempts: 3,
    isActive: true,
    startAt: new Date().toISOString(),
    questions: [
      {
        _key: uuid(),
        prompt: "What type of vape oil uses added terpenes for flavor?",
        options: ["Live Resin", "Rosin", "Distillate", "Full Spectrum"],
        correctIndex: 2,
        explanation: "Distillate is pure THC/CBD that has terpenes stripped during processing, then often has terpenes re-added for flavor."
      },
      {
        _key: uuid(),
        prompt: "What should you look for to verify a cartridge is safe?",
        options: [
          "The cheapest price",
          "Third-party lab testing (COA)",
          "The most THC",
          "Colorful packaging"
        ],
        correctIndex: 1,
        explanation: "Always verify products have Certificates of Analysis (COA) from third-party labs testing for potency, pesticides, and contaminants."
      },
      {
        _key: uuid(),
        prompt: "What is a '510 thread' referring to?",
        options: [
          "A type of cannabis strain",
          "The standard cartridge-battery connection",
          "A voltage setting",
          "The oil capacity"
        ],
        correctIndex: 1,
        explanation: "510 thread is the universal standard connection between vape cartridges and batteries, named for its 10 threads at 0.5mm spacing."
      },
      {
        _key: uuid(),
        prompt: "Why might someone choose live resin carts over distillate?",
        options: [
          "Lower price",
          "Higher THC percentage",
          "Better strain-specific flavor and effects",
          "Longer shelf life"
        ],
        correctIndex: 2,
        explanation: "Live resin preserves the original terpene profile of the strain, delivering more authentic flavor and potentially more nuanced effects."
      },
    ],
  },
  {
    _id: "quiz-cannabis-basics",
    _type: "quiz",
    title: "Cannabis 101: The Basics",
    slug: { _type: "slug", current: "cannabis-basics-quiz" },
    description: "New to cannabis? Test your foundational knowledge and earn 25 points! Perfect for beginners.",
    articleRef: { _type: "reference", _ref: "article-indica-vs-sativa" },
    passThreshold: 0.6,
    pointsReward: 25,
    maxAttempts: 5,
    isActive: true,
    startAt: new Date().toISOString(),
    questions: [
      {
        _key: uuid(),
        prompt: "What is THC?",
        options: [
          "A type of cannabis plant",
          "The primary psychoactive compound in cannabis",
          "A brand of edibles",
          "A consumption method"
        ],
        correctIndex: 1,
        explanation: "THC (tetrahydrocannabinol) is the main psychoactive compound in cannabis that produces the 'high' feeling."
      },
      {
        _key: uuid(),
        prompt: "What is CBD known for?",
        options: [
          "Getting you high",
          "Non-psychoactive wellness benefits",
          "Being illegal everywhere",
          "Only coming from hemp"
        ],
        correctIndex: 1,
        explanation: "CBD (cannabidiol) is non-intoxicating and is associated with various wellness benefits without producing a high."
      },
      {
        _key: uuid(),
        prompt: "What's the legal age for recreational cannabis in most US states?",
        options: ["18", "19", "21", "25"],
        correctIndex: 2,
        explanation: "In most US states with legal recreational cannabis, the minimum age is 21, similar to alcohol."
      },
      {
        _key: uuid(),
        prompt: "Which consumption method typically has the fastest onset?",
        options: ["Edibles", "Tinctures (swallowed)", "Smoking/Vaping", "Topicals"],
        correctIndex: 2,
        explanation: "Smoking and vaping have the fastest onset (within minutes) because cannabinoids enter the bloodstream through the lungs."
      },
      {
        _key: uuid(),
        prompt: "What does 'strain' refer to in cannabis?",
        options: [
          "The THC percentage",
          "A specific variety of cannabis with unique characteristics",
          "The growing method",
          "The price category"
        ],
        correctIndex: 1,
        explanation: "A strain (or cultivar) is a specific variety of cannabis with its own unique appearance, aroma, flavor, and effects."
      },
    ],
  },
];

// ============================================================================
// ADDITIONAL FAQ ITEMS
// ============================================================================
const ADDITIONAL_FAQS = [
  {
    _id: "faq-concentrates-beginners",
    _type: "faqItem",
    question: "Are concentrates safe for beginners?",
    channels: ["mobile", "web"],
    answer: [
      { _type: "block", _key: uuid(), style: "normal", children: [{ _type: "span", text: "Concentrates are significantly more potent than flower (60-90% THC vs 15-25%). We recommend beginners start with flower or low-dose edibles to understand their tolerance first. If you're curious about concentrates, start with a very small amount (rice grain sized) and wait to feel effects before consuming more. Consider trying a vape cartridge first—they're easier to dose than dabs." }] },
    ],
  },
  {
    _id: "faq-tincture-sublingual",
    _type: "faqItem",
    question: "How do I use a tincture sublingually?",
    channels: ["mobile", "web"],
    answer: [
      { _type: "block", _key: uuid(), style: "normal", children: [{ _type: "span", text: "Place your measured dose under your tongue using the dropper. Hold it there for 60-90 seconds to allow absorption through the sublingual glands, then swallow. This method provides faster onset (15-30 minutes) compared to swallowing immediately. Avoid eating or drinking for a few minutes after for best results." }] },
    ],
  },
  {
    _id: "faq-vape-battery",
    _type: "faqItem",
    question: "Why won't my vape cartridge work?",
    channels: ["mobile", "web", "kiosk"],
    answer: [
      { _type: "block", _key: uuid(), style: "normal", children: [{ _type: "span", text: "Common fixes: 1) Make sure the battery is charged and turned on (usually 5 clicks), 2) Check that the cartridge is screwed in properly but not too tight, 3) Clean the connection points with a cotton swab and rubbing alcohol, 4) Try a different battery if available, 5) Some cartridges require preheating—hold the button for 2-3 seconds before inhaling. If none of these work, the cartridge may be defective—contact us with your receipt." }] },
    ],
  },
  {
    _id: "faq-edible-not-working",
    _type: "faqItem",
    question: "I took an edible and don't feel anything. Should I take more?",
    channels: ["mobile", "web"],
    answer: [
      { _type: "block", _key: uuid(), style: "normal", children: [{ _type: "span", text: "Wait! Edibles can take 30 minutes to 2 hours to kick in, depending on your metabolism and whether you've eaten. Taking more before the first dose kicks in is a common mistake that leads to uncomfortable experiences. Wait at least 2 full hours before considering another dose. Factors that affect onset: empty vs. full stomach, individual metabolism, and the specific product formulation." }] },
    ],
  },
  {
    _id: "faq-store-products",
    _type: "faqItem",
    question: "How should I store my cannabis products?",
    channels: ["mobile", "web"],
    answer: [
      { _type: "block", _key: uuid(), style: "normal", children: [{ _type: "span", text: "Flower: Store in an airtight glass jar in a cool, dark place (60-70°F). Use humidity packs to maintain 59-63% RH. Edibles: Follow package instructions; most do well at room temperature away from heat. Cartridges: Store upright at room temperature. Concentrates: Keep in silicone or glass containers, refrigerate for long-term storage. Never freeze flower (damages trichomes) or leave products in hot cars." }] },
    ],
  },
  {
    _id: "faq-thc-cbd-difference",
    _type: "faqItem",
    question: "What's the difference between THC and CBD?",
    channels: ["mobile", "web", "kiosk"],
    answer: [
      { _type: "block", _key: uuid(), style: "normal", children: [{ _type: "span", text: "THC (tetrahydrocannabinol) is the primary psychoactive compound—it gets you 'high.' CBD (cannabidiol) is non-intoxicating and is associated with relaxation, pain relief, and anxiety reduction without euphoria. Many products combine both in specific ratios: high-THC for recreation, high-CBD for wellness, and balanced ratios for therapeutic use with mild psychoactivity." }] },
    ],
  },
];

// ============================================================================
// MAIN SEEDING FUNCTION
// ============================================================================
async function seedAdditionalContent() {
  console.log("🌱 Starting Additional Sanity Content Seed...\n");

  const allDocuments = [
    ...ADDITIONAL_ARTICLES,
    ...ADDITIONAL_DEALS,
    ...ADDITIONAL_QUIZZES,
    ...ADDITIONAL_FAQS,
  ];

  console.log(`📦 Preparing ${allDocuments.length} additional documents:`);
  console.log(`   • ${ADDITIONAL_ARTICLES.length} Articles (complete category coverage)`);
  console.log(`   • ${ADDITIONAL_DEALS.length} Deals (category-specific offers)`);
  console.log(`   • ${ADDITIONAL_QUIZZES.length} Quizzes (more engagement opportunities)`);
  console.log(`   • ${ADDITIONAL_FAQS.length} FAQ Items (common questions)\n`);

  let transaction = client.transaction();

  for (const doc of allDocuments) {
    transaction = transaction.createOrReplace(doc as any);
  }

  try {
    const result = await transaction.commit();
    console.log(`✅ Successfully seeded ${result.documentIds?.length || allDocuments.length} documents!`);
    console.log("\n📊 Category Coverage Summary:");
    console.log("   ✓ Gear/Accessories: 3 articles (vaporizers, storage, rolling)");
    console.log("   ✓ Tinctures: 2 new articles (complete guide, CBD beginners)");
    console.log("   ✓ Concentrates: 2 new articles (dabbing guide, live resin vs rosin)");
    console.log("   ✓ Edibles: 2 new articles (beverages, microdosing)");
    console.log("   ✓ Flower: 2 new articles (freshness, strain hunting)");
    console.log("   ✓ Topicals: 1 new article (transdermal patches)");
    console.log("   ✓ Pre-Rolls: 1 new article (infused pre-rolls)");
    console.log("   ✓ Vape: 1 new article (disposables)");
    console.log("\n🎉 Full demo content is now complete!");
    console.log("   View at: https://nimbus-cms.sanity.studio/\n");
  } catch (error) {
    console.error("❌ Error seeding content:", error);
    process.exit(1);
  }
}

seedAdditionalContent().catch(console.error);
