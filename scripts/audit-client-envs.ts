import fs from 'fs';
import path from 'path';

// Simple audit script: scans apps/*/.env.example for VITE_* entries
// and warns if any VITE_* contains tokens like KEY, SECRET, TOKEN, MAPBOX, WEATHER

const workspaceRoot = path.join(__dirname, '..');
const appsDir = path.join(workspaceRoot, 'apps');

const sensitiveKeywords = ['KEY', 'SECRET', 'TOKEN', 'MAPBOX', 'WEATHER', 'API_KEY', 'PRIVATE'];

function scanFile(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/);
  const findings: string[] = [];
  for (const [i, line] of lines.entries()) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [key, val] = trimmed.split('=');
    if (!key) continue;
    if (key.startsWith('VITE_')) {
      const upper = (val || '').toUpperCase();
      for (const kw of sensitiveKeywords) {
        if (upper.includes(kw)) {
          findings.push(`${key} in ${filePath}:${i + 1} references sensitive token fragment '${kw}'`);
        }
      }
    }
  }
  return findings;
}

function scan() {
  const results: string[] = [];
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
