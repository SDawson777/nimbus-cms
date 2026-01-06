import { createClient } from "@sanity/client";
import { randomUUID } from "crypto";

function pickEnv(...names: string[]) {
  for (const n of names) {
    const v = process.env[n];
    if (v) return v;
  }
  return undefined;
}

function requiredEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing ${name}`);
  return v;
}

function key() {
  return randomUUID();
}

function ptParagraph(text: string) {
  return {
    _key: key(),
    _type: "block",
    style: "normal",
    markDefs: [],
    children: [{ _key: key(), _type: "span", text }],
  };
}

function ptHeading(text: string) {
  return {
    _key: key(),
    _type: "block",
    style: "h2",
    markDefs: [],
    children: [{ _key: key(), _type: "span", text }],
  };
}

const projectId = pickEnv("SANITY_PROJECT_ID", "SANITY_STUDIO_PROJECT_ID");
const dataset =
  pickEnv("SANITY_DATASET", "SANITY_STUDIO_DATASET") || "nimbus_demo";
const token = pickEnv(
  "SANITY_WRITE_TOKEN",
  "SANITY_API_TOKEN",
  "SANITY_AUTH_TOKEN",
  "SANITY_TOKEN",
);

if (!projectId) {
  // eslint-disable-next-line no-console
  console.error(
    "Missing SANITY_PROJECT_ID (or SANITY_STUDIO_PROJECT_ID). Set it before seeding.",
  );
  process.exit(1);
}
if (!token) {
  // eslint-disable-next-line no-console
  console.error(
    "Missing SANITY_API_TOKEN (or SANITY_WRITE_TOKEN). Set a write-enabled token before seeding.",
  );
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset,
  token,
  useCdn: false,
  apiVersion: process.env.SANITY_API_VERSION || "2025-01-01",
});

async function main() {
  const tx = client.transaction();

  // Canonical demo stack documents (Studio schema)
  const orgId = "org-nimbus-demo";
  const brandId = "brand-nimbus-demo";
  const store1Id = "store-nimbus-demo-downtown";
  const store2Id = "store-nimbus-demo-eastside";

  tx.createOrReplace({
    _id: orgId,
    _type: "organization",
    name: "Nimbus Demo Organization",
    slug: { current: "nimbus-demo" },
    primaryContact: "Demo Operator",
    notes: "Demo org seeded by scripts/seed-sanity-demo.ts",
  });

  tx.createOrReplace({
    _id: brandId,
    _type: "brand",
    name: "Nimbus Demo Brand",
    slug: { current: "nimbus-demo" },
    organization: { _type: "reference", _ref: orgId },
    primaryColor: "#00A86B",
    secondaryColor: "#FFC20A",
    notes: "Demo brand seeded by scripts/seed-sanity-demo.ts",
  });

  tx.createOrReplace({
    _id: store1Id,
    _type: "store",
    name: "Downtown Detroit (Demo)",
    slug: { current: "downtown-detroit" },
    brand: { _type: "reference", _ref: brandId },
    address: "123 Demo Ave",
    city: "Detroit",
    stateCode: "MI",
    zip: "48201",
    phone: "+1-555-0100",
    isActive: true,
  });

  tx.createOrReplace({
    _id: store2Id,
    _type: "store",
    name: "Eastside (Demo)",
    slug: { current: "eastside" },
    brand: { _type: "reference", _ref: brandId },
    address: "456 Demo Blvd",
    city: "Detroit",
    stateCode: "MI",
    zip: "48202",
    phone: "+1-555-0101",
    isActive: true,
  });

  // Brand-level theme
  tx.createOrReplace({
    _id: "themeConfig-brand-nimbus-demo",
    _type: "themeConfig",
    brand: { _type: "reference", _ref: brandId },
    primaryColor: "#00A86B",
    secondaryColor: "#FFC20A",
    accentColor: "#3F7AFC",
    backgroundColor: "#FFFFFF",
    surfaceColor: "#F8FAFC",
    textColor: "#111827",
    mutedTextColor: "#6B7280",
    darkModeEnabled: false,
    cornerRadius: "8px",
    elevationStyle: "flat",
    logoUrl: "https://placehold.co/256x256/png?text=Nimbus%20Demo",
  });

  // Deals
  tx.createOrReplace({
    _id: "deal-demo-bogo-flower",
    _type: "deal",
    title: "BOGO 50% Off — Demo Flower",
    slug: { current: "bogo-flower" },
    description: [
      ptParagraph(
        "Buy one, get the second 50% off on select demo flower items.",
      ),
    ],
    startDate: new Date().toISOString(),
    endDate: null,
    tags: ["promo", "high-intent"],
    reason: "Drive trial + basket size",
    channels: ["mobile", "web"],
    schedule: { isScheduled: false },
    brand: { _type: "reference", _ref: brandId },
    stores: [
      { _type: "reference", _ref: store1Id },
      { _type: "reference", _ref: store2Id },
    ],
  });

  // Articles
  tx.createOrReplace({
    _id: "article-getting-started-nimbus",
    _type: "article",
    title: "Getting Started with Nimbus Cannabis OS (Demo)",
    slug: { current: "getting-started" },
    excerpt:
      "A quick overview of the demo stack and how the pieces fit together.",
    body: [
      ptHeading("Launch in Weeks, Not Months"),
      ptParagraph(
        "This is seeded demo content to showcase Articles, Deals, FAQs, and Legal docs in the Studio.",
      ),
      ptHeading("One Canonical Demo Environment"),
      ptParagraph(
        "Admin points at the Demo API, which points at the Demo DB and the nimbus_demo Sanity dataset.",
      ),
    ],
    publishedAt: new Date().toISOString(),
    readingTime: "3 min",
    tags: ["demo", "onboarding"],
    channels: ["mobile", "web"],
    schedule: { isScheduled: false },
    brand: { _type: "reference", _ref: brandId },
    stores: [{ _type: "reference", _ref: store1Id }],
    published: true,
  });

  // FAQs
  tx.createOrReplace({
    _id: "faq-age-verification",
    _type: "faqItem",
    question: "How does age verification work?",
    answer: [
      ptParagraph(
        "Nimbus enforces a 21+ gate with configurable flows per market (demo content).",
      ),
    ],
    brand: { _type: "reference", _ref: brandId },
    stores: [{ _type: "reference", _ref: store1Id }],
    channels: ["mobile", "web"],
  });

  // Legal docs
  const now = new Date().toISOString();
  tx.createOrReplace({
    _id: "tos-demo",
    _type: "legalDoc",
    title: "SAMPLE TEMPLATE – REPLACE: Terms of Service",
    slug: { current: "terms" },
    type: "terms",
    version: "0.0-demo",
    effectiveFrom: now,
    notes: "Seeded demo legal content. Replace before production use.",
    body: [
      ptParagraph(
        "This is placeholder demo legal content. Replace with counsel-approved Terms of Service before production use.",
      ),
    ],
    brand: { _type: "reference", _ref: brandId },
    stores: [{ _type: "reference", _ref: store1Id }],
    channels: ["mobile", "web"],
  });

  tx.createOrReplace({
    _id: "privacy-demo",
    _type: "legalDoc",
    title: "SAMPLE TEMPLATE – REPLACE: Privacy Policy",
    slug: { current: "privacy" },
    type: "privacy",
    version: "0.0-demo",
    effectiveFrom: now,
    notes: "Seeded demo legal content. Replace before production use.",
    body: [
      ptParagraph(
        "This is placeholder demo legal content. Replace with your real Privacy Policy before production use.",
      ),
    ],
    brand: { _type: "reference", _ref: brandId },
    stores: [{ _type: "reference", _ref: store1Id }],
    channels: ["mobile", "web"],
  });

  await tx.commit();
  // eslint-disable-next-line no-console
  console.log(
    `✔ Seeded Sanity demo content (dataset=${dataset}, projectId=${projectId})`,
  );
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
