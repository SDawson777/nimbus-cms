#!/usr/bin/env node
const pa11y = require("pa11y");

async function main() {
  const url = process.argv[2] || "http://localhost:8080";
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
