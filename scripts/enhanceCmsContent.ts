/**
 * Enhancement Script - Add product references to drops and verify content
 */
import { createClient } from "@sanity/client";

const projectId = "ygbu28p2";
const dataset = "nimbus_demo";
const token = process.env.SANITY_WRITE_TOKEN;

if (!token) {
  console.error("Missing SANITY_WRITE_TOKEN");
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset,
  token,
  useCdn: false,
  apiVersion: "2024-01-01",
});

async function enhanceContent() {
  console.log("🚀 Enhancing CMS Content...\n");

  // Get available products
  const products = await client.fetch('*[_type=="product"]{_id,name}[0..20]');
  console.log(`📦 Found ${products.length} products to reference`);

  // Update drops with product references
  const drops = await client.fetch('*[_type=="drop"]{_id,title}');
  
  if (products.length >= 3) {
    // Update first drop with some products (Exotic Genetix collab)
    await client.patch("drop-collab-genetix")
      .set({
        products: [
          { _type: "reference", _ref: products[0]._id, _key: "p1" },
          { _type: "reference", _ref: products[1]._id, _key: "p2" },
        ],
      })
      .commit();
    console.log("✅ Updated drop-collab-genetix with product references");

    // Update second drop (Holiday 2025)
    await client.patch("drop-holiday-2025")
      .set({
        products: [
          { _type: "reference", _ref: products[2]._id, _key: "p1" },
          { _type: "reference", _ref: products.length > 3 ? products[3]._id : products[0]._id, _key: "p2" },
        ],
      })
      .commit();
    console.log("✅ Updated drop-holiday-2025 with product references");

    // Update third drop (Summer 2026)
    await client.patch("drop-summer-2026")
      .set({
        products: [
          { _type: "reference", _ref: products.length > 4 ? products[4]._id : products[1]._id, _key: "p1" },
          { _type: "reference", _ref: products.length > 5 ? products[5]._id : products[2]._id, _key: "p2" },
          { _type: "reference", _ref: products.length > 6 ? products[6]._id : products[0]._id, _key: "p3" },
        ],
      })
      .commit();
    console.log("✅ Updated drop-summer-2026 with product references");
  }

  // Create store-specific themeConfigs to demonstrate multi-store theming
  const stores = await client.fetch('*[_type=="store"]{_id,name}[0..2]');
  if (stores.length > 0) {
    const storeTheme = {
      _id: "theme-config-store-downtown",
      _type: "themeConfig",
      brand: { _type: "reference", _ref: "brand-nimbus" },
      store: { _type: "reference", _ref: stores.find((s: any) => s.name.includes("Downtown"))?._id || stores[0]._id },
      primaryColor: "#059669", // Darker emerald
      secondaryColor: "#7C3AED", // Violet
      accentColor: "#DC2626", // Red
      surfaceColor: "#F3F4F6",
      backgroundColor: "#FFFFFF",
      textColor: "#1F2937",
      mutedTextColor: "#6B7280",
      logoUrl: "https://placehold.co/200x60/059669/FFFFFF?text=NIMBUS+DTW",
      typography: {
        fontFamily: "Inter",
        fontSize: "16px",
      },
      cornerRadius: "4px",
      elevationStyle: "flat",
      darkModeEnabled: false,
    };
    await client.createOrReplace(storeTheme);
    console.log("✅ Created store-specific themeConfig for Downtown location");
  }

  // Add a comprehensive content audit
  console.log("\n📊 Content Audit Summary:");
  console.log("=".repeat(50));

  const contentTypes = [
    "article",
    "category",
    "author",
    "deal",
    "promo",
    "quiz",
    "faqItem",
    "banner",
    "drop",
    "filterGroup",
    "effectTag",
    "productType",
    "organization",
    "personalizationRule",
    "themeConfig",
    "analyticsSettings",
    "accessibilityPage",
    "transparencyPage",
    "awardsExplainer",
    "legalDoc",
    "brand",
    "store",
    "product",
  ];

  for (const type of contentTypes) {
    const count = await client.fetch(`count(*[_type=="${type}"])`);
    const statusIcon = count > 0 ? "✅" : "⚠️";
    console.log(`${statusIcon} ${type.padEnd(25)} : ${count}`);
  }

  console.log("\n✅ Enhancement complete!");
}

enhanceContent().catch(console.error);
