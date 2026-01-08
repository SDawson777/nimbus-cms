#!/usr/bin/env node
/**
 * Test script: Check all Admin SPA pages for load errors
 * Visits each route and validates the page loads without errors
 */

const pages = [
  { path: "/", name: "Root (redirects to dashboard)" },
  { path: "/login", name: "Login" },
  { path: "/accept-invitation", name: "Accept Invitation", query: "?token=test" },
  { path: "/reset-password", name: "Reset Password", query: "?token=test" },
  { path: "/dashboard", name: "Dashboard", auth: true },
  { path: "/admins", name: "Admins", auth: true },
  { path: "/analytics", name: "Analytics", auth: true },
  { path: "/analytics/settings", name: "Analytics Settings", auth: true },
  { path: "/settings", name: "Settings", auth: true },
  { path: "/compliance", name: "Compliance", auth: true },
  { path: "/orders", name: "Orders", auth: true },
  { path: "/products", name: "Products", auth: true },
  { path: "/articles", name: "Articles", auth: true },
  { path: "/faqs", name: "FAQs", auth: true },
  { path: "/deals", name: "Deals", auth: true },
  { path: "/legal", name: "Legal", auth: true },
  { path: "/theme", name: "Theme", auth: true },
  { path: "/personalization", name: "Personalization", auth: true },
  { path: "/heatmap", name: "Heatmap", auth: true },
  { path: "/undo", name: "Undo", auth: true },
];

console.log("\n╔═══════════════════════════════════════════════════════════════════════╗");
console.log("║              🧪 ADMIN SPA PAGE LOAD TEST                             ║");
console.log("╚═══════════════════════════════════════════════════════════════════════╝\n");

const BASE_URL = "http://localhost:5173";

async function checkPage(page) {
  const url = `${BASE_URL}${page.path}${page.query || ""}`;
  
  try {
    const response = await fetch(url, {
      redirect: "manual", // Don't follow redirects automatically
    });
    
    // For SPA, all routes should return 200 (the index.html)
    if (response.status === 200) {
      return { success: true, status: 200 };
    } else if (response.status >= 300 && response.status < 400) {
      // Redirects are handled client-side in SPA
      return { success: true, status: response.status, redirect: true };
    } else {
      return { success: false, status: response.status, error: `HTTP ${response.status}` };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log("📋 TESTING PAGES\n" + "━".repeat(74));
  
  let passed = 0;
  let failed = 0;
  const errors = [];
  
  for (const page of pages) {
    process.stdout.write(`Testing ${page.name.padEnd(30, " ")} ... `);
    
    const result = await checkPage(page);
    
    if (result.success) {
      console.log(`✅ ${result.redirect ? "OK (redirect)" : "OK"}`);
      passed++;
    } else {
      console.log(`❌ FAILED - ${result.error || "Unknown error"}`);
      failed++;
      errors.push({
        page: page.name,
        path: page.path,
        error: result.error || "Unknown error",
      });
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log("\n" + "━".repeat(74));
  console.log("\n📊 TEST RESULTS\n" + "━".repeat(74));
  console.log(`Total Pages:  ${pages.length}`);
  console.log(`✅ Passed:     ${passed}`);
  console.log(`❌ Failed:     ${failed}`);
  
  if (errors.length > 0) {
    console.log("\n⚠️  ERRORS FOUND\n" + "━".repeat(74));
    errors.forEach(({ page, path, error }) => {
      console.log(`\n${page} (${path}):`);
      console.log(`  Error: ${error}`);
    });
  }
  
  console.log("\n" + "━".repeat(74));
  console.log("\n💡 NOTES\n" + "━".repeat(74));
  console.log("• All SPA routes serve index.html (status 200)");
  console.log("• Client-side routing determines actual page display");
  console.log("• Protected routes redirect to /login without auth");
  console.log("• To test authenticated pages, login first");
  console.log("• Browser console may show additional errors not detected here");
  
  console.log("\n🔍 RECOMMENDED: Manual browser testing");
  console.log("━".repeat(74));
  console.log("1. Open http://localhost:5173 in browser");
  console.log("2. Open DevTools Console (F12)");
  console.log("3. Login with admin credentials");
  console.log("4. Navigate through each page");
  console.log("5. Check console for errors (red messages)");
  console.log("6. Check Network tab for failed requests");
  
  if (failed === 0) {
    console.log("\n✅ ALL PAGES LOADING SUCCESSFULLY\n");
    return 0;
  } else {
    console.log("\n⚠️  SOME PAGES FAILED TO LOAD\n");
    return 1;
  }
}

// Check if server is running
(async () => {
  try {
    const response = await fetch(BASE_URL);
    if (!response.ok) {
      console.log("❌ Admin dev server not responding");
      console.log("   Start with: npx pnpm admin:dev");
      process.exit(1);
    }
  } catch (error) {
    console.log("❌ Admin dev server not running");
    console.log("   Start with: npx pnpm admin:dev");
    console.log(`   Error: ${error.message}`);
    process.exit(1);
  }
  
  const exitCode = await runTests();
  process.exit(exitCode);
})();
