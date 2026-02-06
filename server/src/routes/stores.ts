import { Router, Request, Response } from "express";
import { z } from "zod";
import { fetchCMS } from "../lib/cms";
import { logger } from "../lib/logger";

export const storesRouter = Router();

/**
 * GET /stores
 * Public endpoint for mobile app to find nearby stores
 * Supports location-based search with radius
 */
storesRouter.get("/", async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      lat: z.coerce.number().optional(),
      lng: z.coerce.number().optional(),
      radius: z.coerce.number().min(1).max(300).default(50),
      limit: z.coerce.number().min(1).max(100).default(20),
    });

    const params = schema.parse(req.query);
    const filterParts: string[] = ["(!defined(isActive) || isActive == true)"];
    const queryParams: Record<string, unknown> = {};

    if (params.lat !== undefined && params.lng !== undefined) {
      const dLat = params.radius / 111;
      const dLng = params.radius / (111 * Math.cos((params.lat * Math.PI) / 180));
      queryParams.minLat = params.lat - dLat;
      queryParams.maxLat = params.lat + dLat;
      queryParams.minLng = params.lng - dLng;
      queryParams.maxLng = params.lng + dLng;
      filterParts.push(
        "defined(latitude) && defined(longitude) && latitude >= $minLat && latitude <= $maxLat && longitude >= $minLng && longitude <= $maxLng",
      );
    }

    const filterSuffix = filterParts.length
      ? ` && ${filterParts.join(" && ")}`
      : "";

    const listQuery = `*[_type=="store"${filterSuffix}] | order(city asc, name asc)[0...${params.limit}]{
      _id,
      name,
      "slug": slug.current,
      address,
      address2,
      city,
      stateCode,
      zip,
      phone,
      email,
      hours,
      isActive,
      latitude,
      longitude,
      isDeliveryEnabled,
      isPickupEnabled,
      deliveryFee,
      minOrderAmount
    }`;

    const stores = await fetchCMS<any[]>(listQuery, queryParams);

    const formattedStores = (stores || []).map((s) => ({
      id: s._id,
      name: s.name,
      slug: s.slug,
      address1: s.address || null,
      address2: s.address2 || null,
      city: s.city || null,
      state: s.stateCode || null,
      postalCode: s.zip || null,
      latitude: s.latitude ?? null,
      longitude: s.longitude ?? null,
      phone: s.phone || null,
      email: s.email || null,
      hours: s.hours || null,
      isActive: s.isActive ?? true,
      isDeliveryEnabled: s.isDeliveryEnabled ?? null,
      isPickupEnabled: s.isPickupEnabled ?? null,
      deliveryFee: s.deliveryFee ?? null,
      minOrderAmount: s.minOrderAmount ?? null,
    }));

    res.json({ stores: formattedStores });
  } catch (error: any) {
    logger.error("stores.list.error", error);
    res.status(500).json({ error: "Failed to fetch stores" });
  }
});

/**
 * GET /stores/:id
 * Fetch single store details
 */
storesRouter.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const store = await fetchCMS<any>(
      `*[_type=="store" && (_id == $id || slug.current == $id)][0]{
        _id,
        name,
        "slug": slug.current,
        description,
        "logoUrl": logo.asset->url,
        "bannerUrl": banner.asset->url,
        address,
        address2,
        city,
        stateCode,
        zip,
        country,
        phone,
        email,
        timezone,
        hours,
        licenseNumber,
        licenseExpiry,
        minOrderAmount,
        deliveryRadius,
        deliveryFee,
        avgRating,
        reviewCount,
        isActive,
        isDeliveryEnabled,
        isPickupEnabled,
        latitude,
        longitude
      }`,
      { id },
    );

    if (!store) {
      return res.status(404).json({ error: "Store not found" });
    }

    res.json({
      id: store._id,
      name: store.name,
      slug: store.slug,
      description: store.description || null,
      logoUrl: store.logoUrl || null,
      bannerUrl: store.bannerUrl || null,
      address1: store.address || null,
      address2: store.address2 || null,
      city: store.city || null,
      state: store.stateCode || null,
      postalCode: store.zip || null,
      country: store.country || null,
      latitude: store.latitude ?? null,
      longitude: store.longitude ?? null,
      phone: store.phone || null,
      email: store.email || null,
      timezone: store.timezone || null,
      hours: store.hours || null,
      licenseNumber: store.licenseNumber || null,
      licenseExpiry: store.licenseExpiry || null,
      minOrderAmount: store.minOrderAmount ?? null,
      deliveryRadius: store.deliveryRadius ?? null,
      deliveryFee: store.deliveryFee ?? null,
      avgRating: store.avgRating ?? null,
      reviewCount: store.reviewCount ?? null,
      isActive: store.isActive ?? true,
      isDeliveryEnabled: store.isDeliveryEnabled ?? null,
      isPickupEnabled: store.isPickupEnabled ?? null,
    });
  } catch (error: any) {
    logger.error("stores.detail.error", error);
    res.status(500).json({ error: "Failed to fetch store" });
  }
});
