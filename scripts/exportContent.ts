import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { createClient } from "@sanity/client";

dotenv.config();

function ensureEnv(name: string) {
  if (!process.env[name]) {
    console.error(`Missing required env var: ${name}`);
    process.exit(2);
  }
}

async function retry<T>(fn: () => Promise<T>, attempts = 3, delay = 500) {
  let lastErr: any;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      if (i < attempts - 1)
        await new Promise((r) => setTimeout(r, delay * (i + 1)));
    }
  }
  throw lastErr;
}

async function main() {
  // Accept either SANITY_PROJECT_ID or SANITY_STUDIO_PROJECT_ID (Studio-specific)
  if (!process.env.SANITY_PROJECT_ID && !process.env.SANITY_STUDIO_PROJECT_ID) {
    console.error('Missing required env var: SANITY_PROJECT_ID or SANITY_STUDIO_PROJECT_ID');
    process.exit(2);
  }
  if (!process.env.SANITY_DATASET && !process.env.SANITY_STUDIO_DATASET) {
    console.error('Missing required env var: SANITY_DATASET or SANITY_STUDIO_DATASET');
    process.exit(2);
  }

  const outDir = path.join(process.cwd(), "backups");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const outFile = path.join(outDir, `export-${date}.json`);

  const client = createClient({
    projectId: process.env.SANITY_PROJECT_ID || process.env.SANITY_STUDIO_PROJECT_ID!,
    dataset: process.env.SANITY_DATASET || process.env.SANITY_STUDIO_DATASET!,
    apiVersion: process.env.SANITY_API_VERSION || "2023-07-01",
    token:
      process.env.SANITY_API_TOKEN || process.env.SANITY_AUTH_TOKEN || process.env.SANITY_TOKEN,
    useCdn: false,
  });

  // Types we consider relevant for export
  const types = [
    "organization",
    "brand",
    "store",
    "themeConfig",
    "legalDoc",
    "article",
    "faqItem",
    "deal",
    "product",
    "contentMetric",
    "personalizationRule",
  ];

  console.log("Exporting types:", types.join(", "));

  const results: Record<string, any[]> = {};
  const pageSize = 1000;

  for (const t of types) {
    console.log("Querying", t);
    try {
      const rows: any[] = [];
      let offset = 0;
      while (true) {
        const q = `*[_type == "${t}"] | order(_createdAt asc)[${offset}...${offset + pageSize}]`;
        const batch = await retry(() => client.fetch(q));
        if (!batch || batch.length === 0) break;
        rows.push(...batch);
        console.log(
          `  fetched batch ${offset}..${offset + batch.length} (${batch.length})`,
        );
        offset += pageSize;
      }
      results[t] = rows;
      console.log(`  fetched total ${rows.length} ${t}`);
    } catch (err) {
      console.error("failed to fetch", t, err);
      results[t] = [];
    }
  }

  // Also export any other top-level docs (safety)
  try {
    const others = await retry(() =>
      client.fetch("*[!(_type in $types)]", { types }),
    );
    results.__others = others || [];
  } catch (err) {
    console.warn("failed to fetch other docs", err);
    results.__others = [];
  }

  fs.writeFileSync(
    outFile,
    JSON.stringify({ exportedAt: new Date().toISOString(), results }, null, 2),
  );
  console.log("Wrote", outFile);
}

main().catch((err) => {
  console.error("export failed", err);
  process.exit(1);
});
