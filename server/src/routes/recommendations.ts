import { Router, Request, Response } from "express";
import { z } from "zod";
import { fetchCMS } from "../lib/cms";
import { logger } from "../lib/logger";

export const recommendationsRouter = Router();

// Weather condition to product category/tag mapping
const WEATHER_PRODUCT_MAP: Record<
  string,
  { tags: string[]; categories: string[]; description: string }
> = {
  sunny: {
    tags: ["energizing", "uplifting", "daytime", "sativa"],
    categories: ["Flower", "PreRoll", "Vape"],
    description: "Energizing strains perfect for sunny days",
  },
  clear: {
    tags: ["energizing", "uplifting", "daytime", "sativa"],
    categories: ["Flower", "PreRoll", "Vape"],
    description: "Uplifting products for clear skies",
  },
  cloudy: {
    tags: ["balanced", "hybrid", "relaxing"],
    categories: ["Flower", "Edibles", "Tincture"],
    description: "Balanced hybrids for mellower moods",
  },
  rainy: {
    tags: ["relaxing", "calming", "indica", "cozy"],
    categories: ["Edibles", "Tincture", "Flower"],
    description: "Relaxing products for rainy day comfort",
  },
  snow: {
    tags: ["warming", "relaxing", "indica", "cozy"],
    categories: ["Edibles", "Tincture", "Concentrate"],
    description: "Warming products for cold weather",
  },
  storm: {
    tags: ["relaxing", "calming", "stress-relief", "indica"],
    categories: ["Edibles", "Tincture"],
    description: "Calming products for stormy weather",
  },
  hot: {
    tags: ["cooling", "refreshing", "light"],
    categories: ["Vape", "Tincture", "Topical"],
    description: "Refreshing options for hot days",
  },
  cold: {
    tags: ["warming", "comforting", "relaxing"],
    categories: ["Edibles", "Concentrate", "Flower"],
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

    const baseFilter =
      "_type==\"product\" && (!defined(isRecalled) || isRecalled != true)";
    const weatherFilter =
      "((defined(productType) && productType->title in $categories) || (defined(effects) && count(effects[@ in $tags]) > 0))";

    const listQuery = `*[${baseFilter} && ${weatherFilter}] | order(_updatedAt desc)[0...${params.limit}]{
      _id,
      name,
      "slug": slug.current,
      "image": image.asset->url,
      price,
      thcPercent,
      cbdPercent,
      strainType,
      "brand": brand->{name, "slug": slug.current},
      "productType": productType->{title},
      effects
    }`;

    let products = await fetchCMS<any[]>(listQuery, {
      categories: weatherMap.categories,
      tags: weatherMap.tags,
    });

    if (!products || products.length === 0) {
      logger.info(
        `No products found for weather condition: ${condition}, returning latest products`,
      );
      products = await fetchCMS<any[]>(
        `*[_type=="product" && (!defined(isRecalled) || isRecalled != true)] | order(_updatedAt desc)[0...${params.limit}]{
          _id,
          name,
          "slug": slug.current,
          "image": image.asset->url,
          price,
          thcPercent,
          cbdPercent,
          strainType,
          "brand": brand->{name, "slug": slug.current},
          "productType": productType->{title}
        }`,
        {},
      );
    }

    const formattedProducts = (products || []).map((p) => ({
      id: p._id,
      name: p.name,
      brand: p.brand?.name || p.brand?.slug || null,
      category: p.productType?.title || null,
      strainType: p.strainType || null,
      slug: p.slug,
      description: null,
      price: p.price ?? null,
      thcPercent: p.thcPercent ?? null,
      cbdPercent: p.cbdPercent ?? null,
      image: p.image || null,
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
