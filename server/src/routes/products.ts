import { Router, Request, Response } from "express";
import { z } from "zod";
import { fetchCMS } from "../lib/cms";
import { logger } from "../lib/logger";

export const productsRouter = Router();

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

    const filterParts: string[] = [];
    const queryParams: Record<string, unknown> = {};

    if (params.q) {
      filterParts.push("(name match $q || brand->name match $q)");
      queryParams.q = `*${params.q}*`;
    }

    if (params.brand) {
      const brands = Array.isArray(params.brand) ? params.brand : [params.brand];
      filterParts.push(
        "(brand->slug.current in $brands || brand->name in $brands)",
      );
      queryParams.brands = brands;
    }

    if (params.category) {
      filterParts.push("productType->title match $category");
      queryParams.category = params.category;
    }

    if (params.strain) {
      filterParts.push("defined(strainType) && strainType == $strain");
      queryParams.strain = params.strain;
    }

    if (params.priceMin !== undefined) {
      filterParts.push("defined(price) && price >= $priceMin");
      queryParams.priceMin = params.priceMin;
    }

    if (params.priceMax !== undefined) {
      filterParts.push("defined(price) && price <= $priceMax");
      queryParams.priceMax = params.priceMax;
    }

    if (params.thcMin !== undefined) {
      filterParts.push("defined(thcPercent) && thcPercent >= $thcMin");
      queryParams.thcMin = params.thcMin;
    }

    if (params.thcMax !== undefined) {
      filterParts.push("defined(thcPercent) && thcPercent <= $thcMax");
      queryParams.thcMax = params.thcMax;
    }

    if (params.inStock !== undefined) {
      filterParts.push("defined(inStock) && inStock == $inStock");
      queryParams.inStock = params.inStock;
    }

    const filterSuffix = filterParts.length
      ? ` && ${filterParts.join(" && ")}`
      : "";

    let orderExpr = "_updatedAt desc";
    if (params.sort === "price_asc") orderExpr = "price asc";
    else if (params.sort === "price_desc") orderExpr = "price desc";
    else if (params.sort === "name_asc") orderExpr = "name asc";
    else if (params.sort === "name_desc") orderExpr = "name desc";
    else if (params.sort === "popular")
      orderExpr = "coalesce(popularity, 0) desc, _updatedAt desc";

    const listQuery = `*[_type=="product"${filterSuffix}] | order(${orderExpr})[${skip}...${skip + params.limit}]{
      _id,
      name,
      "slug": slug.current,
      description,
      "image": image.asset->url,
      price,
      thcPercent,
      cbdPercent,
      strainType,
      inStock,
      "brand": brand->{name, "slug": slug.current},
      "productType": productType->{title}
    }`;

    const countQuery = `count(*[_type=="product"${filterSuffix}])`;

    const [total, products] = await Promise.all([
      fetchCMS<number>(countQuery, queryParams),
      fetchCMS<any[]>(listQuery, queryParams),
    ]);

    const formattedProducts = (products || []).map((p) => ({
      id: p._id,
      name: p.name,
      brand: p.brand?.name || p.brand?.slug || null,
      category: p.productType?.title || null,
      strainType: p.strainType || null,
      slug: p.slug,
      description: p.description || null,
      price: p.price ?? null,
      thcPercent: p.thcPercent ?? null,
      cbdPercent: p.cbdPercent ?? null,
      image: p.image || null,
      stock: p.inStock === true ? 1 : 0,
    }));

    res.json({
      products: formattedProducts,
      page: params.page,
      limit: params.limit,
      total: total || 0,
      totalPages: Math.ceil((total || 0) / params.limit),
    });
  } catch (error: any) {
    logger.error("products.list.error", error);
    res.status(500).json({ error: "Failed to fetch products" });
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

    const storeIdParam = Array.isArray(storeId) ? storeId[0] : storeId;
    const product = await fetchCMS<any>(
      `*[_type=="product" && (_id == $id || slug.current == $id)][0]{
        _id,
        name,
        "slug": slug.current,
        description,
        "image": image.asset->url,
        price,
        thcPercent,
        cbdPercent,
        strainType,
        inStock,
        "brand": brand->{name, "slug": slug.current},
        "productType": productType->{title},
        variants[]{
          _key,
          name,
          price,
          thcPercent,
          cbdPercent,
          sku,
          inStock
        }
      }`,
      { id, storeId: storeIdParam },
    );

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    const variants = (product.variants || []).map((v: any) => ({
      id: v._key || v.id,
      name: v.name,
      price: v.price ?? product.price ?? null,
      stock: v.inStock === true ? 1 : 0,
      thcPercent: v.thcPercent ?? product.thcPercent ?? null,
      cbdPercent: v.cbdPercent ?? product.cbdPercent ?? null,
      sku: v.sku ?? null,
    }));

    res.json({
      id: product._id,
      name: product.name,
      brand: product.brand?.name || product.brand?.slug || null,
      category: product.productType?.title || null,
      strainType: product.strainType || null,
      slug: product.slug,
      description: product.description || null,
      price: product.price ?? null,
      thcPercent: product.thcPercent ?? null,
      cbdPercent: product.cbdPercent ?? null,
      image: product.image || null,
      variants: variants.length > 0 ? variants : undefined,
    });
  } catch (error: any) {
    logger.error("products.detail.error", error);
    res.status(500).json({ error: "Failed to fetch product" });
  }
});
