/**
 * Fix the themeConfig document to match schema
 * Removes non-existent fields and uses correct field names
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

async function fixThemeConfig() {
  console.log("🔧 Fixing themeConfig document...\n");

  // Delete the invalid document
  await client.delete("theme-config-demo");
  console.log("✅ Deleted old theme-config-demo with invalid fields");

  // Get the brand reference ID (we have brand-nimbus)
  const brandId = "brand-nimbus";

  // Create corrected themeConfig matching the actual schema
  const correctedThemeConfig = {
    _id: "theme-config-nimbus",
    _type: "themeConfig",
    // Reference to brand
    brand: { _type: "reference", _ref: brandId },
    // Colors (all properly defined in schema)
    primaryColor: "#10B981", // Emerald green
    secondaryColor: "#6366F1", // Indigo
    accentColor: "#F59E0B", // Amber
    surfaceColor: "#F9FAFB", // Light gray
    backgroundColor: "#FFFFFF", // White
    textColor: "#111827", // Near black
    mutedTextColor: "#6B7280", // Gray (correct field name, not textSecondaryColor)
    // Logo URL
    logoUrl: "https://placehold.co/200x60/10B981/FFFFFF?text=NIMBUS",
    // Typography object (correct nested structure)
    typography: {
      fontFamily: "Inter",
      fontSize: "16px",
    },
    // Correct field name: cornerRadius (not borderRadius)
    cornerRadius: "8px",
    elevationStyle: "medium",
    darkModeEnabled: false,
    // Note: brandSlug and faviconUrl are NOT in the schema - removed
  };

  await client.createOrReplace(correctedThemeConfig);
  console.log("✅ Created corrected theme-config-nimbus");

  // Also create a second themeConfig for the demo operator org (different brand/store)
  // First check if we have a brand for demo operator
  const brands = await client.fetch('*[_type=="brand"]{_id,name}');
  console.log("\n📋 Found brands:", brands);

  // Create a second theme config for variety (dark mode variant)
  const darkThemeConfig = {
    _id: "theme-config-aero",
    _type: "themeConfig",
    brand: { _type: "reference", _ref: "brand-aero" },
    primaryColor: "#3B82F6", // Blue
    secondaryColor: "#8B5CF6", // Purple
    accentColor: "#EF4444", // Red
    surfaceColor: "#1F2937", // Dark gray
    backgroundColor: "#111827", // Near black
    textColor: "#F9FAFB", // Near white
    mutedTextColor: "#9CA3AF", // Light gray
    logoUrl: "https://placehold.co/200x60/3B82F6/FFFFFF?text=AERO",
    typography: {
      fontFamily: "Poppins",
      fontSize: "16px",
    },
    cornerRadius: "12px",
    elevationStyle: "high",
    darkModeEnabled: true,
  };

  await client.createOrReplace(darkThemeConfig);
  console.log("✅ Created theme-config-aero (dark mode variant)");

  // Verify the fix
  const themeConfigs = await client.fetch(
    '*[_type=="themeConfig"]{_id, brand->{name}, primaryColor, cornerRadius, typography}'
  );
  console.log("\n📋 Final themeConfig documents:");
  themeConfigs.forEach((tc: any) => {
    console.log(`  - ${tc._id}: brand=${tc.brand?.name}, primary=${tc.primaryColor}, cornerRadius=${tc.cornerRadius}`);
  });

  console.log("\n✅ ThemeConfig fix complete!");
}

fixThemeConfig().catch(console.error);
