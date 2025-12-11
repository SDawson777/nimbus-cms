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
