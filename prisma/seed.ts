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

  // Secondary tenant used for validating tenant isolation behavior.
  // Note: the Admin UI demo workspace selector uses "tenant-b".
  const tenantBSlug = pickEnv("DEMO_TENANT_B_SLUG") || "tenant-b";
  const tenantBSanityDataset =
    pickEnv("DEMO_TENANT_B_SANITY_DATASET") || "nimbus_tenant_b";

  // Preview tenant for staging/preview environment
  const previewTenantSlug = pickEnv("PREVIEW_TENANT_SLUG") || "preview-operator";
  const previewSanityDataset =
    pickEnv("PREVIEW_SANITY_DATASET") || "nimbus_preview";

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
      id: demoTenantSlug,
      slug: demoTenantSlug,
      name: "Demo Operator",
      status: "active",
      sanityDataset: demoSanityDataset,
      primaryDomain: pickEnv("DEMO_PRIMARY_DOMAIN") || "demo.nimbus.app",
      region: pickEnv("DEMO_REGION") || "US-MI",
      updatedAt: new Date(),
    },
  });

  const tenantB = await prisma.tenant.upsert({
    where: { slug: tenantBSlug },
    update: {
      name: "Tenant B Operator",
      status: "active",
      sanityDataset: tenantBSanityDataset,
      primaryDomain: pickEnv("DEMO_TENANT_B_PRIMARY_DOMAIN") || "tenant-b.nimbus.app",
      region: pickEnv("DEMO_TENANT_B_REGION") || "US-IL",
    },
    create: {
      id: tenantBSlug,
      slug: tenantBSlug,
      name: "Tenant B Operator",
      status: "active",
      sanityDataset: tenantBSanityDataset,
      primaryDomain: pickEnv("DEMO_TENANT_B_PRIMARY_DOMAIN") || "tenant-b.nimbus.app",
      region: pickEnv("DEMO_TENANT_B_REGION") || "US-IL",
      updatedAt: new Date(),
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
      id: `${tenant.id}-downtown-detroit`,
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
      updatedAt: new Date(),
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
      id: `${tenant.id}-eastside`,
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
      updatedAt: new Date(),
    },
  });

  const tenantBStore = await prisma.store.upsert({
    where: { tenantId_slug: { tenantId: tenantB.id, slug: "chicago-loop" } },
    update: {
      name: "Chicago Loop",
      address1: "900 W Demo St",
      city: "Chicago",
      state: "IL",
      postalCode: "60601",
      country: "US",
      phone: "+1-555-0200",
      timezone: "America/Chicago",
      isPickupEnabled: true,
      isDeliveryEnabled: true,
    },
    create: {
      id: `${tenantB.id}-chicago-loop`,
      tenantId: tenantB.id,
      slug: "chicago-loop",
      name: "Chicago Loop",
      address1: "900 W Demo St",
      city: "Chicago",
      state: "IL",
      postalCode: "60601",
      country: "US",
      phone: "+1-555-0200",
      timezone: "America/Chicago",
      isPickupEnabled: true,
      isDeliveryEnabled: true,
      updatedAt: new Date(),
    },
  });

  // Preview tenant (for staging/preview environment)
  const previewTenant = await prisma.tenant.upsert({
    where: { slug: previewTenantSlug },
    update: {
      name: "Preview Operator",
      status: "active",
      sanityDataset: previewSanityDataset,
      primaryDomain: pickEnv("PREVIEW_PRIMARY_DOMAIN") || "preview.nimbus.app",
      region: pickEnv("PREVIEW_REGION") || "US-CA",
    },
    create: {
      id: previewTenantSlug,
      slug: previewTenantSlug,
      name: "Preview Operator",
      status: "active",
      sanityDataset: previewSanityDataset,
      primaryDomain: pickEnv("PREVIEW_PRIMARY_DOMAIN") || "preview.nimbus.app",
      region: pickEnv("PREVIEW_REGION") || "US-CA",
      updatedAt: new Date(),
    },
  });

  const previewStore1 = await prisma.store.upsert({
    where: { tenantId_slug: { tenantId: previewTenant.id, slug: "san-francisco" } },
    update: {
      name: "San Francisco",
      address1: "100 Preview St",
      city: "San Francisco",
      state: "CA",
      postalCode: "94102",
      country: "US",
      latitude: 37.7749,
      longitude: -122.4194,
      phone: "+1-555-0300",
      timezone: "America/Los_Angeles",
      isPickupEnabled: true,
      isDeliveryEnabled: true,
    },
    create: {
      id: `${previewTenant.id}-san-francisco`,
      tenantId: previewTenant.id,
      slug: "san-francisco",
      name: "San Francisco",
      address1: "100 Preview St",
      city: "San Francisco",
      state: "CA",
      postalCode: "94102",
      country: "US",
      latitude: 37.7749,
      longitude: -122.4194,
      phone: "+1-555-0300",
      timezone: "America/Los_Angeles",
      isPickupEnabled: true,
      isDeliveryEnabled: true,
      updatedAt: new Date(),
    },
  });

  const previewStore2 = await prisma.store.upsert({
    where: { tenantId_slug: { tenantId: previewTenant.id, slug: "oakland" } },
    update: {
      name: "Oakland",
      address1: "200 Preview Ave",
      city: "Oakland",
      state: "CA",
      postalCode: "94601",
      country: "US",
      latitude: 37.8044,
      longitude: -122.2712,
      phone: "+1-555-0301",
      timezone: "America/Los_Angeles",
      isPickupEnabled: true,
      isDeliveryEnabled: false,
    },
    create: {
      id: `${previewTenant.id}-oakland`,
      tenantId: previewTenant.id,
      slug: "oakland",
      name: "Oakland",
      address1: "200 Preview Ave",
      city: "Oakland",
      state: "CA",
      postalCode: "94601",
      country: "US",
      latitude: 37.8044,
      longitude: -122.2712,
      phone: "+1-555-0301",
      timezone: "America/Los_Angeles",
      isPickupEnabled: true,
      isDeliveryEnabled: false,
      updatedAt: new Date(),
    },
  });

  const previewStore3 = await prisma.store.upsert({
    where: { tenantId_slug: { tenantId: previewTenant.id, slug: "san-jose" } },
    update: {
      name: "San Jose",
      address1: "300 South Ave",
      city: "San Jose",
      state: "CA",
      postalCode: "95113",
      country: "US",
      latitude: 37.3382,
      longitude: -121.8863,
      phone: "+1-555-0302",
      timezone: "America/Los_Angeles",
      isPickupEnabled: true,
      isDeliveryEnabled: true,
    },
    create: {
      id: `${previewTenant.id}-san-jose`,
      tenantId: previewTenant.id,
      slug: "san-jose",
      name: "San Jose",
      address1: "300 South Ave",
      city: "San Jose",
      state: "CA",
      postalCode: "95113",
      country: "US",
      latitude: 37.3382,
      longitude: -121.8863,
      phone: "+1-555-0302",
      timezone: "America/Los_Angeles",
      isPickupEnabled: true,
      isDeliveryEnabled: true,
      updatedAt: new Date(),
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

  // Tenant B default theme
  const existingTenantBTheme = await prisma.theme.findFirst({
    where: { tenantId: tenantB.id, isDefault: true },
  });
  if (existingTenantBTheme) {
    await prisma.theme.update({
      where: { id: existingTenantBTheme.id },
      data: {
        name: "Tenant B – Aurora",
        configJson: {
          palette: {
            primary: "#7C3AED",
            secondary: "#06B6D4",
            background: "#0B1020",
            accent: "#F97316",
          },
        },
      },
    });
  } else {
    await prisma.theme.create({
      data: {
        tenantId: tenantB.id,
        name: "Tenant B – Aurora",
        isDefault: true,
        configJson: {
          palette: {
            primary: "#7C3AED",
            secondary: "#06B6D4",
            background: "#0B1020",
            accent: "#F97316",
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

  const tenantBCustomer = await prisma.user.upsert({
    where: { email: "tenantb.customer@nimbus.local" },
    update: {
      tenantId: tenantB.id,
      storeId: tenantBStore.id,
      name: "Tenant B Customer",
      role: UserRole.CUSTOMER,
      passwordHash: await bcrypt.hash(customerPassword, 10),
      isActive: true,
    },
    create: {
      tenantId: tenantB.id,
      storeId: tenantBStore.id,
      email: "tenantb.customer@nimbus.local",
      name: "Tenant B Customer",
      role: UserRole.CUSTOMER,
      passwordHash: await bcrypt.hash(customerPassword, 10),
      isActive: true,
    },
  });

  const previewCustomer = await prisma.user.upsert({
    where: { email: "preview.customer@nimbus.local" },
    update: {
      tenantId: previewTenant.id,
      storeId: previewStore1.id,
      name: "Preview Customer",
      role: UserRole.CUSTOMER,
      passwordHash: await bcrypt.hash(customerPassword, 10),
      isActive: true,
    },
    create: {
      tenantId: previewTenant.id,
      storeId: previewStore1.id,
      email: "preview.customer@nimbus.local",
      name: "Preview Customer",
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

  const tenantBProducts = [
    {
      slug: "aurora-ice-pop",
      name: "Aurora Ice Pop",
      type: ProductType.FLOWER,
      category: "Flower",
      brand: "Aurora",
      price: 42,
      variants: [
        { sku: "CL-AURORAICE-1G", name: "1g", price: 14, stock: 140 },
        { sku: "CL-AURORAICE-3_5G", name: "3.5g", price: 42, stock: 90 },
      ],
    },
    {
      slug: "aurora-citrus-seltzer",
      name: "Aurora Citrus Seltzer (5mg)",
      type: ProductType.EDIBLE,
      category: "Edibles",
      brand: "Aurora",
      price: 9,
      variants: [
        { sku: "CL-AURORA-SEL-4PK", name: "4 pack", price: 9, stock: 120 },
      ],
    },
    {
      slug: "aurora-diamonds",
      name: "Aurora Diamonds",
      type: ProductType.CONCENTRATE,
      category: "Concentrates",
      brand: "Aurora",
      price: 60,
      variants: [
        { sku: "CL-AURORA-DIA-1G", name: "1g", price: 60, stock: 35 },
      ],
    },
  ];

  const previewProducts = [
    {
      slug: "coastal-haze",
      name: "Coastal Haze",
      type: ProductType.FLOWER,
      category: "Flower",
      brand: "Coastal",
      price: 40,
      variants: [
        { sku: "SF-COASTALHAZE-1G", name: "1g", price: 13, stock: 160 },
        { sku: "SF-COASTALHAZE-3_5G", name: "3.5g", price: 40, stock: 100 },
        { sku: "SF-COASTALHAZE-7G", name: "7g", price: 75, stock: 50 },
      ],
    },
    {
      slug: "golden-gate-gummies",
      name: "Golden Gate Gummies",
      type: ProductType.EDIBLE,
      category: "Edibles",
      brand: "Coastal",
      price: 22,
      variants: [
        { sku: "SF-GGGATE-12PK", name: "12 pack", price: 22, stock: 90 },
      ],
    },
    {
      slug: "bay-breeze-vape",
      name: "Bay Breeze Vape Cart",
      type: ProductType.VAPE,
      category: "Vaporizers",
      brand: "Coastal",
      price: 48,
      variants: [
        { sku: "SF-BAYBREEZE-0_5G", name: "0.5g", price: 48, stock: 70 },
        { sku: "SF-BAYBREEZE-1G", name: "1g", price: 85, stock: 40 },
      ],
    },
    {
      slug: "pacific-relief-balm",
      name: "Pacific Relief CBD Balm",
      type: ProductType.TOPICAL,
      category: "Wellness",
      brand: "Coastal",
      price: 38,
      variants: [
        { sku: "SF-PACRELIEF-2OZ", name: "2oz", price: 38, stock: 55 },
      ],
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

  for (const p of tenantBProducts) {
    const product = await prisma.product.upsert({
      where: { slug: `${tenantBStore.slug}-${p.slug}` },
      update: {
        storeId: tenantBStore.id,
        name: p.name,
        brand: p.brand,
        category: p.category,
        type: p.type,
        status: ProductStatus.ACTIVE,
        price: p.price,
        description: "Seeded demo product for Tenant B isolation validation.",
        isActive: true,
      },
      create: {
        storeId: tenantBStore.id,
        slug: `${tenantBStore.slug}-${p.slug}`,
        name: p.name,
        brand: p.brand,
        category: p.category,
        type: p.type,
        status: ProductStatus.ACTIVE,
        price: p.price,
        description: "Seeded demo product for Tenant B isolation validation.",
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

  for (const p of previewProducts) {
    const product = await prisma.product.upsert({
      where: { slug: `${previewStore1.slug}-${p.slug}` },
      update: {
        storeId: previewStore1.id,
        name: p.name,
        brand: p.brand,
        category: p.category,
        type: p.type,
        status: ProductStatus.ACTIVE,
        price: p.price,
        description: "Seeded preview product for staging environment.",
        isActive: true,
      },
      create: {
        storeId: previewStore1.id,
        slug: `${previewStore1.slug}-${p.slug}`,
        name: p.name,
        brand: p.brand,
        category: p.category,
        type: p.type,
        status: ProductStatus.ACTIVE,
        price: p.price,
        description: "Seeded preview product for staging environment.",
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

  // Tenant B: one sample order
  const tenantBFirstProduct = await prisma.product.findFirst({
    where: { storeId: tenantBStore.id },
    orderBy: { createdAt: "asc" },
  });
  if (tenantBFirstProduct) {
    const variant = await prisma.productVariant.findFirst({
      where: { productId: tenantBFirstProduct.id },
      orderBy: { createdAt: "asc" },
    });
    const orderId = "order-tenantb-0001";
    await prisma.order.upsert({
      where: { id: orderId },
      update: {
        userId: tenantBCustomer.id,
        storeId: tenantBStore.id,
        status: "PAID",
        total: tenantBFirstProduct.price,
      },
      create: {
        id: orderId,
        userId: tenantBCustomer.id,
        storeId: tenantBStore.id,
        status: "PAID",
        total: tenantBFirstProduct.price,
        items: {
          create: [
            {
              productId: tenantBFirstProduct.id,
              variantId: variant?.id,
              quantity: 1,
              price: tenantBFirstProduct.price,
            },
          ],
        },
      },
    });
  }
  // Preview tenant: sample orders
  const previewFirstProduct = await prisma.product.findFirst({
    where: { storeId: previewStore1.id },
    orderBy: { createdAt: "asc" },
  });
  if (previewFirstProduct) {
    const variant = await prisma.productVariant.findFirst({
      where: { productId: previewFirstProduct.id },
      orderBy: { createdAt: "asc" },
    });
    const orderId = "order-preview-0001";
    await prisma.order.upsert({
      where: { id: orderId },
      update: {
        userId: previewCustomer.id,
        storeId: previewStore1.id,
        status: "PENDING",
        total: previewFirstProduct.price,
      },
      create: {
        id: orderId,
        userId: previewCustomer.id,
        storeId: previewStore1.id,
        status: "PENDING",
        total: previewFirstProduct.price,
        items: {
          create: [
            {
              productId: previewFirstProduct.id,
              variantId: variant?.id,
              quantity: 2,
              price: previewFirstProduct.price,
            },
          ],
        },
      },
    });

    // Add a second order for preview
    const secondProduct = await prisma.product.findFirst({
      where: { 
        storeId: previewStore1.id,
        id: { not: previewFirstProduct.id }
      },
      orderBy: { createdAt: "asc" },
    });
    if (secondProduct) {
      const variant2 = await prisma.productVariant.findFirst({
        where: { productId: secondProduct.id },
        orderBy: { createdAt: "asc" },
      });
      await prisma.order.upsert({
        where: { id: "order-preview-0002" },
        update: {
          userId: previewCustomer.id,
          storeId: previewStore1.id,
          status: "FULFILLED",
          total: secondProduct.price * 1.5,
        },
        create: {
          id: "order-preview-0002",
          userId: previewCustomer.id,
          storeId: previewStore1.id,
          status: "FULFILLED",
          total: secondProduct.price * 1.5,
          items: {
            create: [
              {
                productId: secondProduct.id,
                variantId: variant2?.id,
                quantity: 1,
                price: secondProduct.price,
              },
            ],
          },
        },
      });
    }
  }
  // Content pages (used here as simple “legal docs” placeholders).
  // NOTE: ContentPage has a global uniqueness constraint on (type, locale, slug),
  // so we intentionally keep slugs tenant-prefixed.
  const legalPages = [
    {
      type: "legal",
      locale: "en",
      slug: `${tenant.slug}-terms`,
      title: "Demo Operator – Terms",
      body: "# Terms (Demo Operator)\n\nDemo legal content for evaluating tenant scoping.",
    },
    {
      type: "legal",
      locale: "en",
      slug: `${tenant.slug}-privacy`,
      title: "Demo Operator – Privacy",
      body: "# Privacy (Demo Operator)\n\nDemo privacy content for evaluating tenant scoping.",
    },
    {
      type: "legal",
      locale: "en",
      slug: `${tenant.slug}-accessibility`,
      title: "Demo Operator – Accessibility",
      body: "# Accessibility (Demo Operator)\n\nDemo accessibility content for evaluating tenant scoping.",
    },
    {
      type: "legal",
      locale: "en",
      slug: `${tenantB.slug}-terms`,
      title: "Tenant B – Terms",
      body: "# Terms (Tenant B)\n\nTenant B legal content for verifying isolation.",
    },
    {
      type: "legal",
      locale: "en",
      slug: `${tenantB.slug}-privacy`,
      title: "Tenant B – Privacy",
      body: "# Privacy (Tenant B)\n\nTenant B privacy content for verifying isolation.",
    },
    {
      type: "legal",
      locale: "en",
      slug: `${tenantB.slug}-accessibility`,
      title: "Tenant B – Accessibility",
      body: "# Accessibility (Tenant B)\n\nTenant B accessibility content for verifying isolation.",
    },
  ];

  for (const page of legalPages) {
    await prisma.contentPage.upsert({
      where: {
        type_locale_slug: {
          type: page.type,
          locale: page.locale,
          slug: page.slug,
        },
      },
      update: {
        tenantId: page.slug.startsWith(`${tenantB.slug}-`) ? tenantB.id : tenant.id,
        title: page.title,
        body: page.body,
        isPublished: true,
      },
      create: {
        tenantId: page.slug.startsWith(`${tenantB.slug}-`) ? tenantB.id : tenant.id,
        type: page.type,
        locale: page.locale,
        slug: page.slug,
        title: page.title,
        body: page.body,
        isPublished: true,
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
    tenantB: tenantB.slug,
    tenantBSanityDataset,
    tenantBStores: [tenantBStore.slug],
    previewTenant: previewTenant.slug,
    previewSanityDataset,
    previewStores: [previewStore1.slug, previewStore2.slug, previewStore3.slug],
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
