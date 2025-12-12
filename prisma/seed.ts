import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Nimbus demo data...");

  // ---------- TENANTS ----------
  const demoTenant = await prisma.tenant.upsert({
    where: { slug: "demo-operator" },
    update: {},
    create: {
      slug: "demo-operator",
      name: "Demo Operator",
      region: "MI",
      sanityDataset: "demo-operator",
      primaryDomain: "demo.nimbus.app",
    },
  });

  const globalTenant = await prisma.tenant.upsert({
    where: { slug: "global-corp" },
    update: {},
    create: {
      slug: "global-corp",
      name: "Global Cannabis Corp",
      region: "US",
      sanityDataset: "global",
      primaryDomain: "global.nimbus.app",
    },
  });

  const labsTenant = await prisma.tenant.upsert({
    where: { slug: "nimbus-labs" },
    update: {},
    create: {
      slug: "nimbus-labs",
      name: "Nimbus Labs",
      region: "US",
      sanityDataset: "labs",
      primaryDomain: "labs.nimbus.app",
    },
  });

  // ---------- STORES ----------
  const stores = await prisma.$transaction([
    prisma.store.upsert({
      where: { id: "store-detroit-8mile" },
      update: {},
      create: {
        id: "store-detroit-8mile",
        tenantId: demoTenant.id,
        name: "Detroit — 8 Mile",
        address: "12345 8 Mile Rd",
        city: "Detroit",
        state: "MI",
        zip: "48201",
        latitude: 42.4098,
        longitude: -83.0585,
      },
    }),
    prisma.store.upsert({
      where: { id: "store-scottsdale-north" },
      update: {},
      create: {
        id: "store-scottsdale-north",
        tenantId: demoTenant.id,
        name: "Scottsdale — North",
        address: "777 Desert View",
        city: "Scottsdale",
        state: "AZ",
        zip: "85255",
        latitude: 33.7189,
        longitude: -111.953,
      },
    }),
    prisma.store.upsert({
      where: { id: "store-boulder-pearl" },
      update: {},
      create: {
        id: "store-boulder-pearl",
        tenantId: globalTenant.id,
        name: "Boulder — Pearl",
        address: "1500 Pearl St",
        city: "Boulder",
        state: "CO",
        zip: "80302",
        latitude: 40.0185,
        longitude: -105.278,
      },
    }),
    prisma.store.upsert({
      where: { id: "store-la-melrose" },
      update: {},
      create: {
        id: "store-la-melrose",
        tenantId: labsTenant.id,
        name: "Los Angeles — Melrose",
        address: "8200 Melrose Ave",
        city: "Los Angeles",
        state: "CA",
        zip: "90046",
        latitude: 34.0837,
        longitude: -118.3617,
      },
    }),
  ]);

  const [detroit, scottsdale, boulder, la] = stores;

  // ---------- PRODUCTS ----------
  type SeedProduct = {
    id: string;
    name: string;
    category: string;
    subcategory?: string;
    thcPercent?: number;
    cbdPercent?: number;
    price: number;
    tags: string[];
  };

  const baseProducts: SeedProduct[] = [
    {
      id: "prod-nimbus-og-35",
      name: "Nimbus OG (1/8 oz)",
      category: "Flower",
      subcategory: "Hybrid",
      thcPercent: 23.5,
      price: 35,
      tags: ["euphoric", "relaxed", "evening"],
    },
    {
      id: "prod-midnight-mints",
      name: "Midnight Mints 5mg",
      category: "Edibles",
      subcategory: "Gummies",
      thcPercent: 5,
      price: 18,
      tags: ["sleep", "relief", "discreet"],
    },
    {
      id: "prod-sunrise-sativa",
      name: "Sunrise Sativa (1g preroll)",
      category: "Pre-roll",
      subcategory: "Sativa",
      thcPercent: 21,
      price: 12,
      tags: ["creative", "focus", "daytime"],
    },
    {
      id: "prod-glass-510-battery",
      name: "Nimbus Glass 510 Battery",
      category: "Gear",
      price: 30,
      tags: ["hardware", "battery", "accessory"],
    },
    {
      id: "prod-calm-cbd-tincture",
      name: "Calm 20:1 CBD Tincture",
      category: "Wellness",
      subcategory: "Tincture",
      cbdPercent: 20,
      price: 45,
      tags: ["anxiety", "daytime", "non-intoxicating"],
    },
    {
      id: "prod-limonene-live-resin",
      name: "Limonene Live Resin Cart",
      category: "Vapes",
      subcategory: "Hybrid",
      thcPercent: 78,
      price: 55,
      tags: ["uplifting", "flavor-forward"],
    },
    {
      id: "prod-indigo-indica-oz",
      name: "Indigo Indica (1/4 oz)",
      category: "Flower",
      subcategory: "Indica",
      thcPercent: 25,
      price: 65,
      tags: ["sleep", "heavy", "night"],
    },
    {
      id: "prod-cold-brew-10mg",
      name: "Cold Brew 10mg",
      category: "Edibles",
      subcategory: "Drink",
      thcPercent: 10,
      price: 10,
      tags: ["daytime", "coffee", "social"],
    },
  ];

  const allProducts: any[] = [];

  for (const seed of baseProducts) {
    const p = await prisma.product.upsert({
      where: { id: seed.id },
      update: {},
      create: {
        id: seed.id,
        tenantId: demoTenant.id,
        name: seed.name,
        description: `${seed.name} — demo product showcasing Nimbus recommendations and analytics.`,
        category: seed.category,
        subcategory: seed.subcategory,
        thcPercent: seed.thcPercent,
        cbdPercent: seed.cbdPercent,
        price: seed.price,
        tags: seed.tags,
      },
    });
    allProducts.push(p);
  }

  // ---------- STORE / PRODUCT INVENTORY ----------
  const inventoryCombos = [
    {
      store: detroit,
      productId: "prod-nimbus-og-35",
      inventory: 120,
      price: 35,
    },
    {
      store: detroit,
      productId: "prod-midnight-mints",
      inventory: 80,
      price: 18,
    },
    {
      store: detroit,
      productId: "prod-sunrise-sativa",
      inventory: 60,
      price: 12,
    },
    {
      store: scottsdale,
      productId: "prod-limonene-live-resin",
      inventory: 40,
      price: 55,
    },
    {
      store: scottsdale,
      productId: "prod-glass-510-battery",
      inventory: 30,
      price: 30,
    },
    {
      store: boulder,
      productId: "prod-calm-cbd-tincture",
      inventory: 50,
      price: 45,
    },
    { store: la, productId: "prod-indigo-indica-oz", inventory: 35, price: 65 },
    { store: la, productId: "prod-cold-brew-10mg", inventory: 70, price: 10 },
  ];

  await Promise.all(
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
