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
  const src = process.env.SANITY_SOURCE_DATASET;
  const tgt = process.env.SANITY_TARGET_DATASET;
  if (!src || !tgt) {
    console.error("Set SANITY_SOURCE_DATASET and SANITY_TARGET_DATASET in env");
    process.exit(2);
  }

  if (!process.env.SANITY_PROJECT_ID && !process.env.SANITY_STUDIO_PROJECT_ID) {
    console.error('Missing required env var: SANITY_PROJECT_ID or SANITY_STUDIO_PROJECT_ID');
    process.exit(2);
  }

  const projectId = process.env.SANITY_PROJECT_ID || process.env.SANITY_STUDIO_PROJECT_ID!;
  // source client uses preview token if provided, target needs a token with write access
  const srcClient = createClient({
    projectId,
    dataset: src,
    apiVersion: process.env.SANITY_API_VERSION || "2023-07-01",
    token: process.env.SANITY_API_TOKEN || process.env.SANITY_AUTH_TOKEN || process.env.SANITY_TOKEN,
    useCdn: false,
  });
  const tgtClient = createClient({
    projectId,
    dataset: tgt,
    apiVersion: process.env.SANITY_API_VERSION || "2023-07-01",
    token: process.env.SANITY_API_TOKEN || process.env.SANITY_AUTH_TOKEN || process.env.SANITY_TOKEN,
    useCdn: false,
  });

  console.log(`Promoting from ${src} to ${tgt}`);

  const argv = process.argv.slice(2);
  const dryRun = argv.includes("--dry-run") || argv.includes("-n");
  const force = argv.includes("--force") || argv.includes("-f");

  // Page through source dataset to avoid loading all docs into memory.
  const pageSize = 1000;
  let offset = 0;
  let fetched = 0;
  let totalProcessed = 0;
  let toCreate = 0;
  let toReplace = 0;
  let skipped = 0;

  while (true) {
    const batch = await retry(() =>
      srcClient.fetch(
        `*[] | order(_createdAt asc)[${offset}...${offset + pageSize}]`,
      ),
    );
    if (!batch || batch.length === 0) break;
    fetched += batch.length;
    console.log(
      `Fetched batch ${offset}..${offset + batch.length} (${batch.length})`,
    );

    for (const d of batch) {
      totalProcessed++;
      if (!d || !d._type) continue;
      try {
        if (!d._id) {
          // If no _id, generate a fallback id to make operation deterministic
          d._id = `${d._type}-${String(d._key || d.slug || d._createdAt || totalProcessed).replace(/[^a-zA-Z0-9-_.]/g, "-")}`;
        }

        if (dryRun) {
          // Check existence only to report
          const exists = await retry(() => tgtClient.getDocument(d._id));
          if (exists) {
            skipped++;
            if (force) toReplace++;
          } else {
            toCreate++;
          }
          continue;
        }

        if (!force) {
          const exists = await retry(() => tgtClient.getDocument(d._id));
          if (exists) {
            skipped++;
            continue;
          }
        }

        if (d._id) {
          // createOrReplace will upsert by id
          await retry(() => tgtClient.createOrReplace(d));
          if (force) toReplace++;
          else toCreate++;
        } else {
          await retry(() => tgtClient.create(d));
          toCreate++;
        }
      } catch (err) {
        console.error("failed to promote doc", d._id || d._type, err);
      }
    }

    offset += pageSize;
  }

  console.log(
    `Promotion summary: fetched=${fetched} processed=${totalProcessed} created=${toCreate} replaced=${toReplace} skipped=${skipped}`,
  );
  if (dryRun)
    console.log("Dry-run mode: no changes were written to target dataset");
}

main().catch((err) => {
  console.error("promotion failed", err);
  process.exit(1);
});
