import { Router } from "express";
import { fetchCMS } from "../lib/cms";
import { evaluatePersonalization } from "../lib/personalization";
import { z } from "zod";
import getPrisma from "../lib/prisma";
import { logger } from "../lib/logger";

export const personalizationRouter = Router();

/**
 * GET /personalization/home
 * "For You Today" personalized feed for mobile app
 * Returns greeting, message, and product recommendations
 */
personalizationRouter.get("/home", async (req, res) => {
  try {
    const schema = z.object({
      recommendations: z.coerce.boolean().default(true),
      userId: z.string().optional(),
      storeId: z.string().optional(),
      limit: z.coerce.number().min(1).max(20).default(4),
    });

    const params = schema.parse(req.query);

    // Generate personalized greeting based on time of day
    const hour = new Date().getHours();
    let greeting = "Good morning";
    if (hour >= 12 && hour < 17) greeting = "Good afternoon";
    else if (hour >= 17) greeting = "Good evening";

    const message = "Here are some products picked just for you";

    // Fetch recommendations if requested
    let recommendations: any[] = [];
    if (params.recommendations) {
      const prisma = getPrisma();

      // Get popular products or user-specific recommendations
      const products = await prisma.product.findMany({
        where: {
          isActive: true,
        },
        take: params.limit,
        orderBy: {
          purchasesLast30d: "desc",
        },
        select: {
          id: true,
          name: true,
          brand: true,
          category: true,
          strainType: true,
          slug: true,
          description: true,
          defaultPrice: true,
          thcPercent: true,
          cbdPercent: true,
          imageUrl: true,
        },
      });

      recommendations = products.map((p) => ({
        id: p.id,
        name: p.name,
        brand: p.brand,
        category: p.category,
        strainType: p.strainType,
        slug: p.slug,
        description: p.description,
        price: p.defaultPrice,
        thcPercent: p.thcPercent,
        cbdPercent: p.cbdPercent,
        image: p.imageUrl,
      }));
    }

    res.json({
      greeting,
      message,
      recommendations,
    });
  } catch (error: any) {
    logger.error("personalization.home.error", error);
    // Return friendly fallback response
    res.json({
      greeting: "Welcome back",
      message: "Explore our featured products",
      recommendations: [],
    });
  }
});

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

