#!/usr/bin/env node

import { chromium } from "@playwright/test";

function usageAndExit() {
  // eslint-disable-next-line no-console
  console.error("Usage: node scripts/smoke-check-deploy.mjs <baseUrl>");
  process.exit(2);
}

const baseUrl = process.argv[2] || process.env.BASE_URL;
if (!baseUrl) usageAndExit();

const healthzUrl = new URL("/healthz", baseUrl).toString();
const statusUrl = new URL("/api/v1/status", baseUrl).toString();
const adminUrl = new URL("/admin", baseUrl).toString();

const healthRes = await fetch(healthzUrl, { redirect: "follow" });
if (healthRes.status !== 200) {
  // eslint-disable-next-line no-console
  console.error("Health check failed", { url: healthzUrl, status: healthRes.status });
  process.exit(1);
}

const statusRes = await fetch(statusUrl, { redirect: "follow" });
if (statusRes.status !== 200) {
  // eslint-disable-next-line no-console
  console.error("Status check failed", { url: statusUrl, status: statusRes.status });
  process.exit(1);
}
try {
  const payload = await statusRes.clone().json();
  if (!payload || payload.ok !== true) {
    // eslint-disable-next-line no-console
    console.error("Status check returned unexpected payload", { url: statusUrl, payload });
    process.exit(1);
  }
} catch {
  // ignore JSON parse errors (some deployments may return plain JSON-ish strings)
}

const browser = await chromium.launch();
const page = await browser.newPage();

const consoleErrors = [];
page.on("console", (msg) => {
  if (msg.type() === "error") consoleErrors.push(msg.text());
});
page.on("pageerror", (err) => {
  consoleErrors.push(String(err?.message || err));
});

await page.goto(adminUrl, { waitUntil: "networkidle", timeout: 60_000 });
await page.locator("#root").waitFor({ timeout: 30_000 });

// Give late-running async chunks a brief moment to surface errors.
await page.waitForTimeout(1000);

await browser.close();

if (consoleErrors.length > 0) {
  // eslint-disable-next-line no-console
  console.error("Admin console/page errors detected:");
  for (const line of consoleErrors) {
    // eslint-disable-next-line no-console
    console.error("-", line);
  }
  process.exit(1);
}

// eslint-disable-next-line no-console
console.log("OK", { healthz: healthzUrl, status: statusUrl, admin: adminUrl });
