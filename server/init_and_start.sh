#!/usr/bin/env sh
set -e

# Apply Prisma migrations if present, otherwise push schema
echo "[init] Applying Prisma migrations (if any)..."
if command -v npx >/dev/null 2>&1; then
  # Try migrate deploy first (for migration-based workflows)
  if npx prisma migrate deploy --schema=../prisma/schema.prisma 2>&1 | tee /tmp/migrate.log; grep -q "No pending migrations" /tmp/migrate.log || grep -q "migration(s) have been applied" /tmp/migrate.log; then
    echo "[init] prisma migrate deploy succeeded or no migrations pending"
  else
    echo "[init] prisma migrate deploy failed or no migrations; attempting prisma db push"
    npx prisma db push --schema=../prisma/schema.prisma --accept-data-loss || echo "[init] WARNING: prisma db push failed; continuing startup"
  fi
else
  echo "[init] npx not found; skipping migrations"
fi

echo "[init] Starting server"
exec node dist/index.js
