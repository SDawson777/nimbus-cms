import { Router } from "express";
import rateLimit from "express-rate-limit";
import { logger } from "../lib/logger";
import { z } from "zod";
import { createClient } from "@sanity/client";
import crypto from "crypto";

export const analyticsRouter = Router();

const ingestKeys = (process.env.ANALYTICS_INGEST_KEY || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const ingestKeySet = new Set(ingestKeys);

const fallbackWindowMs = Number(
  process.env.ANALYTICS_FALLBACK_RATE_WINDOW_MS || 60 * 1000,
);
const fallbackMax = Number(process.env.ANALYTICS_FALLBACK_RATE_MAX || 120);
const fallbackBuckets: Map<string, { count: number; reset: number }> =
  new Map();

function allowAnalyticsRequest(key: string, req: any) {
  const ip =
    req.ip ||
    req.headers["x-forwarded-for"] ||
    req.connection?.remoteAddress ||
    "unknown";
  const bucketKey = `${key}:${ip}`;
  const now = Date.now();
  const bucket = fallbackBuckets.get(bucketKey);
  if (!bucket || now > bucket.reset) {
    fallbackBuckets.set(bucketKey, { count: 1, reset: now + fallbackWindowMs });
    return true;
  }
  if (bucket.count >= fallbackMax) return false;
  bucket.count += 1;
  return true;
}

analyticsRouter.use((req, res, next) => {
  if (!ingestKeySet.size) {
    logger.error("ANALYTICS_INGEST_KEY not configured");
    return res
      .status(503)
      .json({ error: "ANALYTICS_INGEST_KEY_NOT_CONFIGURED" });
  }
  const providedKey = String(req.header("X-Analytics-Key") || "");
  if (!providedKey || !ingestKeySet.has(providedKey)) {
    return res.status(401).json({ error: "INVALID_ANALYTICS_KEY" });
  }
  const signature = String(req.header("X-Analytics-Signature") || "");
  const rawBody: Buffer =
    (req as any).rawBody || Buffer.from(JSON.stringify(req.body || {}));
  const expectedSignature = crypto
    .createHmac("sha256", providedKey)
    .update(rawBody)
    .digest("hex");
  if (signature !== expectedSignature) {
    return res.status(401).json({ error: "INVALID_ANALYTICS_SIGNATURE" });
  }
  if (!allowAnalyticsRequest(providedKey, req)) {
    return res.status(429).json({ error: "RATE_LIMITED" });
  }
  return next();
});

// Configurable rate limiter for analytics events (protects the Sanity write endpoint)
const analyticsLimiter = rateLimit({
  windowMs: Number(process.env.ANALYTICS_RATE_LIMIT_WINDOW_MS || 60 * 1000),
  max: Number(process.env.ANALYTICS_RATE_LIMIT_MAX || 60),
  standardHeaders: true,
  legacyHeaders: false,
});

// POST /analytics/event
// Body: { type: 'view'|'click', contentType: 'article'|'faq'|'legal'|'product', contentSlug: string }
analyticsRouter.post("/event", analyticsLimiter, async (req, res) => {
  try {
    const body = z
      .object({
        type: z.enum(["view", "click"]),
        contentType: z.enum(["article", "faq", "legal", "product"]),
        contentSlug: z.string(),
        contentId: z.string().optional(),
        brandSlug: z.string().optional(),
        storeSlug: z.string().optional(),
      })
      .parse(req.body);

    const client = createClient({
      projectId: process.env.SANITY_PROJECT_ID!,
      dataset: process.env.SANITY_DATASET!,
      apiVersion: process.env.SANITY_API_VERSION || "2023-07-01",
      token: process.env.SANITY_API_TOKEN,
      useCdn: false,
    });

    // Use a deterministic _id so repeated events for the same content map to the same metric doc.
    // sanitize slug by replacing / with - for safety
    const safeSlug = String(body.contentSlug).replace(/[^a-zA-Z0-9-_.]/g, "-");
    // Use a deterministic id that includes optional brand/store so metrics are scoped safely
    const brandPart = body.brandSlug ? `-brand-${String(body.brandSlug)}` : "";
    const storePart = body.storeSlug ? `-store-${String(body.storeSlug)}` : "";
    const id = `contentMetric-${body.contentType}${brandPart}${storePart}-${safeSlug}`;

    const now = new Date().toISOString();

    // Ensure aggregate metric exists and increment
    await client.createIfNotExists({
      _id: id,
      _type: "contentMetric",
      contentType: body.contentType,
      contentSlug: body.contentSlug,
      contentId: body.contentId || undefined,
      brandSlug: body.brandSlug || undefined,
      storeSlug: body.storeSlug || undefined,
      views: 0,
      clickThroughs: 0,
      lastUpdated: now,
    });

    // Patch and increment the aggregate counter
    const patch = client.patch(id).set({ lastUpdated: now });
    if (body.type === "view") patch.inc({ views: 1 });
    else patch.inc({ clickThroughs: 1 });
    const updated = await patch.commit({ autoGenerateArrayKeys: true });

    // Also write a daily bucket metric (one doc per day) so we can compute recent trends
    const day = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const dailyId = `contentMetricDaily-${body.contentType}${brandPart}${storePart}-${day}-${safeSlug}`;
    const dayDoc = {
      _id: dailyId,
      _type: "contentMetricDaily",
      date: `${day}T00:00:00Z`,
      contentType: body.contentType,
      contentSlug: body.contentSlug,
      brandSlug: body.brandSlug || undefined,
      storeSlug: body.storeSlug || undefined,
      views: 0,
      clickThroughs: 0,
    };
    await client.createIfNotExists(dayDoc);
    const dayPatch = client.patch(dailyId).set({ date: dayDoc.date });
    if (body.type === "view") dayPatch.inc({ views: 1 });
    else dayPatch.inc({ clickThroughs: 1 });
    await dayPatch.commit({ autoGenerateArrayKeys: true });

    res.status(200).json({ ok: true, metric: updated });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res
        .status(400)
        .json({ error: "INVALID_ANALYTICS_EVENT", details: err.issues });
    }
    logger.error("analytics event failed", err);
    res.status(500).json({ error: "FAILED" });
  }
});

export default analyticsRouter;
