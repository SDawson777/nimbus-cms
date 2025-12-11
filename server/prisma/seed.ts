import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function ensureAdminFile(email: string, password: string) {
  try {
    const configDir = path.join(__dirname, '..', 'config');
    if (!fs.existsSync(configDir)) fs.mkdirSync(configDir, { recursive: true });
    const filePath = path.join(configDir, 'admins.json');
    if (fs.existsSync(filePath)) return;
    const hash = await bcrypt.hash(password, 10);
    const admin = {
      admins: [
        {
          id: 'seed-admin',
          email,
          passwordHash: hash,
          role: 'OWNER',
        },
      ],
    };
    fs.writeFileSync(filePath, JSON.stringify(admin, null, 2), 'utf8');
    console.log('Wrote server config admins.json for demo admin');
  } catch (e) {
    console.warn('Failed to write admin config file', e);
  }
}

async function main() {
  console.log('Starting demo seed (server/prisma/seed.ts)');

  // tenants
  const tenantsData = [
    { slug: 'demo-operator', name: 'Demo Operator' },
    { slug: 'global-corp', name: 'Global Corp' },
    { slug: 'nimbus-labs', name: 'Nimbus Labs' },
  ];

  const tenants: any[] = [];
  for (const t of tenantsData) {
    const rec = await prisma.tenant.upsert({
      where: { slug: t.slug },
      update: { name: t.name, status: 'active', sanityDataset: 'nimbus_demo' },
      create: { slug: t.slug, name: t.name, sanityDataset: 'nimbus_demo' },
    });
    tenants.push(rec);
  }

  // stores
  const storesData = [
    { name: 'Detroit – 8 Mile', slug: 'detroit-8mile' },
    { name: 'Scottsdale – North', slug: 'scottsdale-north' },
    { name: 'Boulder – Pearl', slug: 'boulder-pearl' },
    { name: 'LA – Melrose', slug: 'la-melrose' },
  ];

  const stores: any[] = [];
  for (let i = 0; i < storesData.length; i++) {
    const t = tenants[i % tenants.length];
    const s = await prisma.store.upsert({
      where: { id: `${t.slug}-${storesData[i].slug}` },
      update: { name: storesData[i].name },
      create: {
        id: `${t.slug}-${storesData[i].slug}`,
        tenantId: t.id,
        name: storesData[i].name,
        address: '',
        city: '',
        state: '',
        zip: '',
      },
    });
    stores.push(s);
  }

  // products (40 across categories)
  const categories = ['Flower', 'Pre-roll', 'Edibles', 'Vapes', 'Concentrates', 'Gear', 'CBD', 'Wellness'];
  const products: any[] = [];
  for (let i = 0; i < 40; i++) {
    const tenant = tenants[i % tenants.length];
    const category = categories[i % categories.length];
    const slug = `product-${i + 1}`;
    const name = `${category} ${i + 1}`;
    const media = [{ url: `https://picsum.photos/seed/${slug}/800/600`, alt: name }];
    const p = await prisma.product.upsert({
      where: { id: `${tenant.slug}-${slug}` },
      update: { name, description: `${name} description`, category, price: parseFloat((randInt(1000, 4000) / 100).toFixed(2)), tags: [category.toLowerCase()] },
      create: {
        id: `${tenant.slug}-${slug}`,
        tenantId: tenant.id,
        name,
        description: `${name} description`,
        category,
        price: parseFloat((randInt(1000, 4000) / 100).toFixed(2)),
        media,
        tags: [category.toLowerCase()],
      },
    });
    products.push(p);

    // map some store inventory
    const store = stores[i % stores.length];
    await prisma.storeProduct.upsert({
      where: { id: `${store.id}-${p.id}` },
      update: { inventory: randInt(5, 200), price: p.price },
      create: { id: `${store.id}-${p.id}`, storeId: store.id, productId: p.id, inventory: randInt(5, 200), price: p.price },
    });
  }

  // users
  const users: any[] = [];
  for (let i = 0; i < 20; i++) {
    const tenant = tenants[i % tenants.length];
    const email = `demo${i + 1}@example.com`;
    const u = await prisma.user.upsert({
      where: { id: `${tenant.slug}-${email}` },
      update: { name: `Demo User ${i + 1}` },
      create: { id: `${tenant.slug}-${email}`, tenantId: tenant.id, email, name: `Demo User ${i + 1}` },
    });
    users.push(u);
  }

  // heavy shoppers
  for (let i = 0; i < 5; i++) {
    const tenant = tenants[i % tenants.length];
    const email = `heavy${i + 1}@example.com`;
    const u = await prisma.user.upsert({
      where: { id: `${tenant.slug}-${email}` },
      update: { name: `Heavy Shopper ${i + 1}` },
      create: { id: `${tenant.slug}-${email}`, tenantId: tenant.id, email, name: `Heavy Shopper ${i + 1}` },
    });
    users.push(u);
  }

  // orders (50 over last 60 days)
  const now = Date.now();
  for (let i = 0; i < 50; i++) {
    const tenant = tenants[i % tenants.length];
    const user = users[i % users.length];
    const store = stores[i % stores.length];
    const product = products[i % products.length];
    const placed = new Date(now - randInt(0, 60) * 24 * 60 * 60 * 1000);
    const order = await prisma.order.create({
      data: {
        tenantId: tenant.id,
        userId: user.id,
        total: product.price,
        status: 'completed',
        createdAt: placed,
        items: { create: [{ productId: product.id, quantity: randInt(1, 3), price: product.price }] },
      },
    });
  }

  // articles (15)
  for (let i = 0; i < 15; i++) {
    const tenant = tenants[i % tenants.length];
    const slug = `article-${i + 1}`;
    await prisma.contentPage.upsert({
      where: { id: `${tenant.slug}-${slug}` },
      update: { title: `Greenhouse Article ${i + 1}`, body: `Rich content for article ${i + 1}` },
      create: { id: `${tenant.slug}-${slug}`, tenantId: tenant.id, slug, title: `Greenhouse Article ${i + 1}`, body: `Rich content for article ${i + 1}` },
    });
  }

  // deals
  const deals = [
    { title: 'BOGO', description: 'Buy one get one free' },
    { title: '20% Off', description: '20% off selected items' },
    { title: 'Category Sale', description: 'Category based sale' },
    { title: 'Holiday Special', description: 'Limited time offer' },
    { title: 'Clearance', description: 'End of line discounts' },
  ];
  for (let i = 0; i < deals.length; i++) {
    const tenant = tenants[i % tenants.length];
    await prisma.deal.upsert({
      where: { id: `${tenant.slug}-deal-${i}` },
      update: { title: deals[i].title, description: deals[i].description },
      create: { id: `${tenant.slug}-deal-${i}`, tenantId: tenant.id, title: deals[i].title, description: deals[i].description, active: true },
    });
  }

  // awards (3 tiers)
  const tiers = ['Bronze', 'Silver', 'Gold'];
  for (let i = 0; i < tiers.length; i++) {
    const tenant = tenants[i % tenants.length];
    await prisma.award.upsert({
      where: { id: `${tenant.slug}-award-${i}` },
      update: { title: `${tiers[i]} Tier`, points: (i + 1) * 100 },
      create: { id: `${tenant.slug}-award-${i}`, tenantId: tenant.id, title: `${tiers[i]} Tier`, points: (i + 1) * 100 },
    });
  }

  // legal docs
  const legalTypes = ['terms', 'privacy', 'accessibility'];
  for (let i = 0; i < legalTypes.length; i++) {
    const tenant = tenants[i % tenants.length];
    await prisma.legalDocument.upsert({
      where: { id: `${tenant.slug}-legal-${legalTypes[i]}-1` },
      update: { type: legalTypes[i], version: '1', body: `${legalTypes[i]} v1` },
      create: { id: `${tenant.slug}-legal-${legalTypes[i]}-1`, tenantId: tenant.id, type: legalTypes[i], version: '1', body: `${legalTypes[i]} v1` },
    });
  }

  // journal entries
  for (let i = 0; i < 30; i++) {
    const tenant = tenants[i % tenants.length];
    const user = users[i % users.length];
    await prisma.journalEntry.create({ data: { userId: user.id, mood: 'neutral', notes: `Seed note ${i + 1}`, createdAt: new Date() } });
  }

  // analytics noise
  for (let i = 0; i < 300; i++) {
    const tenant = tenants[i % tenants.length];
    await prisma.analyticsEvent.create({ data: { tenantId: tenant.id, type: 'view', payload: { path: '/home', ts: Date.now() } } });
  }

  // ensure admin file exists for login (demo@nimbus.app)
  const adminEmail = process.env.ADMIN_EMAIL || 'demo@nimbus.app';
  const adminPassword = process.env.ADMIN_PASSWORD || 'password123';
  await ensureAdminFile(adminEmail, adminPassword);

  console.log('Demo seed finished.');
}

main()
  .catch((e) => {
    console.error('Seed failed', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const tenant = await prisma.tenant.upsert({
    where: { slug: "demo-operator" },
    update: {},
    create: {
      name: "Demo Operator",
      slug: "demo-operator",
      sanityDataset: "nimbus_demo",
      status: "active",
    },
  });

  await prisma.store.upsert({
    where: { slug: "downtown-detroit" },
    update: {},
    create: {
      name: "Downtown Detroit",
      slug: "downtown-detroit",
      tenantId: tenant.id,
      timezone: "America/Detroit",
    },
  });

  console.log("Seed complete.");
}

main().finally(() => prisma.$disconnect());
