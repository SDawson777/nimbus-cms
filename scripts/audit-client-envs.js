#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const workspaceRoot = path.join(__dirname, '..');
const appsDir = path.join(workspaceRoot, 'apps');
const sensitiveKeywords = ['KEY', 'SECRET', 'TOKEN', 'MAPBOX', 'WEATHER', 'API_KEY', 'PRIVATE'];
// Also detect explicit server-only envs that should not appear in client .env files
const forbiddenServerOnly = ['PREVIEW_SECRET', 'SANITY_API_TOKEN', 'MAPBOX_TOKEN', 'OPENWEATHER_API_KEY'];
function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/);
  const findings = [];
  for (const [i, line] of lines.entries()) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const parts = trimmed.split('=');
    const key = parts[0];
    const val = parts.slice(1).join('=');
    if (!key) continue;
    if (key.startsWith('VITE_')) {
      const upper = (val || '').toUpperCase();
      for (const kw of sensitiveKeywords) {
        if (upper.includes(kw)) {
          findings.push(`${key} in ${filePath}:${i + 1} references sensitive token fragment '${kw}'`);
        }
      }
    }
    // Also flag if someone accidentally added server-only envs into client env files (without VITE_)
    if (forbiddenServerOnly.includes(key)) {
      findings.push(`${key} in ${filePath}:${i + 1} is a server-only secret and must not be present in client env files`);
    }
  }
  return findings;
}
function scan() {
  const results = [];
  if (!fs.existsSync(appsDir)) {
    console.log('No apps directory found');
    process.exit(0);
  }
  const apps = fs.readdirSync(appsDir);
  for (const a of apps) {
    const candidate = path.join(appsDir, a, '.env.example');
    if (fs.existsSync(candidate)) {
      results.push(...scanFile(candidate));
    }
  }
  if (results.length) {
    console.warn('Potentially unsafe client env vars found:');
    for (const r of results) console.warn(' -', r);
    process.exitCode = 2;
  } else {
    console.log('No risky VITE_* client envs detected in apps/*/.env.example');
  }
}
if (require.main === module) scan();
module.exports = { scan };
