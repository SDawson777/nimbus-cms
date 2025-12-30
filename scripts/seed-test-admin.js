#!/usr/bin/env node
const { execSync } = require('child_process');

try {
  // Delegate to the server-scoped TypeScript seed command for consistency
  console.log('Delegating seeding to: pnpm -C server run seed:e2e');
  execSync('pnpm -C server run seed:e2e', { stdio: 'inherit' });
  process.exit(0);
} catch (err) {
  console.error('Failed to delegate seed to server:', err && err.message ? err.message : err);
  process.exit(1);
}
