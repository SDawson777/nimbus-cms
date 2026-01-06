import { PrismaClient, ProductStatus, ProductType, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function requiredEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing ${name}`);
  return v;
}

function pickEnv(...names: string[]) {
  for (const n of names) {
    const v = process.env[n];
    if (v) return v;
  }
  return undefined;
}

function boolEnv(name: string, defaultValue: boolean) {
  const v = process.env[name];
  if (!v) return defaultValue;
  return v === "true" || v === "1";
}

export async function seedDemoDatabase() {
  const allowInsecure = boolEnv("ALLOW_INSECURE_DEMO_PASSWORDS", false);

  const demoTenantSlug = pickEnv("DEMO_TENANT_SLUG") || "demo-operator";
  const demoSanityDataset = pickEnv("DEMO_SANITY_DATASET", "SANITY_DATASET_DEFAULT") || "nimbus_demo";

  const adminEmail = pickEnv("DEMO_ADMIN_EMAIL") || "demo.admin@nimbus.local";
  const customerEmail = pickEnv("DEMO_CUSTOMER_EMAIL") || "demo.customer@nimbus.local";

  const adminPassword =
    pickEnv("DEMO_ADMIN_PASSWORD") ||
    (allowInsecure ? "demo-admin-change-me" : undefined);
  const customerPassword =
    pickEnv("DEMO_CUSTOMER_PASSWORD") ||
    (allowInsecure ? "demo-customer-change-me" : undefined);

  if (!adminPassword) {
    throw new Error(
      "Missing DEMO_ADMIN_PASSWORD (or set ALLOW_INSECURE_DEMO_PASSWORDS=true for local-only demo passwords)",
    );
  }
  if (!customerPassword) {
    throw new Error(
      "Missing DEMO_CUSTOMER_PASSWORD (or set ALLOW_INSECURE_DEMO_PASSWORDS=true for local-only demo passwords)",
    );
  }

  // Ensure required app envs are present early (so failures are obvious)
  requiredEnv("DATABASE_URL");

  const tenant = await prisma.tenant.upsert({
    where: { slug: demoTenantSlug },
    update: {
      name: "Demo Operator",
      status: "active",
      sanityDataset: demoSanityDataset,
      primaryDomain: pickEnv("DEMO_PRIMARY_DOMAIN") || "demo.nimbus.app",
      region: pickEnv("DEMO_REGION") || "US-MI",
    },
    create: {
      slug: demoTenantSlug,
      name: "Demo Operator",
      status: "active",
      sanityDataset: demoSanityDataset,
      primaryDomain: pickEnv("DEMO_PRIMARY_DOMAIN") || "demo.nimbus.app",
      region: pickEnv("DEMO_REGION") || "US-MI",
    },
  });

  const store1 = await prisma.store.upsert({
    where: { tenantId_slug: { tenantId: tenant.id, slug: "downtown-detroit" } },
    update: {
      name: "Downtown Detroit",
      address1: "123 Demo Ave",
      city: "Detroit",
      state: "MI",
      postalCode: "48201",
      country: "US",
      phone: "+1-555-0100",
      timezone: "America/Detroit",
      isPickupEnabled: true,
      isDeliveryEnabled: false,
    },
    create: {
      tenantId: tenant.id,
      slug: "downtown-detroit",
      name: "Downtown Detroit",
      address1: "123 Demo Ave",
      city: "Detroit",
      state: "MI",
      postalCode: "48201",
      country: "US",
      phone: "+1-555-0100",
      timezone: "America/Detroit",
      isPickupEnabled: true,
      isDeliveryEnabled: false,
    },
  });

  const store2 = await prisma.store.upsert({
    where: { tenantId_slug: { tenantId: tenant.id, slug: "eastside" } },
    update: {
      name: "Eastside",
      address1: "456 Demo Blvd",
      city: "Detroit",
      state: "MI",
      postalCode: "48202",
      country: "US",
      phone: "+1-555-0101",
      timezone: "America/Detroit",
      isPickupEnabled: true,
      isDeliveryEnabled: true,
    },
    create: {
      tenantId: tenant.id,
      slug: "eastside",
      name: "Eastside",
      address1: "456 Demo Blvd",
      city: "Detroit",
      state: "MI",
      postalCode: "48202",
      country: "US",
      phone: "+1-555-0101",
      timezone: "America/Detroit",
      isPickupEnabled: true,
      isDeliveryEnabled: true,
    },
  });

  // Default tenant theme
  const existingDefaultTheme = await prisma.theme.findFirst({
    where: { tenantId: tenant.id, isDefault: true },
  });
  if (existingDefaultTheme) {
    await prisma.theme.update({
      where: { id: existingDefaultTheme.id },
      data: {
        name: "Nimbus Demo",
        configJson: {
          palette: {
            primary: "#00A86B",
            secondary: "#FFC20A",
            background: "#FFFFFF",
            accent: "#3F7AFC",
          },
        },
      },
    });
  } else {
    await prisma.theme.create({
      data: {
        tenantId: tenant.id,
        name: "Nimbus Demo",
        isDefault: true,
        configJson: {
          palette: {
            primary: "#00A86B",
            secondary: "#FFC20A",
            background: "#FFFFFF",
            accent: "#3F7AFC",
          },
        },
      },
    });
  }

  // Admin user (Admin SPA)
  await prisma.adminUser.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash: await bcrypt.hash(adminPassword, 10),
      role: "OWNER",
    },
    create: {
      email: adminEmail,
      passwordHash: await bcrypt.hash(adminPassword, 10),
      role: "OWNER",
    },
  });

  // Consumer users (Mobile)
  const customer = await prisma.user.upsert({
    where: { email: customerEmail },
    update: {
      tenantId: tenant.id,
      storeId: store1.id,
      name: "Demo Customer",
      role: UserRole.CUSTOMER,
      passwordHash: await bcrypt.hash(customerPassword, 10),
      isActive: true,
    },
    create: {
      tenantId: tenant.id,
      storeId: store1.id,
      email: customerEmail,
      name: "Demo Customer",
      role: UserRole.CUSTOMER,
      passwordHash: await bcrypt.hash(customerPassword, 10),
      isActive: true,
    },
  });

  await prisma.user.upsert({
    where: { email: "demo.staff@nimbus.local" },
    update: {
      tenantId: tenant.id,
      storeId: store1.id,
      name: "Demo Staff",
      role: UserRole.STAFF,
      isActive: true,
    },
    create: {
      tenantId: tenant.id,
      storeId: store1.id,
      email: "demo.staff@nimbus.local",
      name: "Demo Staff",
      role: UserRole.STAFF,
      isActive: true,
    },
  });

  // Products + variants
  const demoProducts = [
    {
      slug: "demo-nimbus-og",
      name: "Nimbus OG",
      type: ProductType.FLOWER,
      category: "Flower",
      brand: "Nimbus",
      price: 35,
      variants: [
        { sku: "DD-NIMBUSOG-1G", name: "1g", price: 12, stock: 200 },
        { sku: "DD-NIMBUSOG-3_5G", name: "3.5g", price: 35, stock: 120 },
      ],
    },
    {
      slug: "demo-midnight-mints",
      name: "Midnight Mints Gummies",
      type: ProductType.EDIBLE,
      category: "Edibles",
      brand: "Nimbus",
      price: 18,
      variants: [{ sku: "DD-MINTS-10PK", name: "10 pack", price: 18, stock: 80 }],
    },
    {
      slug: "demo-sunrise-preroll",
      name: "Sunrise Sativa Pre-Roll",
      type: ProductType.FLOWER,
      category: "Pre-roll",
      brand: "Nimbus",
      price: 12,
      variants: [{ sku: "DD-SUNRISE-PR-1G", name: "1g", price: 12, stock: 60 }],
    },
    {
      slug: "demo-live-resin-cart",
      name: "Limonene Live Resin Cart",
      type: ProductType.VAPE,
      category: "Vapes",
      brand: "Nimbus",
      price: 55,
      variants: [{ sku: "DD-LIVE-RESIN-1G", name: "1g", price: 55, stock: 40 }],
    },
    {
      slug: "demo-cbd-tincture",
      name: "Calm CBD Tincture",
      type: ProductType.TOPICAL,
      category: "Wellness",
      brand: "Nimbus",
      price: 45,
      variants: [{ sku: "DD-CBD-30ML", name: "30ml", price: 45, stock: 50 }],
    },
  ];

  for (const p of demoProducts) {
    const product = await prisma.product.upsert({
      where: { slug: `${store1.slug}-${p.slug}` },
      update: {
        storeId: store1.id,
        name: p.name,
        brand: p.brand,
        category: p.category,
        type: p.type,
        status: ProductStatus.ACTIVE,
        price: p.price,
        description:
          "Seeded demo product for Nimbus canonical demo environment.",
        isActive: true,
      },
      create: {
        storeId: store1.id,
        slug: `${store1.slug}-${p.slug}`,
        name: p.name,
        brand: p.brand,
        category: p.category,
        type: p.type,
        status: ProductStatus.ACTIVE,
        price: p.price,
        description:
          "Seeded demo product for Nimbus canonical demo environment.",
        isActive: true,
      },
    });

    for (const v of p.variants) {
      await prisma.productVariant.upsert({
        where: { sku: v.sku },
        update: {
          productId: product.id,
          name: v.name,
          price: v.price,
          stock: v.stock,
        },
        create: {
          productId: product.id,
          sku: v.sku,
          name: v.name,
          price: v.price,
          stock: v.stock,
        },
      });
    }
  }

  // Demo order with sample items
  const firstProduct = await prisma.product.findFirst({
    where: { storeId: store1.id },
    orderBy: { createdAt: "asc" },
  });
  if (firstProduct) {
    const variant = await prisma.productVariant.findFirst({
      where: { productId: firstProduct.id },
      orderBy: { createdAt: "asc" },
    });

    const orderId = "order-demo-0001";
    await prisma.order.upsert({
      where: { id: orderId },
      update: {
        userId: customer.id,
        storeId: store1.id,
        status: "FULFILLED",
        total: firstProduct.price,
      },
      create: {
        id: orderId,
        userId: customer.id,
        storeId: store1.id,
        status: "FULFILLED",
        total: firstProduct.price,
        items: {
          create: [
            {
              productId: firstProduct.id,
              variantId: variant?.id,
              quantity: 1,
              price: firstProduct.price,
            },
          ],
        },
      },
    });
  }

  // Loyalty
  await prisma.loyaltyStatus.upsert({
    where: { userId: customer.id },
    update: { storeId: store1.id, status: "Gold", points: 420 },
    create: {
      userId: customer.id,
      storeId: store1.id,
      status: "Gold",
      points: 420,
    },
  });

  await prisma.loyaltyBadge.upsert({
    where: { id: "badge-demo-early-adopter" },
    update: { userId: customer.id, storeId: store1.id, name: "Early Adopter" },
    create: {
      id: "badge-demo-early-adopter",
      userId: customer.id,
      storeId: store1.id,
      name: "Early Adopter",
    },
  });

  // eslint-disable-next-line no-console
  console.log("✔ Demo DB seeded", {
    tenant: tenant.slug,
    sanityDataset: demoSanityDataset,
    stores: [store1.slug, store2.slug],
    adminEmail,
    customerEmail,
  });
}

async function main() {
  await seedDemoDatabase();
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
    inventoryCombos.map((combo) =>
      prisma.storeProduct.upsert({
        where: { id: `${combo.store.id}-${combo.productId}` },
        update: { inventory: combo.inventory, price: combo.price },
        create: {
          id: `${combo.store.id}-${combo.productId}`,
          storeId: combo.store.id,
          productId: combo.productId,
          inventory: combo.inventory,
          price: combo.price,
        },
      }),
    ),
  );

  // ---------- USERS ----------
  const demoUser = await prisma.user.upsert({
    where: { email: "demo.user@nimbus.app" },
    update: {},
    create: {
      tenantId: demoTenant.id,
      email: "demo.user@nimbus.app",
      name: "Demo User",
    },
  });

  const powerUser = await prisma.user.upsert({
    where: { email: "power.user@nimbus.app" },
    update: {},
    create: {
      tenantId: demoTenant.id,
      email: "power.user@nimbus.app",
      name: "Power Shopper",
    },
  });

  // ---------- USER PREFERENCES ----------
  await prisma.userPreference.upsert({
    where: { userId: demoUser.id },
    update: {},
    create: {
      userId: demoUser.id,
      theme: "dark",
      notifications: {
        smsDeals: true,
        emailDeals: true,
        lowInventoryAlerts: true,
      },
      favorites: {
        strains: ["Nimbus OG (1/8 oz)", "Midnight Mints 5mg"],
        effects: ["relaxed", "sleep"],
      },
    },
  });

  await prisma.userPreference.upsert({
    where: { userId: powerUser.id },
    update: {},
    create: {
      userId: powerUser.id,
      theme: "system",
      notifications: {
        smsDeals: true,
        emailDeals: false,
        highValueDealsOnly: true,
      },
      favorites: {
        strains: ["Limonene Live Resin Cart", "Sunrise Sativa (1g preroll)"],
        effects: ["creative", "euphoric"],
      },
    },
  });

  // ---------- ORDERS ----------
  async function createOrder(
    userId: string,
    tenantId: string,
    items: { productId: string; qty: number }[],
  ) {
    const products = await prisma.product.findMany({
      where: { id: { in: items.map((i) => i.productId) } },
    });
    let total = 0;
    for (const item of items) {
      const p = products.find((pp) => pp.id === item.productId);
      if (!p) continue;
      total += p.price * item.qty;
    }

    return prisma.order.create({
      data: {
        userId,
        tenantId,
        total,
        status: "completed",
        items: {
          create: items.map((item) => ({
            productId: item.productId,
            quantity: item.qty,
            price: products.find((p) => p.id === item.productId)?.price ?? 0,
          })),
        },
      },
    });
  }

  await createOrder(demoUser.id, demoTenant.id, [
    { productId: "prod-nimbus-og-35", qty: 2 },
    { productId: "prod-midnight-mints", qty: 1 },
  ]);

  await createOrder(powerUser.id, demoTenant.id, [
    { productId: "prod-limonene-live-resin", qty: 1 },
    { productId: "prod-glass-510-battery", qty: 1 },
    { productId: "prod-cold-brew-10mg", qty: 2 },
  ]);

  // ---------- LEGAL DOCS ----------
  await prisma.legalDocument.upsert({
    where: { id: "demo-terms-v1" },
    update: {},
    create: {
      id: "demo-terms-v1",
      tenantId: demoTenant.id,
      type: "terms",
      version: "1.0",
      body: "# Terms of Service (Demo)\n\nThis is demo legal content for Nimbus Cannabis Suite. In production, your legal counsel will provide jurisdiction-specific terms.",
    },
  });

  await prisma.legalDocument.upsert({
    where: { id: "demo-privacy-v1" },
    update: {},
    create: {
      id: "demo-privacy-v1",
      tenantId: demoTenant.id,
      type: "privacy",
      version: "1.0",
      body: "# Privacy Policy (Demo)\n\nThis demo describes how Nimbus handles customer data for the purposes of evaluation. In production, this will match your live policy.",
    },
  });

  await prisma.legalDocument.upsert({
    where: { id: "demo-accessibility-v1" },
    update: {},
    create: {
      id: "demo-accessibility-v1",
      tenantId: demoTenant.id,
      type: "accessibility",
      version: "1.0",
      body: "# Accessibility Statement (Demo)\n\nNimbus is committed to accessibility and inclusive design. This demo statement shows the structure buyers expect.",
    },
  });

  // ---------- AWARDS ----------
  await prisma.award.upsert({
    where: { id: "award-bronze" },
    update: {},
    create: {
      id: "award-bronze",
      tenantId: demoTenant.id,
      title: "Bronze Tier",
      points: 500,
      media: { icon: "🥉", description: "Entry-level loyalty tier." },
    },
  });

  await prisma.award.upsert({
    where: { id: "award-silver" },
    update: {},
    create: {
      id: "award-silver",
      tenantId: demoTenant.id,
      title: "Silver Tier",
      points: 1500,
      media: { icon: "🥈", description: "Mid-tier with stronger discounts." },
    },
  });

  await prisma.award.upsert({
    where: { id: "award-gold" },
    update: {},
    create: {
      id: "award-gold",
      tenantId: demoTenant.id,
      title: "Gold Tier",
      points: 3500,
      media: { icon: "🥇", description: "High-value VIP tier for whales." },
    },
  });

  // ---------- JOURNAL + EVENTS (for AI / analytics demo) ----------
  await prisma.journalEntry.createMany({
    data: [
      {
        userId: demoUser.id,
        mood: "relaxed",
        notes:
          "Nimbus OG helped me wind down after work without being couch-locked.",
      },
      {
        userId: demoUser.id,
        mood: "sleepy",
        notes: "Midnight Mints kicked in after ~45 minutes. Great for sleep.",
      },
      {
        userId: powerUser.id,
        mood: "creative",
        notes: "Sunrise Sativa is perfect for morning deep work.",
      },
    ],
  });

  await prisma.userEvent.createMany({
    data: [
      {
        userId: demoUser.id,
        type: "VIEW_PRODUCT",
        meta: { productId: "prod-nimbus-og-35" },
      },
      {
        userId: demoUser.id,
        type: "ADD_TO_CART",
        meta: { productId: "prod-nimbus-og-35" },
      },
      {
        userId: powerUser.id,
        type: "VIEW_PRODUCT",
        meta: { productId: "prod-limonene-live-resin" },
      },
      {
        userId: powerUser.id,
        type: "COMPLETE_ORDER",
        meta: { orderValue: 130 },
      },
    ],
  });

  console.log("✔ Nimbus demo seed completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
