#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const envExampleFiles = [
  "server/.env.example",
  "apps/admin/.env.example",
  "apps/studio/.env.example",
];

function parseEnvExample(filePath) {
  const fullPath = path.join(__dirname, "..", filePath);
  if (!fs.existsSync(fullPath)) return [];

  const content = fs.readFileSync(fullPath, "utf8");
  const keys = new Set();

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex <= 0) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    if (key) keys.add(key);
  }

  return Array.from(keys);
}

const requiredKeys = new Set();
for (const rel of envExampleFiles) {
  for (const key of parseEnvExample(rel)) {
    requiredKeys.add(key);
  }
}

if (requiredKeys.size === 0) {
  console.log("No env keys discovered from .env.example files.");
  process.exit(0);
}

const missing = [];
for (const key of requiredKeys) {
  const val = process.env[key];
  if (val === undefined || val === "") {
    missing.push(key);
  }
}

if (missing.length === 0) {
  console.log("All required environment variables are present.");
  console.log("Required keys:", Array.from(requiredKeys).sort().join(", "));
  process.exit(0);
}

console.error("Missing required environment variables:");
for (const key of missing.sort()) {
  console.error("  -", key);
}
console.error("\nEnsure these are set locally (.env) and in CI secrets.");
process.exit(1);
