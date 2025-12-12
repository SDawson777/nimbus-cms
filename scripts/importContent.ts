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
  if (!process.env.SANITY_PROJECT_ID && !process.env.SANITY_STUDIO_PROJECT_ID) {
    console.error(
      "Missing required env var: SANITY_PROJECT_ID or SANITY_STUDIO_PROJECT_ID",
    );
    process.exit(2);
  }
  if (!process.env.SANITY_DATASET && !process.env.SANITY_STUDIO_DATASET) {
    console.error(
      "Missing required env var: SANITY_DATASET or SANITY_STUDIO_DATASET",
    );
    process.exit(2);
  }

  const argv = process.argv.slice(2);
  if (argv.length === 0) {
    console.error(
      "Usage: importContent.ts <path-to-export.json> [--dry-run] [--force]",
    );
    process.exit(2);
  }
  const filePath = path.resolve(process.cwd(), argv[0]);
  if (!fs.existsSync(filePath)) {
    console.error("File not found:", filePath);
    process.exit(2);
  }

  const raw = fs.readFileSync(filePath, "utf-8");
  const parsed = JSON.parse(raw);
  const results = parsed.results || parsed;

  const client = createClient({
    projectId:
      process.env.SANITY_PROJECT_ID || process.env.SANITY_STUDIO_PROJECT_ID!,
    dataset: process.env.SANITY_DATASET || process.env.SANITY_STUDIO_DATASET!,
    apiVersion: process.env.SANITY_API_VERSION || "2023-07-01",
    token:
      process.env.SANITY_API_TOKEN ||
      process.env.SANITY_AUTH_TOKEN ||
      process.env.SANITY_TOKEN,
    useCdn: false,
  });

  const dryRun = argv.includes("--dry-run") || argv.includes("-n");
  const force = argv.includes("--force") || argv.includes("-f");

  // Iterate types and upsert docs
  for (const key of Object.keys(results)) {
    if (key === "__others") continue;
    const docs = results[key] || [];
    console.log(`Importing ${docs.length} docs for type ${key}`);
    for (const doc of docs) {
      try {
        // Favor existing _id. If not present but slug.current exists, generate an id to keep idempotency
        let id = doc._id;
        if (!id) {
          const slug =
            (doc.slug && (doc.slug.current || doc.slug)) ||
            doc.contentSlug ||
            doc._key ||
            undefined;
          if (slug)
            id = `${doc._type || key}-${String(slug).replace(/[^a-zA-Z0-9-_.]/g, "-")}`;
        }

        if (dryRun) {
          // Report what would happen
          if (id) {
            const exists = await retry(() => client.getDocument(id));
            if (exists && !force) console.log("[dry-run] skip existing", id);
            else if (exists && force)
              console.log("[dry-run] would replace", id);
            else console.log("[dry-run] would create", id);
          } else {
            console.log("[dry-run] would create new (no id) for", doc._type);
          }
          continue;
        }

        if (id) {
          if (!force) {
            const exists = await retry(() => client.getDocument(id));
            if (exists) {
              // skip unless forced
              continue;
            }
          }
          await retry(() => client.createOrReplace({ ...doc, _id: id }));
        } else {
          await retry(() => client.create(doc));
        }
      } catch (err) {
        console.error("failed to import doc", doc._id || doc.slug || "", err);
      }
    }
  }

  console.log("Import complete");
}

main().catch((err) => {
  console.error("import failed", err);
  process.exit(1);
});
