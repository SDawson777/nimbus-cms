#!/usr/bin/env node
/**
 * Generate bcrypt password hash for admins.json
 * Usage: node scripts/hash-password.js <password>
 */

const bcrypt = require('bcryptjs');

const password = process.argv[2];

if (!password) {
  console.error('❌ Error: Please provide a password');
  console.error('Usage: node scripts/hash-password.js <password>');
  process.exit(1);
}

const saltRounds = 10;
const hash = bcrypt.hashSync(password, saltRounds);

console.log('✅ Password hash generated:\n');
console.log(hash);
console.log('\nCopy this hash to the passwordHash field in server/config/admins.json');
