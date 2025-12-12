const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function main() {
  console.log("Seeding demo data (idempotent)...");

  const tenants = [
    { slug: "demo-acme", name: "Demo ACME" },
    { slug: "demo-beta", name: "Demo Beta" },
    { slug: "demo-gamma", name: "Demo Gamma" },
  ];

  const tenantRecords = [];
  for (const t of tenants) {
    const rec = await prisma.tenant.upsert({
      where: { slug: t.slug },
      update: { name: t.name, status: "active", sanityDataset: "nimbus_demo" },
      create: { slug: t.slug, name: t.name, sanityDataset: "nimbus_demo" },
    });
    tenantRecords.push(rec);
  }

  // create stores
  const storeNames = ["downtown", "uptown", "midtown", "harbor", "suburb"];
  const stores = [];
  for (let i = 0; i < storeNames.length; i++) {
    const t = tenantRecords[i % tenantRecords.length];
    const slug = `${storeNames[i]}-${t.slug}`;
    const s = await prisma.store.upsert({
      where: { slug },
      update: { name: storeNames[i], tenantId: t.id },
      create: { slug, name: storeNames[i], tenantId: t.id, timezone: "UTC" },
    });
    stores.push(s);
  }

  // products (40)
  const products = [];
  const tags = [
    "sativa",
    "indica",
    "hybrid",
    "edible",
    "vape",
    "topical",
    "organic",
  ];
  for (let i = 0; i < 40; i++) {
    const tenant = tenantRecords[i % tenantRecords.length];
    const slug = `demo-product-${i + 1}`;
    const name = `Demo Product ${i + 1}`;
    const p = await prisma.product.upsert({
      where: { tenantId_slug: { tenantId: tenant.id, slug } },
      update: {
        name,
        priceCents: randInt(1000, 30000),
        thc: parseFloat((Math.random() * 30).toFixed(2)),
        cbd: parseFloat((Math.random() * 10).toFixed(2)),
        tags: [tags[i % tags.length]],
      },
      create: {
        tenantId: tenant.id,
        name,
        slug,
        priceCents: randInt(1000, 30000),
        thc: parseFloat((Math.random() * 30).toFixed(2)),
        cbd: parseFloat((Math.random() * 10).toFixed(2)),
        tags: [tags[i % tags.length]],
      },
    });
    products.push(p);
    // add one media
    await prisma.productMedia.upsert({
      where: { id: p.id },
      update: {
        url: `https://picsum.photos/seed/${slug}/600/400`,
        mime: "image/jpeg",
      },
      create: {
        id: p.id,
        productId: p.id,
        url: `https://picsum.photos/seed/${slug}/600/400`,
        mime: "image/jpeg",
      },
    });
  }

  // users (demo shoppers)
  const users = [];
  for (let i = 0; i < 10; i++) {
    const t = tenantRecords[i % tenantRecords.length];
    const email = `demo_user_${i + 1}@example.com`;
    const u = await prisma.user.upsert({
      where: { tenantId_email: { tenantId: t.id, email } },
      update: { name: `Demo User ${i + 1}` },
      create: { tenantId: t.id, email, name: `Demo User ${i + 1}` },
    });
    users.push(u);
  }

  // orders (50)
  for (let i = 0; i < 50; i++) {
    const tenant = tenantRecords[i % tenantRecords.length];
    const store = stores[i % stores.length];
    const user = users[i % users.length];
    const order = await prisma.order.create({
      data: {
        tenantId: tenant.id,
        storeId: store.id,
        userId: user.id,
        totalCents: randInt(2000, 12000),
        status: "completed",
        items: {
          create: [
            {
              productId: products[i % products.length].id,
              quantity: randInt(1, 3),
              unitPrice: products[i % products.length].priceCents,
            },
          ],
        },
      },
    });
  }

  // articles (15)
  for (let i = 0; i < 15; i++) {
    const t = tenantRecords[i % tenantRecords.length];
    const slug = `demo-article-${i + 1}`;
    await prisma.article.upsert({
      where: { tenantId_slug: { tenantId: t.id, slug } },
      update: {
        title: `Demo Article ${i + 1}`,
        body: "Sample content",
        published: true,
        publishedAt: new Date(),
      },
      create: {
        tenantId: t.id,
        title: `Demo Article ${i + 1}`,
        slug,
        body: "Sample content",
        published: true,
        publishedAt: new Date(),
      },
    });
  }

  // deals (5)
  for (let i = 0; i < 5; i++) {
    const t = tenantRecords[i % tenantRecords.length];
    await prisma.deal.upsert({
      where: { id: `deal-${t.slug}-${i}` },
      update: { title: `Demo Deal ${i + 1}` },
      create: {
        id: `deal-${t.slug}-${i}`,
        tenantId: t.id,
        title: `Demo Deal ${i + 1}`,
        description: "Demo deal",
        active: true,
      },
    });
  }

  // awards (3 tiers)
  for (let tier = 1; tier <= 3; tier++) {
    const t = tenantRecords[(tier - 1) % tenantRecords.length];
    await prisma.award.upsert({
      where: { id: `award-${t.slug}-${tier}` },
      update: { title: `Award Tier ${tier}`, tier },
      create: {
        id: `award-${t.slug}-${tier}`,
        tenantId: t.id,
        title: `Award Tier ${tier}`,
        tier,
      },
    });
  }

  // legal docs (3 versions)
  for (let v = 1; v <= 3; v++) {
    const t = tenantRecords[v % tenantRecords.length];
    await prisma.legalDocument.upsert({
      where: { id: `legal-${t.slug}-${v}` },
      update: { version: v, docType: "terms", body: `Terms v${v}` },
      create: {
        id: `legal-${t.slug}-${v}`,
        tenantId: t.id,
        docType: "terms",
        version: v,
        body: `Terms v${v}`,
      },
    });
  }

  // journal entries (AI training)
  for (let i = 0; i < 30; i++) {
    const t = tenantRecords[i % tenantRecords.length];
    await prisma.journalEntry.create({
      data: {
        tenantId: t.id,
        content: `Journal entry ${i + 1}`,
        source: "seed",
      },
    });
  }

  // analytics noise
  for (let i = 0; i < 200; i++) {
    const t = tenantRecords[i % tenantRecords.length];
    await prisma.analyticsEvent.create({
      data: {
        tenantId: t.id,
        type: "view",
        payload: { path: "/home", ts: Date.now() },
      },
    });
  }

  console.log("Seeding complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
