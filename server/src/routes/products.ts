import { Router, Request, Response } from "express";
import { z } from "zod";
import getPrisma from "../lib/prisma";
import { fetchCMS } from "../lib/cms";
import { logger } from "../lib/logger";

export const productsRouter = Router();

// Fallback products for when database is not populated
const FALLBACK_PRODUCTS = [
  {
    id: "fallback-1",
    name: "Blue Dream",
    brand: "House Brand",
    category: "flower",
    strainType: "hybrid",
    slug: "blue-dream",
    description: "A balanced hybrid strain with berry aroma",
    price: 45.0,
    thcPercent: 18.5,
    cbdPercent: 0.5,
    stock: 10,
  },
  {
    id: "fallback-2",
    name: "OG Kush",
    brand: "Premium",
    category: "flower",
    strainType: "indica",
    slug: "og-kush",
    description: "Classic indica strain",
    price: 50.0,
    thcPercent: 22.0,
    cbdPercent: 0.3,
    stock: 8,
  },
];

/**
 * GET /products
 * Public endpoint for mobile app to fetch product catalog
 * Supports filtering, pagination, and sorting
 */
productsRouter.get("/", async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      storeId: z.string().optional(),
      page: z.coerce.number().min(1).default(1),
      limit: z.coerce.number().min(1).max(50).default(24),
      q: z.string().trim().optional(),
      brand: z.union([z.string(), z.array(z.string())]).optional(),
      category: z.string().optional(),
      strain: z.string().optional(),
      priceMin: z.coerce.number().optional(),
      priceMax: z.coerce.number().optional(),
      thcMin: z.coerce.number().optional(),
      thcMax: z.coerce.number().optional(),
      inStock: z.coerce.boolean().optional(),
      sort: z
        .enum(["price_asc", "price_desc", "popular", "name_asc", "name_desc"])
        .optional(),
    });

    const params = schema.parse(req.query);
    const skip = (params.page - 1) * params.limit;

    const prisma = getPrisma();

    // Build where clause
    const where: any = {
      isActive: true,
    };

    if (params.q) {
      where.OR = [
        { name: { contains: params.q, mode: "insensitive" } },
        { brand: { contains: params.q, mode: "insensitive" } },
      ];
    }

    if (params.brand) {
      const brands = Array.isArray(params.brand) ? params.brand : [params.brand];
      where.brand = { in: brands };
    }

    if (params.category) {
      where.category = params.category;
    }

    if (params.strain) {
      where.strainType = params.strain;
    }

    if (params.priceMin !== undefined || params.priceMax !== undefined) {
      where.defaultPrice = {};
      if (params.priceMin !== undefined) where.defaultPrice.gte = params.priceMin;
      if (params.priceMax !== undefined) where.defaultPrice.lte = params.priceMax;
    }

    if (params.thcMin !== undefined || params.thcMax !== undefined) {
      where.thcPercent = {};
      if (params.thcMin !== undefined) where.thcPercent.gte = params.thcMin;
      if (params.thcMax !== undefined) where.thcPercent.lte = params.thcMax;
    }

    // Build order by
    let orderBy: any = { createdAt: "desc" };
    if (params.sort === "price_asc") orderBy = { defaultPrice: "asc" };
    else if (params.sort === "price_desc") orderBy = { defaultPrice: "desc" };
    else if (params.sort === "name_asc") orderBy = { name: "asc" };
    else if (params.sort === "name_desc") orderBy = { name: "desc" };
    else if (params.sort === "popular") orderBy = { purchasesLast30d: "desc" };

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: params.limit,
        include: {
          ProductVariant: {
            where: { active: true },
            take: 1,
          },
        },
      }),
    ]);

    // If no products found, return fallback data for demo
    if (total === 0) {
      logger.info("No products in database, returning fallback data");
      return res.json({
        products: FALLBACK_PRODUCTS,
        page: params.page,
        limit: params.limit,
        total: FALLBACK_PRODUCTS.length,
        totalPages: 1,
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
      stock: 10, // Default stock for now
    }));

    res.json({
      products: formattedProducts,
      page: params.page,
      limit: params.limit,
      total,
      totalPages: Math.ceil(total / params.limit),
    });
  } catch (error: any) {
    logger.error("products.list.error", error);
    // Return fallback on error
    res.json({
      products: FALLBACK_PRODUCTS,
      page: 1,
      limit: 24,
      total: FALLBACK_PRODUCTS.length,
      totalPages: 1,
    });
  }
});

/**
 * GET /products/:id
 * Fetch single product with variants and inventory details
 */
productsRouter.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { storeId } = req.query;

    const prisma = getPrisma();
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        ProductVariant: {
          where: { active: true },
        },
      },
    });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Get store-specific inventory if storeId provided
    let storeProducts: any[] = [];
    if (storeId && typeof storeId === "string") {
      storeProducts = await prisma.storeProduct.findMany({
        where: {
          storeId,
          productId: id,
          active: true,
        },
        include: {
          ProductVariant: true,
        },
      });
    }

    const variants = product.ProductVariant.map((v: any) => {
      const sp = storeProducts.find((x) => x.variantId === v.id);
      return {
        id: v.id,
        name: v.name,
        price: sp?.price ?? v.price ?? product.defaultPrice,
        stock: sp?.stock ?? 0,
        thcPercent: v.thcPercent ?? product.thcPercent,
        cbdPercent: v.cbdPercent ?? product.cbdPercent,
        sku: v.sku,
      };
    });

    res.json({
      id: product.id,
      name: product.name,
      brand: product.brand,
      category: product.category,
      strainType: product.strainType,
      slug: product.slug,
      description: product.description,
      price: product.defaultPrice,
      thcPercent: product.thcPercent,
      cbdPercent: product.cbdPercent,
      image: product.imageUrl,
      variants: variants.length > 0 ? variants : undefined,
    });
  } catch (error: any) {
    logger.error("products.detail.error", error);
    res.status(500).json({ error: "Failed to fetch product" });
  }
});
