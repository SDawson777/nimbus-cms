// ============================================================
// NIMBUS CLOUD — DEMO SEED SCRIPT
// ============================================================
// Run via: npm run db:seed:demo  (from server/)
// ⚠️  DEMO/PREVIEW ONLY — DO NOT RUN AGAINST PRODUCTION
// ============================================================

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function clearDemoData() {
  console.log("  🧹 Clearing existing data...");
  
  // Delete in dependency-safe order (children first)
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.cartItem.deleteMany({});
  await prisma.cart.deleteMany({});
  await prisma.review.deleteMany({});
  await prisma.storeProduct.deleteMany({});
  await prisma.productVariant.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.theme.deleteMany({});
  await prisma.featureFlag.deleteMany({});
  await prisma.store.deleteMany({});
  await prisma.tenant.deleteMany({});

  await prisma.loyaltyBadge.deleteMany({});
  await prisma.loyaltyStatus.deleteMany({});

  await prisma.journalEntry.deleteMany({});
  await prisma.userEvent.deleteMany({});
  await prisma.userPreferences.deleteMany({});
  await prisma.user.deleteMany({});

  await prisma.article.deleteMany({});
  await prisma.contentPage.deleteMany({});
  await prisma.accessibilityPage.deleteMany({});
  await prisma.legalPage.deleteMany({});
  await prisma.dataExport.deleteMany({});
  await prisma.systemBanner.deleteMany({});
  await prisma.adminPreference.deleteMany({});
  
  console.log("  ✓ Cleared");
}

async function seedDemo() {
  console.log("  🌱 Seeding demo data...");

  // 1) Demo tenant
  const demoTenant = await prisma.tenant.create({
    data: {
      slug: "demo-tenant",
      name: "Nimbus Demo Tenant",
      status: "active",
      sanityDataset: "demo",
      primaryDomain: "demo.nimbuscloud.app",
      region: "us-west-1",
    },
  });

  // 2) Demo store
  const demoStore = await prisma.store.create({
    data: {
      tenantId: demoTenant.id,
      slug: "nimbus-demo-dispensary",
      name: "Nimbus Demo Dispensary",
      address1: "123 Demo Street",
      city: "Los Angeles",
      state: "CA",
      postalCode: "90000",
      country: "USA",
      latitude: 34.0522,
      longitude: -118.2437,
      phone: "+1 (555) 555-0101",
      email: "demo@nimbuscloud.app",
      timezone: "America/Los_Angeles",
      status: "active",
      isDeliveryEnabled: true,
      isPickupEnabled: true,
    },
  });

  // 3) Demo user
  const demoUser = await prisma.user.create({
    data: {
      email: "demo@nimbuscloud.app",
      phone: "+15555550123",
      passwordHash: "$2a$10$DEMO.HASH.NOT.FOR.PRODUCTION.USE", // bcrypt format but not real
      firstName: "Nimbus",
      lastName: "Demo",
      preferences: {
        create: {
          notificationFrequency: "immediate",
          notifyOrderUpdates: true,
          notifyDeals: true,
          notifyFavorites: true,
          notifyAnalytics: false,
          themePreference: "system",
        },
      },
    },
  });

  // 4) Products + variants
  const flower = await prisma.product.create({
    data: {
      name: "Nimbus OG",
      slug: "nimbus-og",
      description: "Signature hybrid flower used for demo analytics and loyalty flows.",
      category: "Flower",
      brand: "Nimbus Labs",
      imageUrl: "https://via.placeholder.com/512x512.png?text=Nimbus+OG",
      variants: {
        create: [
          {
            name: "3.5g",
            thc: 24.5,
            cbd: 0.2,
            weight: "3.5g",
            unitPrice: 45.0,
          },
          {
            name: "7g",
            thc: 24.5,
            cbd: 0.2,
            weight: "7g",
            unitPrice: 80.0,
          },
        ],
      },
    },
    include: { variants: true },
  });

  const edible = await prisma.product.create({
    data: {
      name: "Nimbus Gummy Flight",
      slug: "nimbus-gummy-flight",
      description: "Mixed-effect gummies pack used for personalization demos.",
      category: "Edible",
      brand: "Nimbus Labs",
      imageUrl: "https://via.placeholder.com/512x512.png?text=Nimbus+Gummies",
      variants: {
        create: [
          {
            name: "10-pack",
            thc: 10,
            cbd: 0,
            weight: "10 x 10mg",
            unitPrice: 25.0,
          },
        ],
      },
    },
    include: { variants: true },
  });

  const concentrate = await prisma.product.create({
    data: {
      name: "Nimbus Live Resin",
      slug: "nimbus-live-resin",
      description: "Premium concentrate for advanced users.",
      category: "Concentrate",
      brand: "Nimbus Labs",
      imageUrl: "https://via.placeholder.com/512x512.png?text=Nimbus+Concentrate",
      variants: {
        create: [
          {
            name: "1g",
            thc: 85.5,
            cbd: 0.5,
            weight: "1g",
            unitPrice: 60.0,
          },
        ],
      },
    },
    include: { variants: true },
  });

  // 5) Attach inventory to demo store
  const storeProductsData = [
    {
      storeId: demoStore.id,
      productId: flower.id,
      productVariantId: flower.variants[0].id,
      stock: 50,
      price: 45.0,
      active: true,
    },
    {
      storeId: demoStore.id,
      productId: flower.id,
      productVariantId: flower.variants[1].id,
      stock: 30,
      price: 80.0,
      active: true,
    },
    {
      storeId: demoStore.id,
      productId: edible.id,
      productVariantId: edible.variants[0].id,
      stock: 100,
      price: 25.0,
      active: true,
    },
    {
      storeId: demoStore.id,
      productId: concentrate.id,
      productVariantId: concentrate.variants[0].id,
      stock: 20,
      price: 60.0,
      active: true,
    },
  ];

  await prisma.storeProduct.createMany({ data: storeProductsData });

  // 6) Theme configuration
  await prisma.theme.create({
    data: {
      tenantId: demoTenant.id,
      storeId: demoStore.id,
      name: "Nimbus Classic",
      isDefault: true,
      configJson: {
        primaryColor: "#3F7AFC",
        secondaryColor: "#10B981",
        fontFamily: "Inter",
        layout: "modern",
      },
    },
  });

  // 7) Feature flags
  await prisma.featureFlag.createMany({
    data: [
      {
        tenantId: demoTenant.id,
        key: "enable_loyalty",
        valueJson: { enabled: true },
      },
      {
        tenantId: demoTenant.id,
        key: "enable_ai_concierge",
        valueJson: { enabled: true },
      },
      {
        tenantId: demoTenant.id,
        key: "enable_personalization",
        valueJson: { enabled: true },
      },
    ],
  });

  // 8) Loyalty + status
  await prisma.loyaltyStatus.create({
    data: {
      userId: demoUser.id,
      tier: "gold",
      points: 420,
    },
  });

  await prisma.loyaltyBadge.createMany({
    data: [
      {
        userId: demoUser.id,
        badgeType: "Early Adopter",
      },
      {
        userId: demoUser.id,
        badgeType: "Weekend Warrior",
      },
      {
        userId: demoUser.id,
        badgeType: "Connoisseur",
      },
    ],
  });

  // 9) Sample articles + content pages
  await prisma.article.create({
    data: {
      title: "Welcome to Nimbus Cloud Demo",
      slug: "welcome-to-nimbus-demo",
      body: {
        blocks: [
          {
            type: "paragraph",
            children: [
              {
                text: "This is seeded demo content for Nimbus Cloud. Explore the full-featured cannabis platform with multi-tenant support, e-commerce, loyalty programs, and AI-powered personalization.",
              },
            ],
          },
        ],
      },
      imageUrl: "https://via.placeholder.com/1024x512.png?text=Nimbus+Demo",
      published: true,
      publishedAt: new Date(),
    },
  });

  await prisma.article.create({
    data: {
      title: "Understanding THC and CBD",
      slug: "understanding-thc-cbd",
      body: {
        blocks: [
          {
            type: "paragraph",
            children: [
              {
                text: "Learn about the differences between THC and CBD, and how they affect your experience.",
              },
            ],
          },
        ],
      },
      imageUrl: "https://via.placeholder.com/1024x512.png?text=THC+CBD",
      published: true,
      publishedAt: new Date(),
    },
  });

  await prisma.contentPage.create({
    data: {
      slug: "demo-home",
      category: "system",
      body: {
        blocks: [
          {
            type: "paragraph",
            children: [{ text: "Configured demo home content for CMS preview." }],
          },
        ],
      },
    },
  });

  await prisma.legalPage.create({
    data: {
      slug: "terms-of-service",
      body: {
        blocks: [
          {
            type: "paragraph",
            children: [{ text: "Demo terms of service. Not for production use." }],
          },
        ],
      },
      version: "1.0.0-demo",
    },
  });

  // 10) Synthetic journal + events for analytics demos
  await prisma.journalEntry.createMany({
    data: [
      {
        userId: demoUser.id,
        mood: "relaxed",
        productUsed: "Nimbus OG 3.5g",
        notes: "Nice balanced effect. Great for focus & deep work.",
      },
      {
        userId: demoUser.id,
        mood: "energized",
        productUsed: "Nimbus Gummy Flight",
        notes: "Perfect daytime dose. Lifted mood without being overwhelming.",
      },
      {
        userId: demoUser.id,
        mood: "creative",
        productUsed: "Nimbus Live Resin",
        notes: "Intense flavor and effect. Great for evening sessions.",
      },
    ],
  });

  await prisma.userEvent.createMany({
    data: [
      {
        userId: demoUser.id,
        type: "login",
        metadata: { device: "mobile", platform: "iOS" },
      },
      {
        userId: demoUser.id,
        type: "product_view",
        metadata: { productSlug: "nimbus-og" },
      },
      {
        userId: demoUser.id,
        type: "product_view",
        metadata: { productSlug: "nimbus-gummy-flight" },
      },
      {
        userId: demoUser.id,
        type: "add_to_cart",
        metadata: { productSlug: "nimbus-og", variant: "3.5g" },
      },
      {
        userId: demoUser.id,
        type: "checkout_complete",
        metadata: { orderValue: 80.0, itemCount: 2 },
      },
    ],
  });

  // 11) Sample review
  await prisma.review.create({
    data: {
      userId: demoUser.id,
      productId: flower.id,
      rating: 5,
      comment: "Absolutely love this strain! Perfect balance and amazing flavor.",
    },
  });

  // 12) System banner
  await prisma.systemBanner.create({
    data: {
      message: "Welcome to Nimbus Demo! This is a fully seeded environment for testing.",
      priority: "info",
    },
  });

  console.log("  ✓ Seeded");
  console.log("");
  console.log("  📊 Demo Environment Ready:");
  console.log(`     Tenant: ${demoTenant.name} (${demoTenant.slug})`);
  console.log(`     Store: ${demoStore.name} (${demoStore.slug})`);
  console.log(`     User: ${demoUser.email}`);
  console.log(`     Products: ${[flower.name, edible.name, concentrate.name].join(", ")}`);
  console.log("");
}

async function main() {
  console.log("");
  console.log("🚀 Nimbus Cloud Demo Seed");
  console.log("⚠️  DEMO/PREVIEW ONLY — DO NOT RUN AGAINST PRODUCTION");
  console.log("");
  
  await clearDemoData();
  await seedDemo();
  
  console.log("✅ Demo seed complete!");
  console.log("");
}

main()
  .catch((e) => {
    console.error("");
    console.error("❌ Demo seed failed:", e);
    console.error("");
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
