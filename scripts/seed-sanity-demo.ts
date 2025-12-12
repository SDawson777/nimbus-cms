import sanityClient from "@sanity/client";
import { v4 as uuid } from "uuid";

const projectId =
  process.env.SANITY_PROJECT_ID ||
  process.env.SANITY_STUDIO_PROJECT_ID ||
  "ygbu28p2";
const dataset =
  process.env.SANITY_DATASET ||
  process.env.SANITY_STUDIO_DATASET ||
  "production";
const token =
  process.env.SANITY_WRITE_TOKEN ||
  process.env.SANITY_API_TOKEN ||
  process.env.SANITY_AUTH_TOKEN;

if (!token) {
  // eslint-disable-next-line no-console
  console.error(
    "Missing SANITY_WRITE_TOKEN. Set a write-enabled token in env before seeding.",
  );
  process.exit(1);
}

const client = sanityClient({
  projectId,
  dataset,
  token,
  useCdn: false,
  apiVersion: "2025-01-01",
});

async function main() {
  // Minimal, opinionated demo data for buyer demo.
  const tx = client.transaction();

  const tenantDemoId = `tenant-demo-operator`;
  const tenantCorpId = `tenant-global-corp`;
  const tenantLabsId = `tenant-nimbus-labs`;

  tx.createOrReplace({
    _id: tenantDemoId,
    _type: "tenant",
    title: "Demo Operator",
    slug: { current: "demo-operator" },
    region: "MI",
    primaryDomain: "demo.nimbus.app",
    status: "active",
  });

  tx.createOrReplace({
    _id: tenantCorpId,
    _type: "tenant",
    title: "Global Cannabis Corp",
    slug: { current: "global-corp" },
    region: "US",
    primaryDomain: "corp.nimbus.app",
    status: "active",
  });

  tx.createOrReplace({
    _id: tenantLabsId,
    _type: "tenant",
    title: "Nimbus Labs",
    slug: { current: "nimbus-labs" },
    region: "US",
    primaryDomain: "labs.nimbus.app",
    status: "sandbox",
  });

  // Example homepage contentPage
  tx.createOrReplace({
    _id: "page-home",
    _type: "contentPage",
    title: "Nimbus Commerce Hub",
    slug: { current: "home" },
    heroTitle: "Your Cannabis Commerce OS",
    heroSubtitle:
      "Multi-store, AI-assisted operations and compliant content in one place.",
    layout: [
      {
        _key: uuid(),
        _type: "section",
        kind: "featureRow",
        heading: "Operational Intelligence",
        body: [
          {
            _key: uuid(),
            _type: "block",
            style: "normal",
            children: [
              {
                _key: uuid(),
                _type: "span",
                text: "See stores, content, and analytics in a single pane of glass.",
              },
            ],
          },
        ],
      },
    ],
    tenant: { _type: "reference", _ref: tenantDemoId },
  });

  // Example FAQ
  tx.createOrReplace({
    _id: "faq-age-verification",
    _type: "faq",
    question: "How does age verification work?",
    answer: [
      {
        _key: uuid(),
        _type: "block",
        style: "normal",
        children: [
          {
            _key: uuid(),
            _type: "span",
            text: "The Nimbus mobile app enforces a 21+ gate with configurable flows per market.",
          },
        ],
      },
    ],
    category: "Compliance",
    tenant: { _type: "reference", _ref: tenantDemoId },
  });

  // Example Legal docs
  tx.createOrReplace({
    _id: "legal-terms-v1",
    _type: "legalDocument",
    title: "Terms & Conditions",
    slug: { current: "terms" },
    version: "1.0.0",
    type: "terms",
    body: [
      {
        _key: uuid(),
        _type: "block",
        style: "normal",
        children: [
          {
            _key: uuid(),
            _type: "span",
            text: "These demo terms illustrate how legal documents are versioned and scoped by tenant.",
          },
        ],
      },
    ],
    tenant: { _type: "reference", _ref: tenantDemoId },
  });

  // Example Deal
  tx.createOrReplace({
    _id: "deal-demo-bogo-flower",
    _type: "deal",
    title: "BOGO 50% Off — Nimbus Flower",
    slug: { current: "bogo-flower" },
    description: "Buy one, get the second 50% off on select Nimbus OG strains.",
    badge: "High Intent",
    priority: 10,
    startsAt: new Date().toISOString(),
    endsAt: null,
    tenant: { _type: "reference", _ref: tenantDemoId },
  });

  // Example Editorial article
  tx.createOrReplace({
    _id: "article-getting-started-nimbus",
    _type: "article",
    title: "Getting Started with Nimbus Cannabis OS",
    slug: { current: "getting-started-nimbus" },
    tenant: { _type: "reference", _ref: tenantDemoId },
    body: [
      {
        _key: uuid(),
        _type: "block",
        style: "h2",
        children: [
          {
            _key: uuid(),
            _type: "span",
            text: "Launch in Weeks, Not Months",
          },
        ],
      },
      {
        _key: uuid(),
        _type: "block",
        style: "normal",
        children: [
          {
            _key: uuid(),
            _type: "span",
            text: "Connect your POS, configure your stores, and publish your first campaign in under 21 days.",
          },
        ],
      },
    ],
  });

  await tx.commit();
  // eslint-disable-next-line no-console
  console.log("✔ Seeded Sanity demo content for Nimbus Studio");
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
