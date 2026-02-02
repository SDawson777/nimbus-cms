import { Router, Request, Response } from "express";
import { z } from "zod";
import getPrisma from "../lib/prisma";
import { logger } from "../lib/logger";

export const recommendationsRouter = Router();

// Weather condition to product category/tag mapping
const WEATHER_PRODUCT_MAP: Record<
  string,
  { tags: string[]; categories: string[]; description: string }
> = {
  sunny: {
    tags: ["energizing", "uplifting", "daytime", "sativa"],
    categories: ["flower", "pre-roll", "vape"],
    description: "Energizing strains perfect for sunny days",
  },
  clear: {
    tags: ["energizing", "uplifting", "daytime", "sativa"],
    categories: ["flower", "pre-roll", "vape"],
    description: "Uplifting products for clear skies",
  },
  cloudy: {
    tags: ["balanced", "hybrid", "relaxing"],
    categories: ["flower", "edible", "tincture"],
    description: "Balanced hybrids for mellower moods",
  },
  rainy: {
    tags: ["relaxing", "calming", "indica", "cozy"],
    categories: ["edible", "tincture", "flower"],
    description: "Relaxing products for rainy day comfort",
  },
  snow: {
    tags: ["warming", "relaxing", "indica", "cozy"],
    categories: ["edible", "tincture", "concentrate"],
    description: "Warming products for cold weather",
  },
  storm: {
    tags: ["relaxing", "calming", "stress-relief", "indica"],
    categories: ["edible", "tincture"],
    description: "Calming products for stormy weather",
  },
  hot: {
    tags: ["cooling", "refreshing", "light"],
    categories: ["vape", "tincture", "topical"],
    description: "Refreshing options for hot days",
  },
  cold: {
    tags: ["warming", "comforting", "relaxing"],
    categories: ["edible", "concentrate", "flower"],
    description: "Comforting products for cold weather",
  },
};

/**
 * GET /recommendations/weather
 * Weather-based product recommendations for mobile app
 * Uses current weather condition to suggest appropriate products
 */
recommendationsRouter.get("/weather", async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      condition: z.string().optional(),
      storeId: z.string().optional(),
      limit: z.coerce.number().min(1).max(20).default(6),
    });

    const params = schema.parse(req.query);
    const condition = (params.condition || "clear").toLowerCase();

    // Get weather mapping or default to clear/sunny
    const weatherMap =
      WEATHER_PRODUCT_MAP[condition] || WEATHER_PRODUCT_MAP["clear"];

    const prisma = getPrisma();

    // Build query to find matching products
    const where: any = {
      isActive: true,
    };

    // Filter by categories that match the weather
    if (weatherMap.categories.length > 0) {
      where.category = {
        in: weatherMap.categories,
      };
    }

    // Try to get products that match the weather profile
    let products = await prisma.product.findMany({
      where,
      take: params.limit,
      orderBy: {
        purchasesLast30d: "desc", // Popular products first
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

    // Fallback to any active products if weather-matched search returns nothing
    if (products.length === 0) {
      logger.info(
        `No products found for weather condition: ${condition}, returning popular products`,
      );
      products = await prisma.product.findMany({
        where: { isActive: true },
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
    }

    const formattedProducts = products.map((p) => ({
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

    res.json({
      condition,
      tags: weatherMap.tags,
      description: weatherMap.description,
      products: formattedProducts,
    });
  } catch (error: any) {
    logger.error("recommendations.weather.error", error);
    res.status(500).json({ error: "Failed to fetch weather recommendations" });
  }
});
