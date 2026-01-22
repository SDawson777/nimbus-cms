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
    echo "[init] Running comprehensive seed..."
    node -e "
      const { PrismaClient } = require('@prisma/client');
      const crypto = require('crypto');
      const bcrypt = require('bcryptjs');
      const prisma = new PrismaClient();
      const tenantSlug = process.env.DEMO_TENANT_SLUG || (process.env.APP_ENV === 'demo' ? 'demo-operator' : 'preview-operator');
      
      (async () => {
        try {
          const existing = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });
          if (existing) {
            console.log('[seed] Tenant ' + tenantSlug + ' already exists, skipping');
            return;
          }
          
          console.log('[seed] Creating comprehensive demo data for ' + tenantSlug + '...');
          
          // Create tenant
          const tenant = await prisma.tenant.create({
            data: {
              id: crypto.randomUUID(),
              slug: tenantSlug,
              name: 'Nimbus Demo Dispensary',
              status: 'active',
              sanityDataset: 'nimbus_demo',
              region: 'US-MI',
              updatedAt: new Date()
            }
          });
          console.log('[seed] Created tenant: ' + tenant.name);
          
          // Create stores
          const downtown = await prisma.store.create({
            data: { id: crypto.randomUUID(), tenantId: tenant.id, slug: 'downtown-detroit', name: 'Downtown Detroit', timezone: 'America/Detroit', updatedAt: new Date() }
          });
          const eastside = await prisma.store.create({
            data: { id: crypto.randomUUID(), tenantId: tenant.id, slug: 'eastside', name: 'Eastside Location', timezone: 'America/Detroit', updatedAt: new Date() }
          });
          await prisma.store.create({
            data: { id: crypto.randomUUID(), tenantId: tenant.id, slug: 'ann-arbor', name: 'Ann Arbor', timezone: 'America/Detroit', updatedAt: new Date() }
          });
          console.log('[seed] Created 3 stores');
          
          // Create admin users
          const pwHash = await bcrypt.hash('Nimbus!Demo123', 10);
          await prisma.adminUser.createMany({
            data: [
              { id: crypto.randomUUID(), email: 'admin@nimbus.app', passwordHash: pwHash, role: 'OWNER', organizationSlug: tenantSlug, createdAt: new Date(), updatedAt: new Date() },
              { id: crypto.randomUUID(), email: 'manager@nimbus.app', passwordHash: pwHash, role: 'STORE_MANAGER', organizationSlug: tenantSlug, storeSlug: 'downtown-detroit', createdAt: new Date(), updatedAt: new Date() },
              { id: crypto.randomUUID(), email: 'editor@nimbus.app', passwordHash: pwHash, role: 'EDITOR', organizationSlug: tenantSlug, createdAt: new Date(), updatedAt: new Date() },
              { id: crypto.randomUUID(), email: 'viewer@nimbus.app', passwordHash: pwHash, role: 'VIEWER', organizationSlug: tenantSlug, createdAt: new Date(), updatedAt: new Date() }
            ]
          });
          console.log('[seed] Created 4 admin users');
          
          // Create products
          const products = await Promise.all([
            prisma.product.create({ data: { id: crypto.randomUUID(), storeId: downtown.id, name: 'Blue Dream', slug: 'blue-dream', description: 'Sativa-dominant hybrid with sweet berry flavors', brand: 'Cloud Nine', category: 'Flower', type: 'FLOWER', status: 'ACTIVE', strainType: 'Sativa', price: 45.00, defaultPrice: 45.00, thcPercent: 24.5, purchasesLast30d: 156, createdAt: new Date(), updatedAt: new Date() } }),
            prisma.product.create({ data: { id: crypto.randomUUID(), storeId: downtown.id, name: 'OG Kush', slug: 'og-kush', description: 'Classic indica with earthy pine undertones', brand: 'Heritage Farms', category: 'Flower', type: 'FLOWER', status: 'ACTIVE', strainType: 'Indica', price: 50.00, defaultPrice: 50.00, thcPercent: 26.0, purchasesLast30d: 203, createdAt: new Date(), updatedAt: new Date() } }),
            prisma.product.create({ data: { id: crypto.randomUUID(), storeId: downtown.id, name: 'Calm CBD Gummies', slug: 'calm-cbd-gummies', description: '25mg CBD per gummy', brand: 'Wellness Co', category: 'Edibles', type: 'EDIBLE', status: 'ACTIVE', strainType: 'None', price: 35.00, defaultPrice: 35.00, cbdPercent: 25.0, purchasesLast30d: 89, createdAt: new Date(), updatedAt: new Date() } }),
            prisma.product.create({ data: { id: crypto.randomUUID(), storeId: downtown.id, name: 'Hybrid Vape Cart', slug: 'hybrid-vape-cart', description: '1g cartridge with balanced hybrid blend', brand: 'Vapor Labs', category: 'Vape', type: 'VAPE', status: 'ACTIVE', strainType: 'Hybrid', price: 55.00, defaultPrice: 55.00, thcPercent: 85.0, purchasesLast30d: 178, createdAt: new Date(), updatedAt: new Date() } }),
            prisma.product.create({ data: { id: crypto.randomUUID(), storeId: downtown.id, name: 'Relief Topical Cream', slug: 'relief-topical-cream', description: 'THC/CBD infused cream for muscle relief', brand: 'Wellness Co', category: 'Topical', type: 'TOPICAL', status: 'ACTIVE', strainType: 'None', price: 40.00, defaultPrice: 40.00, thcPercent: 5.0, cbdPercent: 10.0, purchasesLast30d: 45, createdAt: new Date(), updatedAt: new Date() } })
          ]);
          console.log('[seed] Created ' + products.length + ' products');
          
          // Create customers
          const users = await Promise.all([
            prisma.user.create({ data: { id: crypto.randomUUID(), tenantId: tenant.id, storeId: downtown.id, email: 'john.doe@example.com', phone: '+1-313-555-0101', name: 'John Doe', role: 'CUSTOMER', isActive: true, ageVerified: true, state: 'MI', createdAt: new Date(), updatedAt: new Date() } }),
            prisma.user.create({ data: { id: crypto.randomUUID(), tenantId: tenant.id, storeId: downtown.id, email: 'jane.smith@example.com', phone: '+1-313-555-0102', name: 'Jane Smith', role: 'CUSTOMER', isActive: true, ageVerified: true, state: 'MI', createdAt: new Date(), updatedAt: new Date() } }),
            prisma.user.create({ data: { id: crypto.randomUUID(), tenantId: tenant.id, storeId: eastside.id, email: 'mike.johnson@example.com', phone: '+1-734-555-0103', name: 'Mike Johnson', role: 'CUSTOMER', isActive: true, ageVerified: true, state: 'MI', createdAt: new Date(), updatedAt: new Date() } })
          ]);
          console.log('[seed] Created ' + users.length + ' customers');
          
          // Create orders
          const orders = await Promise.all([
            prisma.order.create({ data: { id: crypto.randomUUID(), userId: users[0].id, storeId: downtown.id, status: 'COMPLETED', paymentMethod: 'card', contactName: 'John Doe', contactPhone: '+1-313-555-0101', subtotal: 95.00, tax: 5.70, total: 100.70, completedAt: new Date(), createdAt: new Date(), updatedAt: new Date() } }),
            prisma.order.create({ data: { id: crypto.randomUUID(), userId: users[1].id, storeId: downtown.id, status: 'READY', paymentMethod: 'pay_at_pickup', contactName: 'Jane Smith', subtotal: 145.00, tax: 8.70, discount: 10.00, total: 143.70, createdAt: new Date(), updatedAt: new Date() } }),
            prisma.order.create({ data: { id: crypto.randomUUID(), userId: users[2].id, storeId: eastside.id, status: 'CONFIRMED', paymentMethod: 'card', contactName: 'Mike Johnson', subtotal: 55.00, tax: 3.30, total: 58.30, createdAt: new Date(), updatedAt: new Date() } }),
            prisma.order.create({ data: { id: crypto.randomUUID(), userId: users[0].id, storeId: downtown.id, status: 'CREATED', paymentMethod: 'pay_at_pickup', contactName: 'John Doe', subtotal: 80.00, tax: 4.80, total: 84.80, createdAt: new Date(), updatedAt: new Date() } })
          ]);
          console.log('[seed] Created ' + orders.length + ' orders');
          
          // Create order items
          await prisma.orderItem.createMany({ data: [
            { id: crypto.randomUUID(), orderId: orders[0].id, productId: products[0].id, quantity: 1, unitPrice: 45.00, lineTotal: 45.00, createdAt: new Date(), updatedAt: new Date() },
            { id: crypto.randomUUID(), orderId: orders[0].id, productId: products[1].id, quantity: 1, unitPrice: 50.00, lineTotal: 50.00, createdAt: new Date(), updatedAt: new Date() },
            { id: crypto.randomUUID(), orderId: orders[1].id, productId: products[2].id, quantity: 2, unitPrice: 35.00, lineTotal: 70.00, createdAt: new Date(), updatedAt: new Date() },
            { id: crypto.randomUUID(), orderId: orders[2].id, productId: products[3].id, quantity: 1, unitPrice: 55.00, lineTotal: 55.00, createdAt: new Date(), updatedAt: new Date() },
            { id: crypto.randomUUID(), orderId: orders[3].id, productId: products[4].id, quantity: 2, unitPrice: 40.00, lineTotal: 80.00, createdAt: new Date(), updatedAt: new Date() }
          ]});
          console.log('[seed] Created order items');
          
          // Create theme
          await prisma.theme.create({
            data: {
              id: crypto.randomUUID(),
              tenantId: tenant.id,
              name: 'Nimbus Default',
              isDefault: true,
              configJson: { palette: { primary: '#00A86B', secondary: '#FFC20A', background: '#FFFFFF', surface: '#F5F5F5', textPrimary: '#111827' }, typography: { fontFamily: 'Inter, sans-serif' } },
              updatedAt: new Date()
            }
          });
          console.log('[seed] Created theme');
          
          // Create feature flags
          await prisma.featureFlag.createMany({ data: [
            { id: crypto.randomUUID(), tenantId: tenant.id, key: 'ai_concierge', valueJson: { enabled: true, model: 'gpt-4' }, updatedAt: new Date() },
            { id: crypto.randomUUID(), tenantId: tenant.id, key: 'journal_enabled', valueJson: { enabled: true }, updatedAt: new Date() },
            { id: crypto.randomUUID(), tenantId: tenant.id, key: 'loyalty_program', valueJson: { enabled: true, pointsPerDollar: 1 }, updatedAt: new Date() },
            { id: crypto.randomUUID(), tenantId: tenant.id, key: 'online_ordering', valueJson: { enabled: true, delivery: true, pickup: true }, updatedAt: new Date() },
            { id: crypto.randomUUID(), tenantId: tenant.id, key: 'push_notifications', valueJson: { enabled: true }, updatedAt: new Date() },
            { id: crypto.randomUUID(), tenantId: tenant.id, key: 'analytics_dashboard', valueJson: { enabled: true, heatmaps: true }, updatedAt: new Date() },
            { id: crypto.randomUUID(), tenantId: tenant.id, key: 'referral_program', valueJson: { enabled: true }, updatedAt: new Date() },
            { id: crypto.randomUUID(), tenantId: tenant.id, key: 'personalization', valueJson: { enabled: true }, updatedAt: new Date() },
            { id: crypto.randomUUID(), tenantId: tenant.id, key: 'compliance_automation', valueJson: { enabled: true }, updatedAt: new Date() },
            { id: crypto.randomUUID(), tenantId: tenant.id, key: 'multi_location', valueJson: { enabled: true, maxStores: 10 }, updatedAt: new Date() }
          ]});
          console.log('[seed] Created 10 feature flags');
          
          // Create API key
          await prisma.apiKey.create({
            data: { id: crypto.randomUUID(), tenantId: tenant.id, key: 'nimbus_demo_' + crypto.randomBytes(16).toString('hex'), label: 'Demo Integration Key', createdAt: new Date() }
          });
          console.log('[seed] Created API key');
          
          console.log('[seed] ✅ Successfully seeded comprehensive demo data');
          console.log('[seed] Summary: 1 tenant, 3 stores, 4 admins, ' + products.length + ' products, ' + users.length + ' customers, ' + orders.length + ' orders, 10 feature flags');
        } catch (e) {
          console.error('[seed] Error:', e.message);
          if (e.stack) console.error(e.stack);
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
