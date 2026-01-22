#!/usr/bin/env sh
set -e

echo "[init] Current directory: $(pwd)"
echo "[init] Node modules location: $(ls -la node_modules 2>&1 | head -3 || echo 'not found')"

# Apply Prisma migrations if present, otherwise push schema
echo "[init] Applying Prisma migrations (if any)..."
if command -v npx >/dev/null 2>&1; then
  # Try migrate deploy first (for migration-based workflows)
  if npx prisma migrate deploy --schema=../prisma/schema.prisma 2>&1 | tee /tmp/migrate.log; grep -q "No pending migrations" /tmp/migrate.log || grep -q "migration(s) have been applied" /tmp/migrate.log; then
    echo "[init] prisma migrate deploy succeeded or no migrations pending"
  else
    echo "[init] prisma migrate deploy failed or no migrations; attempting prisma db push"
    npx prisma db push --schema=../prisma/schema.prisma --accept-data-loss --skip-generate || echo "[init] WARNING: prisma db push failed; continuing startup"
  fi
  
  # Regenerate Prisma client - now without custom output path it will go to default location
  echo "[init] Regenerating Prisma client..."
  npx prisma generate --schema=../prisma/schema.prisma || echo "[init] WARNING: prisma generate failed"
  
  echo "[init] Prisma client locations:"
  ls -la node_modules/.prisma/client 2>&1 | head -5 || echo "  Not at node_modules/.prisma/client"
  ls -la ../node_modules/.prisma/client 2>&1 | head -5 || echo "  Not at ../node_modules/.prisma/client"
  
  # Run seed as a separate process BEFORE starting the main server
  if [ "${ADMIN_SEED_ENABLED}" = "true" ]; then
    echo "[init] Running seed..."
    node -e "
      const { PrismaClient } = require('@prisma/client');
      const crypto = require('crypto');
      const prisma = new PrismaClient();
      const tenantSlug = process.env.DEMO_TENANT_SLUG || (process.env.APP_ENV === 'demo' ? 'demo-operator' : 'preview-operator');
      
      (async () => {
        try {
          const existing = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });
          if (existing) {
            console.log('[seed] Tenant ' + tenantSlug + ' already exists, skipping');
            return;
          }
          
          console.log('[seed] Creating tenant ' + tenantSlug + '...');
          const tenant = await prisma.tenant.create({
            data: {
              id: crypto.randomUUID(),
              slug: tenantSlug,
              name: process.env.APP_ENV === 'demo' ? 'Demo Operator' : 'Preview Operator',
              status: 'active',
              sanityDataset: process.env.APP_ENV === 'demo' ? 'nimbus_demo' : 'nimbus_preview',
              region: 'US-MI',
              updatedAt: new Date()
            }
          });
          
          await prisma.store.createMany({
            data: [
              { id: crypto.randomUUID(), tenantId: tenant.id, slug: 'downtown-detroit', name: 'Downtown Detroit', timezone: 'America/Detroit', updatedAt: new Date() },
              { id: crypto.randomUUID(), tenantId: tenant.id, slug: 'eastside', name: 'Eastside', timezone: 'America/Detroit', updatedAt: new Date() }
            ]
          });
          
          await prisma.theme.create({
            data: {
              id: crypto.randomUUID(),
              tenantId: tenant.id,
              name: 'Default',
              isDefault: true,
              configJson: { palette: { primary: '#00A86B', secondary: '#FFC20A', background: '#FFFFFF' } },
              updatedAt: new Date()
            }
          });
          
          await prisma.featureFlag.createMany({
            data: [
              { id: crypto.randomUUID(), tenantId: tenant.id, key: 'ai_concierge', valueJson: { enabled: true }, updatedAt: new Date() },
              { id: crypto.randomUUID(), tenantId: tenant.id, key: 'journal_enabled', valueJson: { enabled: true }, updatedAt: new Date() }
            ]
          });
          
          console.log('[seed] Successfully seeded tenant ' + tenantSlug);
        } catch (e) {
          console.error('[seed] Error:', e.message);
        } finally {
          await prisma.\$disconnect();
        }
      })();
    " || echo "[init] WARNING: seed failed"
  fi
else
  echo "[init] npx not found; skipping migrations"
fi

echo "[init] Starting server"
exec node dist/index.js
