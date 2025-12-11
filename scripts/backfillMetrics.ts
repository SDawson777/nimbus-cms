#!/usr/bin/env ts-node
/*
  Backfill contentMetricDaily and aggregate contentMetric docs from a JSON export of events.
  Usage: ts-node scripts/backfillMetrics.ts <path-to-events.json>
  Expected input: array of events like {type: 'view'|'click', contentType, contentSlug, brandSlug?, storeSlug?, timestamp}
*/
import fs from "fs";
import path from "path";
import { createWriteClient } from "../server/src/lib/cms";

async function main() {
  const p = process.argv[2];
  if (!p) {
    console.error("Usage: backfillMetrics.ts <path-to-events.json>");
    process.exit(1);
  }
  const file = path.resolve(process.cwd(), p);
  if (!fs.existsSync(file)) {
    console.error("File not found:", file);
    process.exit(1);
  }
  const raw = JSON.parse(fs.readFileSync(file, "utf8"));
  if (!Array.isArray(raw)) {
    console.error("Expected array of events");
    process.exit(1);
  }

  const client = createWriteClient();

  for (const ev of raw) {
    try {
      const type = ev.type;
      const contentType = ev.contentType;
      const contentSlug = ev.contentSlug;
      const brandPart = ev.brandSlug ? `-brand-${ev.brandSlug}` : "";
      const storePart = ev.storeSlug ? `-store-${ev.storeSlug}` : "";
      const safeSlug = String(contentSlug).replace(/[^a-zA-Z0-9-_.]/g, "-");
      const id = `contentMetric-${contentType}${brandPart}${storePart}-${safeSlug}`;

      // aggregate
      await client.createIfNotExists({
        _id: id,
        _type: "contentMetric",
        contentType,
        contentSlug,
        brandSlug: ev.brandSlug || undefined,
        storeSlug: ev.storeSlug || undefined,
        views: 0,
        clickThroughs: 0,
        lastUpdated: new Date().toISOString(),
      });
      const aggPatch = client
        .patch(id)
        .set({ lastUpdated: new Date().toISOString() });
      if (type === "view") aggPatch.inc({ views: 1 });
      else aggPatch.inc({ clickThroughs: 1 });
      await aggPatch.commit({ autoGenerateArrayKeys: true });

      // daily
      const ts = ev.timestamp ? new Date(ev.timestamp) : new Date();
      const day = ts.toISOString().slice(0, 10);
      const dailyId = `contentMetricDaily-${contentType}${brandPart}${storePart}-${day}-${safeSlug}`;
      await client.createIfNotExists({
        _id: dailyId,
        _type: "contentMetricDaily",
        date: `${day}T00:00:00Z`,
        contentType,
        contentSlug,
        brandSlug: ev.brandSlug || undefined,
        storeSlug: ev.storeSlug || undefined,
        views: 0,
        clickThroughs: 0,
      });
      const dayPatch = client.patch(dailyId).set({ date: `${day}T00:00:00Z` });
      if (type === "view") dayPatch.inc({ views: 1 });
      else dayPatch.inc({ clickThroughs: 1 });
      await dayPatch.commit({ autoGenerateArrayKeys: true });
    } catch (err) {
      console.error("failed event", err, ev);
    }
  }
  console.log("backfill complete");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
