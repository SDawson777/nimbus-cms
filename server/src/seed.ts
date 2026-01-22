import crypto from "crypto";
import bcrypt from "bcryptjs";
import { ADMIN_SEED_ENABLED, APP_ENV, DEMO_TENANT_SLUG } from "./config/env";
import { getPrisma } from "./lib/prisma";

/**
 * Seeds comprehensive demo data to showcase all features of the Nimbus Suite.
 *
 * Creates:
 * - Tenant with multiple stores
 * - Admin users with different roles
 * - Products across categories
 * - Sample customers (users)
 * - Sample orders with different statuses
 * - Theme configuration
 * - Feature flags
 * - API keys
 */
export async function seedControlPlane() {
  console.log(`[seedControlPlane] Starting seed check: ADMIN_SEED_ENABLED=${ADMIN_SEED_ENABLED}, APP_ENV=${APP_ENV}`);
  if (!ADMIN_SEED_ENABLED) {
    console.log("[seedControlPlane] Seeding disabled, skipping");
    return;
  }
  
  const prisma = getPrisma();
  
  try {
    const tenantSlug =
      DEMO_TENANT_SLUG ||
      (APP_ENV === "demo" ? "demo-operator" : "preview-operator");
    console.log(`[seedControlPlane] Checking for existing tenant: ${tenantSlug}`);
    const existing = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
    });
    if (existing) {
      console.log(`[seedControlPlane] Tenant ${tenantSlug} already exists (likely seeded by init script)`);
      return;
    }
    console.log(`[seedControlPlane] Creating comprehensive demo data for ${tenantSlug}...`);

    // Create tenant
    const tenant = await prisma.tenant.create({
      data: {
        id: crypto.randomUUID(),
        slug: tenantSlug,
        name: APP_ENV === "demo" ? "Nimbus Demo Dispensary" : "Preview Operator",
        status: "active",
        sanityDataset: "nimbus_demo",
        region: "US-MI",
        updatedAt: new Date(),
      },
    });
    console.log(`[seedControlPlane] Created tenant: ${tenant.name}`);

    // Create stores
    const downtownStore = await prisma.store.create({
      data: {
        id: crypto.randomUUID(),
        tenantId: tenant.id,
        slug: "downtown-detroit",
        name: "Downtown Detroit",
        timezone: "America/Detroit",
        updatedAt: new Date(),
      },
    });
    const eastsideStore = await prisma.store.create({
      data: {
        id: crypto.randomUUID(),
        tenantId: tenant.id,
        slug: "eastside",
        name: "Eastside Location",
        timezone: "America/Detroit",
        updatedAt: new Date(),
      },
    });
    const annArborStore = await prisma.store.create({
      data: {
        id: crypto.randomUUID(),
        tenantId: tenant.id,
        slug: "ann-arbor",
        name: "Ann Arbor",
        timezone: "America/Detroit",
        updatedAt: new Date(),
      },
    });
    console.log(`[seedControlPlane] Created 3 stores`);

    // Create admin users with different roles
    const adminPasswordHash = await bcrypt.hash("Nimbus!Demo123", 10);
    await prisma.adminUser.createMany({
      data: [
        {
          id: crypto.randomUUID(),
          email: "admin@nimbus.app",
          passwordHash: adminPasswordHash,
          role: "OWNER",
          organizationSlug: tenantSlug,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: crypto.randomUUID(),
          email: "manager@nimbus.app",
          passwordHash: adminPasswordHash,
          role: "STORE_MANAGER",
          organizationSlug: tenantSlug,
          storeSlug: "downtown-detroit",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: crypto.randomUUID(),
          email: "editor@nimbus.app",
          passwordHash: adminPasswordHash,
          role: "EDITOR",
          organizationSlug: tenantSlug,
          storeSlug: "eastside",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: crypto.randomUUID(),
          email: "viewer@nimbus.app",
          passwordHash: adminPasswordHash,
          role: "VIEWER",
          organizationSlug: tenantSlug,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    });
    console.log(`[seedControlPlane] Created 4 admin users`);

    // Create sample products
    const products = await Promise.all([
      prisma.product.create({
        data: {
          id: crypto.randomUUID(),
          storeId: downtownStore.id,
          name: "Blue Dream",
          slug: "blue-dream",
          description: "A sativa-dominant hybrid with sweet berry flavors",
          brand: "Cloud Nine",
          category: "Flower",
          type: "FLOWER",
          status: "ACTIVE",
          strainType: "Sativa",
          terpenes: ["Myrcene", "Pinene", "Caryophyllene"],
          price: 45.00,
          defaultPrice: 45.00,
          thcPercent: 24.5,
          cbdPercent: 0.1,
          isActive: true,
          purchasesLast30d: 156,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      }),
      prisma.product.create({
        data: {
          id: crypto.randomUUID(),
          storeId: downtownStore.id,
          name: "OG Kush",
          slug: "og-kush",
          description: "Classic indica with earthy pine undertones",
          brand: "Heritage Farms",
          category: "Flower",
          type: "FLOWER",
          status: "ACTIVE",
          strainType: "Indica",
          terpenes: ["Limonene", "Myrcene", "Linalool"],
          price: 50.00,
          defaultPrice: 50.00,
          thcPercent: 26.0,
          cbdPercent: 0.2,
          isActive: true,
          purchasesLast30d: 203,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      }),
      prisma.product.create({
        data: {
          id: crypto.randomUUID(),
          storeId: downtownStore.id,
          name: "Calm CBD Gummies",
          slug: "calm-cbd-gummies",
          description: "25mg CBD per gummy, mixed fruit flavors",
          brand: "Wellness Co",
          category: "Edibles",
          type: "EDIBLE",
          status: "ACTIVE",
          strainType: "None",
          price: 35.00,
          defaultPrice: 35.00,
          thcPercent: 0.0,
          cbdPercent: 25.0,
          cbdMgPerUnit: 25.0,
          isActive: true,
          purchasesLast30d: 89,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      }),
      prisma.product.create({
        data: {
          id: crypto.randomUUID(),
          storeId: downtownStore.id,
          name: "Hybrid Vape Cart",
          slug: "hybrid-vape-cart",
          description: "1g cartridge with balanced hybrid blend",
          brand: "Vapor Labs",
          category: "Vape",
          type: "VAPE",
          status: "ACTIVE",
          strainType: "Hybrid",
          price: 55.00,
          defaultPrice: 55.00,
          thcPercent: 85.0,
          isActive: true,
          purchasesLast30d: 178,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      }),
      prisma.product.create({
        data: {
          id: crypto.randomUUID(),
          storeId: downtownStore.id,
          name: "Relief Topical Cream",
          slug: "relief-topical-cream",
          description: "THC/CBD infused cream for muscle relief",
          brand: "Wellness Co",
          category: "Topical",
          type: "TOPICAL",
          status: "ACTIVE",
          strainType: "None",
          price: 40.00,
          defaultPrice: 40.00,
          thcPercent: 5.0,
          cbdPercent: 10.0,
          isActive: true,
          purchasesLast30d: 45,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      }),
    ]);
    console.log(`[seedControlPlane] Created ${products.length} products`);

    // Create sample users (customers)
    const users = await Promise.all([
      prisma.user.create({
        data: {
          id: crypto.randomUUID(),
          tenantId: tenant.id,
          storeId: downtownStore.id,
          email: "john.doe@example.com",
          phone: "+1-313-555-0101",
          name: "John Doe",
          role: "CUSTOMER",
          isActive: true,
          ageVerified: true,
          state: "MI",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      }),
      prisma.user.create({
        data: {
          id: crypto.randomUUID(),
          tenantId: tenant.id,
          storeId: downtownStore.id,
          email: "jane.smith@example.com",
          phone: "+1-313-555-0102",
          name: "Jane Smith",
          role: "CUSTOMER",
          isActive: true,
          ageVerified: true,
          state: "MI",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      }),
      prisma.user.create({
        data: {
          id: crypto.randomUUID(),
          tenantId: tenant.id,
          storeId: eastsideStore.id,
          email: "mike.johnson@example.com",
          phone: "+1-734-555-0103",
          name: "Mike Johnson",
          role: "CUSTOMER",
          isActive: true,
          ageVerified: true,
          state: "MI",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      }),
      // Demo user for quiz testing
      prisma.user.create({
        data: {
          id: "demo-quiz-user",
          tenantId: tenant.id,
          storeId: downtownStore.id,
          email: "quiz-demo@nimbus.app",
          phone: "+1-313-555-0199",
          name: "Quiz Demo User",
          role: "CUSTOMER",
          isActive: true,
          ageVerified: true,
          state: "MI",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      }),
    ]);
    console.log(`[seedControlPlane] Created ${users.length} customers`);

    // Create sample orders with different statuses
    const now = new Date();
    const orders = await Promise.all([
      prisma.order.create({
        data: {
          id: crypto.randomUUID(),
          userId: users[0].id,
          storeId: downtownStore.id,
          status: "COMPLETED",
          paymentMethod: "card",
          contactName: "John Doe",
          contactPhone: "+1-313-555-0101",
          contactEmail: "john.doe@example.com",
          subtotal: 95.00,
          tax: 5.70,
          discount: 0,
          total: 100.70,
          completedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
          createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(),
        },
      }),
      prisma.order.create({
        data: {
          id: crypto.randomUUID(),
          userId: users[1].id,
          storeId: downtownStore.id,
          status: "READY",
          paymentMethod: "pay_at_pickup",
          contactName: "Jane Smith",
          contactPhone: "+1-313-555-0102",
          contactEmail: "jane.smith@example.com",
          subtotal: 145.00,
          tax: 8.70,
          discount: 10.00,
          total: 143.70,
          createdAt: new Date(now.getTime() - 1 * 60 * 60 * 1000),
          updatedAt: new Date(),
        },
      }),
      prisma.order.create({
        data: {
          id: crypto.randomUUID(),
          userId: users[2].id,
          storeId: eastsideStore.id,
          status: "CONFIRMED",
          paymentMethod: "card",
          contactName: "Mike Johnson",
          contactPhone: "+1-734-555-0103",
          contactEmail: "mike.johnson@example.com",
          subtotal: 55.00,
          tax: 3.30,
          discount: 0,
          total: 58.30,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      }),
      prisma.order.create({
        data: {
          id: crypto.randomUUID(),
          userId: users[0].id,
          storeId: downtownStore.id,
          status: "CREATED",
          paymentMethod: "pay_at_pickup",
          contactName: "John Doe",
          contactPhone: "+1-313-555-0101",
          subtotal: 80.00,
          tax: 4.80,
          total: 84.80,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      }),
    ]);
    console.log(`[seedControlPlane] Created ${orders.length} orders`);

    // Create order items
    await prisma.orderItem.createMany({
      data: [
        { id: crypto.randomUUID(), orderId: orders[0].id, productId: products[0].id, quantity: 1, unitPrice: 45.00, lineTotal: 45.00, createdAt: new Date(), updatedAt: new Date() },
        { id: crypto.randomUUID(), orderId: orders[0].id, productId: products[1].id, quantity: 1, unitPrice: 50.00, lineTotal: 50.00, createdAt: new Date(), updatedAt: new Date() },
        { id: crypto.randomUUID(), orderId: orders[1].id, productId: products[2].id, quantity: 2, unitPrice: 35.00, lineTotal: 70.00, createdAt: new Date(), updatedAt: new Date() },
        { id: crypto.randomUUID(), orderId: orders[1].id, productId: products[3].id, quantity: 1, unitPrice: 55.00, lineTotal: 55.00, createdAt: new Date(), updatedAt: new Date() },
        { id: crypto.randomUUID(), orderId: orders[2].id, productId: products[3].id, quantity: 1, unitPrice: 55.00, lineTotal: 55.00, createdAt: new Date(), updatedAt: new Date() },
        { id: crypto.randomUUID(), orderId: orders[3].id, productId: products[4].id, quantity: 2, unitPrice: 40.00, lineTotal: 80.00, createdAt: new Date(), updatedAt: new Date() },
      ],
    });
    console.log(`[seedControlPlane] Created order items`);

    // Create theme with comprehensive configuration
    await prisma.theme.create({
      data: {
        id: crypto.randomUUID(),
        tenantId: tenant.id,
        name: "Nimbus Default",
        isDefault: true,
        configJson: {
          palette: {
            primary: "#00A86B",
            secondary: "#FFC20A",
            background: "#FFFFFF",
            surface: "#F5F5F5",
            error: "#DC2626",
            success: "#059669",
            warning: "#D97706",
            info: "#2563EB",
            textPrimary: "#111827",
            textSecondary: "#6B7280",
          },
          typography: {
            fontFamily: "Inter, system-ui, sans-serif",
            headingFontFamily: "Poppins, Inter, sans-serif",
          },
          borderRadius: {
            sm: "4px",
            md: "8px",
            lg: "12px",
            xl: "16px",
          },
          logo: {
            url: "https://via.placeholder.com/200x60?text=Nimbus+Demo",
            width: 200,
            height: 60,
          },
        },
        updatedAt: new Date(),
      },
    });
    console.log(`[seedControlPlane] Created theme configuration`);

    // Create comprehensive feature flags
    await prisma.featureFlag.createMany({
      data: [
        { id: crypto.randomUUID(), tenantId: tenant.id, key: "ai_concierge", valueJson: { enabled: true, model: "gpt-4", maxTokens: 2048 }, updatedAt: new Date() },
        { id: crypto.randomUUID(), tenantId: tenant.id, key: "journal_enabled", valueJson: { enabled: true }, updatedAt: new Date() },
        { id: crypto.randomUUID(), tenantId: tenant.id, key: "loyalty_program", valueJson: { enabled: true, pointsPerDollar: 1, redeemRatio: 100 }, updatedAt: new Date() },
        { id: crypto.randomUUID(), tenantId: tenant.id, key: "online_ordering", valueJson: { enabled: true, delivery: true, pickup: true }, updatedAt: new Date() },
        { id: crypto.randomUUID(), tenantId: tenant.id, key: "push_notifications", valueJson: { enabled: true, marketing: true, orderUpdates: true }, updatedAt: new Date() },
        { id: crypto.randomUUID(), tenantId: tenant.id, key: "analytics_dashboard", valueJson: { enabled: true, heatmaps: true, realtime: true }, updatedAt: new Date() },
        { id: crypto.randomUUID(), tenantId: tenant.id, key: "referral_program", valueJson: { enabled: true, referrerBonus: 10, refereeBonus: 5 }, updatedAt: new Date() },
        { id: crypto.randomUUID(), tenantId: tenant.id, key: "personalization", valueJson: { enabled: true, recommendations: true, dynamicContent: true }, updatedAt: new Date() },
        { id: crypto.randomUUID(), tenantId: tenant.id, key: "compliance_automation", valueJson: { enabled: true, ageVerification: true, purchaseLimits: true }, updatedAt: new Date() },
        { id: crypto.randomUUID(), tenantId: tenant.id, key: "multi_location", valueJson: { enabled: true, maxStores: 10 }, updatedAt: new Date() },
      ],
    });
    console.log(`[seedControlPlane] Created 10 feature flags`);

    // Create API key for integrations
    await prisma.apiKey.create({
      data: {
        id: crypto.randomUUID(),
        tenantId: tenant.id,
        key: `nimbus_demo_${crypto.randomBytes(16).toString("hex")}`,
        label: "Demo Integration Key",
        createdAt: new Date(),
      },
    });
    console.log(`[seedControlPlane] Created API key`);

    // Create loyalty status for demo users (required for quiz rewards)
    await Promise.all(
      users.map((user, idx) =>
        prisma.loyaltyStatus.create({
          data: {
            id: crypto.randomUUID(),
            userId: user.id,
            storeId: user.storeId!,
            status: "active",
            tier: idx === 0 ? "gold" : "silver",
            points: idx === 0 ? 500 : 100,
            lifetimePoints: idx === 0 ? 1500 : 300,
            updatedAt: new Date(),
          },
        })
      )
    );
    console.log(`[seedControlPlane] Created loyalty status for ${users.length} users`);

    // Create audit log entries
    await prisma.auditLog.createMany({
      data: [
        { id: crypto.randomUUID(), tenantId: tenant.id, actorId: null, action: "TENANT_CREATED", details: { name: tenant.name }, createdAt: new Date() },
        { id: crypto.randomUUID(), tenantId: tenant.id, actorId: null, action: "SEED_COMPLETED", details: { products: products.length, users: users.length, orders: orders.length }, createdAt: new Date() },
      ],
    });
    console.log(`[seedControlPlane] Created audit log entries`);

    console.log(`[seedControlPlane] ✅ Successfully seeded comprehensive demo data for ${tenantSlug}`);
    console.log(`[seedControlPlane] Summary:`);
    console.log(`  - 1 Tenant: ${tenant.name}`);
    console.log(`  - 3 Stores: Downtown Detroit, Eastside, Ann Arbor`);
    console.log(`  - 4 Admin Users (OWNER, STORE_MANAGER, EDITOR, VIEWER)`);
    console.log(`  - ${products.length} Products across categories`);
    console.log(`  - ${users.length} Customers`);
    console.log(`  - ${orders.length} Orders with various statuses`);
    console.log(`  - 10 Feature Flags`);
    console.log(`  - API key for integrations`);
  } catch (err) {
    console.error("[seedControlPlane] Error during seeding:", err);
    throw err;
  }
}
