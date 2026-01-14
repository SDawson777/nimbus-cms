import { Router } from "express";
import { fetchCMS } from "../lib/cms";
import { evaluatePersonalization } from "../lib/personalization";
import { z } from "zod";

export const personalizationRouter = Router();

// POST /apply
personalizationRouter.post("/apply", async (req, res) => {
  try {
    const body = z
      .object({
        context: z.record(z.string(), z.unknown()).optional(),
        contentType: z.enum(["article", "deal", "productCategory"]),
        slugs: z.array(z.string()).optional(),
      })
      .parse(req.body || {});

    const ctx = body.context || {};
    const type = body.contentType;
    const slugs = body.slugs;

    // Check for demo mode
    const { shouldUseDemoData, DEMO_PERSONALIZATION_SIMULATION } = await import("../lib/demoData");
    if (shouldUseDemoData()) {
      res.set("X-Demo-Data", "true");
      return res.json(DEMO_PERSONALIZATION_SIMULATION);
    }

    let candidates: any[] = [];
    if (slugs && slugs.length) {
      // fetch by slug
      const q = `*[_type=="${type}" && slug.current in $slugs]{_id, "slug":slug.current, title, "type":"${type}", channel}`;
      candidates = (await fetchCMS<any[]>(q, { slugs })) || [];
    } else {
      // generic fetch: recent published items
      const q = `*[_type=="${type}" && (!defined(published) || published == true)] | order(publishedAt desc)[0...200]{_id, "slug":slug.current, title, "type":"${type}", channel}`;
      candidates = (await fetchCMS<any[]>(q, {})) || [];
    }

    // Map to common shape
    const mapped = candidates.map((c) => ({
      id: c._id,
      slug: (c.slug && (c.slug.current || c.slug)) || c._id,
      title: c.title || "",
      type: c.type || type,
      channel: c.channel,
      score: 0,
    }));

    const result = await evaluatePersonalization(ctx, mapped);
    res.json({ items: result });
  } catch (err) {
    // Return demo data on error
    try {
      const { DEMO_PERSONALIZATION_SIMULATION } = await import("../lib/demoData");
      res.set("X-Demo-Data", "true");
      return res.json(DEMO_PERSONALIZATION_SIMULATION);
    } catch (_e) {
      // ignore
    }
    req.log.error("personalization.apply_failed", err);
    res.status(400).json({ error: "INVALID_REQUEST" });
  }
});

