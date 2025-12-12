#!/usr/bin/env node
const pa11y = require("pa11y");

async function main() {
  const url = process.env.PA11Y_URL || process.argv[2];
  if (!url) {
    console.error(
      "No target URL provided. Set the PA11Y_URL environment variable or pass a URL as the first argument.",
    );
    process.exit(2);
  }
  try {
    const results = await pa11y(url, {
      // pass Chrome args to avoid sandbox issues in CI
      chromeLaunchConfig: {
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      },
    });
    console.log(JSON.stringify(results, null, 2));
    if (results.issues && results.issues.length > 0) {
      console.error(`pa11y detected ${results.issues.length} issues`);
      process.exit(1);
    }
    process.exit(0);
  } catch (err) {
    console.error("pa11y failed", err);
    process.exit(2);
  }
}

main();
