#!/usr/bin/env node
/**
 * Test script: Verify live weather API integration
 * Tests the complete flow from API key → proxy endpoint → admin dashboard
 */

const fs = require("fs");
const path = require("path");

console.log("\n╔════════════════════════════════════════════════════════════════════════╗");
console.log("║          🌤️  LIVE WEATHER API INTEGRATION TEST                         ║");
console.log("╚════════════════════════════════════════════════════════════════════════╝\n");

// Check environment configuration
console.log("📋 CHECKING CONFIGURATION\n" + "━".repeat(74));

const envPath = path.join(__dirname, ".env");
if (!fs.existsSync(envPath)) {
  console.log("❌ .env file not found");
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, "utf8");
const apiKeyMatch = envContent.match(/OPENWEATHER_API_KEY=(.+)/);

if (!apiKeyMatch || !apiKeyMatch[1]) {
  console.log("❌ OPENWEATHER_API_KEY not configured in .env");
  process.exit(1);
}

const apiKey = apiKeyMatch[1].trim();
console.log(`✅ API Key configured: ${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`);

// Check AdminBanner component
console.log("\n🔍 CHECKING ADMIN BANNER COMPONENT\n" + "━".repeat(74));

const adminBannerPath = path.join(__dirname, "../apps/admin/src/components/AdminBanner.jsx");
if (!fs.existsSync(adminBannerPath)) {
  console.log("❌ AdminBanner.jsx not found");
  process.exit(1);
}

const bannerContent = fs.readFileSync(adminBannerPath, "utf8");

const checks = [
  { name: "Weather proxy endpoint", pattern: /\/api\/v1\/nimbus\/proxy\/weather/, found: false },
  { name: "Temperature processing", pattern: /tempF.*Math\.round/, found: false },
  { name: "Condition mapping", pattern: /normalizeCondition/, found: false },
  { name: "Icon assignment", pattern: /iconForMood/, found: false },
  { name: "Fallback handling", pattern: /FALLBACK_BANNER/, found: false },
  { name: "Geolocation support", pattern: /navigator\.geolocation/, found: false },
];

checks.forEach((check) => {
  check.found = check.pattern.test(bannerContent);
  console.log(`${check.found ? "✅" : "❌"} ${check.name}`);
});

// Test API endpoint (requires server to be running)
console.log("\n🌐 TESTING LIVE API ENDPOINT\n" + "━".repeat(74));

const SERVER_URL = "http://localhost:8080";
const testCities = [
  { city: "Detroit,US", label: "Detroit, MI" },
  { city: "Los Angeles,US", label: "Los Angeles, CA" },
];

async function testWeatherEndpoint() {
  for (const { city, label } of testCities) {
    try {
      const url = `${SERVER_URL}/api/v1/nimbus/proxy/weather?city=${city}&units=imperial`;
      const response = await fetch(url);
      
      if (!response.ok) {
        console.log(`⚠️  ${label}: HTTP ${response.status}`);
        if (response.status === 500) {
          const error = await response.json();
          if (error.error?.includes("not configured")) {
            console.log("   → Server needs restart to pick up new API key");
            console.log("   → Run: npx pnpm server:dev");
          }
        }
        continue;
      }

      const data = await response.json();
      
      if (data.cod && data.cod !== 200) {
        console.log(`❌ ${label}: API error ${data.cod} - ${data.message}`);
        continue;
      }

      const temp = data.main?.temp;
      const condition = data.weather?.[0]?.main;
      const description = data.weather?.[0]?.description;
      const humidity = data.main?.humidity;
      const windSpeed = data.wind?.speed;
      
      console.log(`✅ ${label}:`);
      console.log(`   Temperature: ${temp ? Math.round(temp) : "N/A"}°F`);
      console.log(`   Condition: ${condition || "N/A"} (${description || "N/A"})`);
      console.log(`   Humidity: ${humidity || "N/A"}%`);
      console.log(`   Wind: ${windSpeed || "N/A"} mph`);
      console.log(`   Coord: ${data.coord?.lat}, ${data.coord?.lon}`);
    } catch (error) {
      console.log(`❌ ${label}: ${error.message}`);
      if (error.code === "ECONNREFUSED") {
        console.log("   → Server not running on port 8080");
        console.log("   → Start with: npx pnpm server:dev");
      }
    }
  }
}

// Test with coordinates (geolocation simulation)
async function testCoordinates() {
  console.log("\n📍 TESTING COORDINATE-BASED WEATHER\n" + "━".repeat(74));
  
  // Detroit coordinates
  const lat = 42.3314;
  const lon = -83.0458;
  
  try {
    const url = `${SERVER_URL}/api/v1/nimbus/proxy/weather?lat=${lat}&lon=${lon}&units=imperial`;
    const response = await fetch(url);
    
    if (!response.ok) {
      console.log(`⚠️  Coordinate lookup: HTTP ${response.status}`);
      return;
    }
    
    const data = await response.json();
    const temp = Math.round(data.main?.temp || 0);
    const condition = data.weather?.[0]?.main || "Unknown";
    const city = data.name || "Unknown";
    
    console.log(`✅ Geolocation weather (${lat}, ${lon}):`);
    console.log(`   Location: ${city}`);
    console.log(`   Temperature: ${temp}°F`);
    console.log(`   Condition: ${condition}`);
  } catch (error) {
    console.log(`❌ Coordinate test failed: ${error.message}`);
  }
}

// Main test execution
(async () => {
  try {
    await testWeatherEndpoint();
    await testCoordinates();
    
    console.log("\n" + "━".repeat(74));
    console.log("\n💡 ADMIN DASHBOARD USAGE\n" + "━".repeat(74));
    console.log("The weather widget in AdminBanner.jsx will:");
    console.log("  1. Attempt to get user's geolocation (if browser allows)");
    console.log("  2. Fall back to configured city (Detroit, US by default)");
    console.log("  3. Make request to /api/v1/nimbus/proxy/weather");
    console.log("  4. Display live weather with animated transitions");
    console.log("  5. Fall back to static data if API unavailable");
    
    console.log("\n🚀 NEXT STEPS\n" + "━".repeat(74));
    console.log("  • Ensure server is running: npx pnpm server:dev");
    console.log("  • Start admin dashboard: npx pnpm admin:dev");
    console.log("  • Open http://localhost:5173 in browser");
    console.log("  • Weather widget will show live data in banner");
    
    console.log("\n✅ LIVE WEATHER API TEST COMPLETE\n");
  } catch (error) {
    console.error("\n❌ Test failed:", error);
    process.exit(1);
  }
})();
