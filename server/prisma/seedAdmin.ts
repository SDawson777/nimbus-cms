import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL || "demo@nimbus.app";
  const password = process.env.ADMIN_PASSWORD || "password123";
  const role = (process.env.ADMIN_ROLE as string) || "OWNER";

  const passwordHash = await bcrypt.hash(password, 10);

  const rec = await prisma.adminUser.upsert({
    where: { email },
    update: { passwordHash, role },
    create: {
      email,
      passwordHash,
      role: role as any,
    },
  });

  console.log("Upserted AdminUser:", rec.email, "role=", rec.role);
}

main()
  .catch((e) => {
    console.error("seedAdmin failed", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
