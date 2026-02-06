import { Router, Request, Response } from "express";
import { z } from "zod";
import { fetchCMS } from "../lib/cms";
import { logger } from "../lib/logger";

export const mobileContentRouter = Router();

/**
 * GET /content/faq
 * Mobile app FAQ content
 */
mobileContentRouter.get("/faq", async (req: Request, res: Response) => {
  try {
    const faqs = await fetchCMS<any[]>(
      `*[_type=="faqItem"] | order(order asc){
        _id,
        question,
        answer,
        "category": category->{name, "slug": slug.current},
        order,
        _updatedAt
      }`,
      {},
    );

    const grouped: Record<string, any[]> = {};
    (faqs || []).forEach((faq: any) => {
      const cat = faq.category?.name || "General";
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push({
        id: faq._id,
        question: faq.question,
        answer: faq.answer,
        category: cat,
        lastUpdated: faq._updatedAt,
      });
    });

    const categories = Object.keys(grouped);
    const flatFaqs = categories.flatMap((cat) => grouped[cat]);

    res.json({
      faqs: flatFaqs,
      categories,
      lastSync: new Date(),
      source: "sanity",
    });

  } catch (error: any) {
    logger.error("content.faq.error", error);
    res.status(500).json({
      error: 'Failed to fetch FAQ',
      details: 'Content service temporarily unavailable'
    });
  }
});

/**
 * GET /content/:type/:slug
 * Get specific content page
 */
mobileContentRouter.get("/:type/:slug", async (req: Request, res: Response) => {
  try {
    const { type, slug } = req.params;
    const doc = await fetchCMS<any>(
      `*[_type==$type && slug.current==$slug][0]{
        _id,
        _type,
        title,
        name,
        body,
        content,
        description,
        _updatedAt,
        _createdAt
      }`,
      { type, slug },
    );

    if (!doc) {
      return res.status(404).json({
        error: "Content not found",
      });
    }

    const body = doc.body ?? doc.content ?? doc.description ?? null;
    const title = doc.title ?? doc.name ?? slug;

    res.json({
      id: doc._id,
      type: doc._type,
      title,
      body,
      lastUpdated: doc._updatedAt,
      created: doc._createdAt,
    });

  } catch (error: any) {
    logger.error("content.page.error", error);
    res.status(500).json({
      error: 'Failed to fetch content'
    });
  }
});
/**
 * GET /mobile/content/products
 * Mobile-optimized products endpoint
 * Returns simple structure without pagination (compatible with mobile app hooks)
 */
mobileContentRouter.get("/products", async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      storeId: z.string().optional(),
      category: z.string().optional(),
      limit: z.coerce.number().min(1).max(50).default(20),
      q: z.string().trim().optional()
    });

    const params = schema.parse(req.query);
    const filterParts: string[] = [];
    const queryParams: Record<string, unknown> = {};

    if (params.q) {
      filterParts.push("(name match $q || brand->name match $q)");
      queryParams.q = `*${params.q}*`;
    }

    if (params.category) {
      filterParts.push("productType->title match $category");
      queryParams.category = params.category;
    }

    const filterSuffix = filterParts.length
      ? ` && ${filterParts.join(" && ")}`
      : "";

    const products = await fetchCMS<any[]>(
      `*[_type=="product"${filterSuffix}] | order(_updatedAt desc)[0...${params.limit}]{
        _id,
        name,
        "slug": slug.current,
        "image": image.asset->url,
        price,
        thcPercent,
        cbdPercent,
        strainType,
        availability,
        inStock,
        "brand": brand->{name, "slug": slug.current},
        "productType": productType->{title}
      }`,
      queryParams,
    );

    const mobileProducts = (products || []).map((p) => {
      const availability = String(p.availability || "").toLowerCase();
      const isInStock =
        p.inStock === true ||
        availability === "in-stock" ||
        availability === "available";

      return {
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
        stock: isInStock ? 1 : 0,
      };
    });

    // Return simple structure that mobile app expects
    res.json({
      products: mobileProducts,
    });

  } catch (error: any) {
    logger.error("mobile.products.error", error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid request parameters',
        details: error.issues
      });
    }
    
    res.status(500).json({
      error: 'Failed to fetch products'
    });
  }
});
/**
 * GET /content/pages
 * List all content pages by type
 */
mobileContentRouter.get("/pages", async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      type: z.string().optional(),
      limit: z.coerce.number().min(1).max(50).default(20)
    });

    const params = schema.parse(req.query);
    const types = params.type
      ? [params.type]
      : ["accessibilityPage", "legalDoc", "transparencyPage", "awardsExplainer"];

    const pages = await fetchCMS<any[]>(
      `*[_type in $types] | order(_updatedAt desc)[0...${params.limit}]{
        _id,
        _type,
        title,
        name,
        "slug": slug.current,
        _updatedAt,
        _createdAt
      }`,
      { types },
    );

    const formattedPages = (pages || []).map((page) => ({
      id: page._id,
      type: page._type,
      title: page.title || page.name || null,
      slug: page.slug || null,
      updatedAt: page._updatedAt,
      createdAt: page._createdAt,
    }));

    res.json({
      pages: formattedPages,
      total: formattedPages.length,
    });

  } catch (error: any) {
    logger.error("content.pages.error", error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid request parameters',
        details: error.issues
      });
    }
    
    res.status(500).json({
      error: 'Failed to fetch content pages'
    });
  }
});