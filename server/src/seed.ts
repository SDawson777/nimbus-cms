import crypto from "crypto";
import { ADMIN_SEED_ENABLED, APP_ENV, DEMO_TENANT_SLUG } from "./config/env";
import { getPrisma } from "./lib/prisma";

/**
 * Seeds control-plane data based on APP_ENV and ADMIN_SEED_ENABLED.
 *
 * Note: The primary seeding is now done in init_and_start.sh before the server starts.
 * This function serves as a fallback for local development or if init script seeding fails.
 *
 * - demo: creates a "demo-operator" tenant with a couple of stores,
 *   a default theme, and feature flags set.
 * - preview: creates a "preview-operator" tenant with minimal data.
 * - prod: does nothing.
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
    console.log(`[seedControlPlane] Creating tenant ${tenantSlug}...`);

  const tenant = await prisma.tenant.create({
    data: {
      id: crypto.randomUUID(),
      slug: tenantSlug,
      name: APP_ENV === "demo" ? "Demo Operator" : "Preview Operator",
      status: "active",
      sanityDataset: APP_ENV === "demo" ? "nimbus_demo" : "nimbus_preview",
      region: "US-MI",
      updatedAt: new Date(),
    },
  });

  await prisma.store.createMany({
    data: [
      {
        id: crypto.randomUUID(),
        tenantId: tenant.id,
        slug: "downtown-detroit",
        name: "Downtown Detroit",
        timezone: "America/Detroit",
        updatedAt: new Date(),
      },
      {
        id: crypto.randomUUID(),
        tenantId: tenant.id,
        slug: "eastside",
        name: "Eastside",
        timezone: "America/Detroit",
        updatedAt: new Date(),
      },
    ],
  });

  await prisma.theme.create({
    data: {
      id: crypto.randomUUID(),
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
      updatedAt: new Date(),
    },
  });

  await prisma.featureFlag.createMany({
    data: [
      {
        id: crypto.randomUUID(),
        tenantId: tenant.id,
        key: "ai_concierge",
        valueJson: { enabled: true },
        updatedAt: new Date(),
      },
      {
        id: crypto.randomUUID(),
        tenantId: tenant.id,
        key: "journal_enabled",
        valueJson: { enabled: true },
        updatedAt: new Date(),
      },
    ],
  });

  console.log(
    `[seedControlPlane] Seeded tenant ${tenantSlug} for ${APP_ENV} environment`,
  );
  } catch (err) {
    console.error("[seedControlPlane] Error during seeding:", err);
    throw err;
  }
}
