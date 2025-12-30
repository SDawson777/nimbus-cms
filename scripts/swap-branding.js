#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// Usage: node scripts/swap-branding.js <brand-name>
// Expects `branding/<brand-name>/` to contain `logo.png` and `theme.json`.

const brandingDir = path.join(__dirname, '..', 'branding');
const adminPublic = path.join(__dirname, '..', 'apps', 'admin', 'public');

const brand = process.argv[2];
if (!brand) {
  console.error('Usage: node scripts/swap-branding.js <brand-name>');
  process.exit(2);
}

const source = path.join(brandingDir, brand);
if (!fs.existsSync(source)) {
  console.error('Branding source not found:', source);
  process.exit(1);
}

// Copy files
const entries = fs.readdirSync(source);
for (const e of entries) {
  const src = path.join(source, e);
  const dst = path.join(adminPublic, e);
  fs.copyFileSync(src, dst);
  console.log('Copied', src, '->', dst);
}

console.log('Branding swap completed. Remember to update theme config documents in Sanity if required.');
