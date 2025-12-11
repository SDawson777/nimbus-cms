import { PrismaClient } from "@prisma/client";
import { ADMIN_SEED_ENABLED, APP_ENV, DEMO_TENANT_SLUG } from "./config/env";

const prisma = new PrismaClient();

/**
 * Seeds control-plane data based on APP_ENV and ADMIN_SEED_ENABLED.
 *
 * - demo: creates a "demo-operator" tenant with a couple of stores,
 *   a default theme, and feature flags set.
 * - preview: creates a "preview-operator" tenant with minimal data.
 * - prod: does nothing.
 */
export async function seedControlPlane() {
  if (!ADMIN_SEED_ENABLED) return;
  const tenantSlug =
    DEMO_TENANT_SLUG ||
    (APP_ENV === "demo" ? "demo-operator" : "preview-operator");
  const existing = await prisma.tenant.findUnique({
    where: { slug: tenantSlug },
  });
  if (existing) return;

  const tenant = await prisma.tenant.create({
    data: {
      slug: tenantSlug,
      name: APP_ENV === "demo" ? "Demo Operator" : "Preview Operator",
      status: "active",
      sanityDataset: APP_ENV === "demo" ? "nimbus_demo" : "nimbus_preview",
      region: "US-MI",
    },
  });

  await prisma.store.createMany({
    data: [
      {
        tenantId: tenant.id,
        slug: "downtown-detroit",
        name: "Downtown Detroit",
        timezone: "America/Detroit",
      },
      {
        tenantId: tenant.id,
        slug: "eastside",
        name: "Eastside",
        timezone: "America/Detroit",
      },
    ],
  });

  await prisma.theme.create({
    data: {
      tenantId: tenant.id,
      name: "Default",
      isDefault: true,
      configJson: {
        palette: {
          primary: "#00A86B",
          secondary: "#FFC20A",
          background: "#FFFFFF",
        },
      },
    },
  });

  await prisma.featureFlag.createMany({
    data: [
      {
        tenantId: tenant.id,
        key: "ai_concierge",
        valueJson: { enabled: true },
      },
      {
        tenantId: tenant.id,
        key: "journal_enabled",
        valueJson: { enabled: true },
      },
    ],
  });

  console.log(
    `[seedControlPlane] Seeded tenant ${tenantSlug} for ${APP_ENV} environment`,
  );
}
