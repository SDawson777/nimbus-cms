import { Router, Request, Response } from "express";
import { z } from "zod";
import { fetchCMS } from "../../lib/cms";
import { logger } from "../../lib/logger";

export const storesV1Router = Router();

// Helper: Calculate if store is open now and when it closes
function calculateStoreHours(hours: any, timezone?: string) {
  if (!hours) return { isOpenNow: null, closesInMinutes: null, nextCloseAt: null };

  const now = new Date();
  const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const todayName = dayNames[now.getDay()];
  const todayHours = hours[todayName];

  if (!todayHours || todayHours.toLowerCase().includes("closed")) {
    return { isOpenNow: false, closesInMinutes: null, nextCloseAt: null };
  }

  // Parse hours like "9am-9pm" or "09:00-21:00"
  const match = todayHours.match(/(\d{1,2}):?(\d{2})?\s*(am|pm)?\s*-\s*(\d{1,2}):?(\d{2})?\s*(am|pm)?/i);
  if (!match) {
    return { isOpenNow: null, closesInMinutes: null, nextCloseAt: null };
  }

  const [, openHour, openMin = "0", openPeriod, closeHour, closeMin = "0", closePeriod] = match;
  
  let openHour24 = parseInt(openHour);
  if (openPeriod?.toLowerCase() === "pm" && openHour24 !== 12) openHour24 += 12;
  if (openPeriod?.toLowerCase() === "am" && openHour24 === 12) openHour24 = 0;

  let closeHour24 = parseInt(closeHour);
  if (closePeriod?.toLowerCase() === "pm" && closeHour24 !== 12) closeHour24 += 12;
  if (closePeriod?.toLowerCase() === "am" && closeHour24 === 12) closeHour24 = 0;

  const openTime = openHour24 * 60 + parseInt(openMin);
  const closeTime = closeHour24 * 60 + parseInt(closeMin);
  const currentTime = now.getHours() * 60 + now.getMinutes();

  const isOpenNow = currentTime >= openTime && currentTime < closeTime;
  const closesInMinutes = isOpenNow ? closeTime - currentTime : null;

  const nextClose = new Date(now);
  nextClose.setHours(closeHour24, parseInt(closeMin), 0, 0);
  const nextCloseAt = isOpenNow ? nextClose.toISOString() : null;

  return { isOpenNow, closesInMinutes, nextCloseAt };
}

/**
 * GET /v1/stores/search
 * Store search with map + list results
 */
storesV1Router.get("/search", async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      q: z.string().optional(),
      // Location (choose one)
      city: z.string().optional(),
      state: z.string().optional(),
      lat: z.coerce.number().optional(),
      lng: z.coerce.number().optional(),
      radiusMi: z.coerce.number().min(1).max(300).default(50),
      bounds: z.string().optional(), // swLat,swLng,neLat,neLng
      // Filters
      openNow: z.coerce.boolean().optional(),
      recreational: z.coerce.boolean().optional(),
      medical: z.coerce.boolean().optional(),
      delivery: z.coerce.boolean().optional(),
      storefront: z.coerce.boolean().optional(),
      curbside: z.coerce.boolean().optional(),
      orderOnline: z.coerce.boolean().optional(),
      amenities: z.string().optional(), // comma-separated
      brands: z.string().optional(), // comma-separated brand IDs
      categories: z.string().optional(), // comma-separated
      // Sorting
      sort: z.enum(["featured", "distance", "rating", "reviews", "largest_menu"]).default("featured"),
      // Pagination
      page: z.coerce.number().min(1).default(1),
      pageSize: z.coerce.number().min(1).max(50).default(20),
    });

    const params = schema.parse(req.query);
    const filterParts: string[] = ["(!defined(isActive) || isActive == true)"];
    const queryParams: Record<string, unknown> = {};

    // Location filters
    if (params.city && params.state) {
      filterParts.push(`city match "${params.city}" && stateCode match "${params.state}"`);
    } else if (params.lat !== undefined && params.lng !== undefined) {
      const dLat = params.radiusMi / 111;
      const dLng = params.radiusMi / (111 * Math.cos((params.lat * Math.PI) / 180));
      queryParams.minLat = params.lat - dLat;
      queryParams.maxLat = params.lat + dLat;
      queryParams.minLng = params.lng - dLng;
      queryParams.maxLng = params.lng + dLng;
      filterParts.push(
        "defined(latitude) && defined(longitude) && latitude >= $minLat && latitude <= $maxLat && longitude >= $minLng && longitude <= $maxLng"
      );
    } else if (params.bounds) {
      const [swLat, swLng, neLat, neLng] = params.bounds.split(",").map(Number);
      filterParts.push(
        `defined(latitude) && defined(longitude) && latitude >= ${swLat} && latitude <= ${neLat} && longitude >= ${swLng} && longitude <= ${neLng}`
      );
    }

    // Text search
    if (params.q) {
      filterParts.push(`(name match "*${params.q}*" || city match "*${params.q}*")`);
    }

    // Fulfillment filters
    if (params.delivery) {
      filterParts.push("isDeliveryEnabled == true");
    }
    if (params.storefront || params.curbside) {
      filterParts.push("isPickupEnabled == true");
    }

    // Amenities filter
    if (params.amenities) {
      const amenitiesList = params.amenities.split(",").map(a => a.trim());
      const amenityConditions = amenitiesList.map(a => `"${a}" in amenities`).join(" && ");
      filterParts.push(`(${amenityConditions})`);
    }

    const filterSuffix = filterParts.length ? ` && ${filterParts.join(" && ")}` : "";

    // Sorting
    let orderClause = "order(_createdAt desc)";
    if (params.sort === "rating") orderClause = "order(avgRating desc)";
    else if (params.sort === "reviews") orderClause = "order(reviewCount desc)";
    else if (params.sort === "featured") orderClause = "order(coalesce(avgRating, 0) desc)";

    const skip = (params.page - 1) * params.pageSize;

    const [stores, totalCount] = await Promise.all([
      fetchCMS<any[]>(
        `*[_type=="store"${filterSuffix}] | ${orderClause}[${skip}...${skip + params.pageSize}]{
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
          timezone,
          isActive,
          latitude,
          longitude,
          isDeliveryEnabled,
          isPickupEnabled,
          deliveryFee,
          minOrderAmount,
          amenities,
          avgRating,
          reviewCount,
          "logoUrl": logo.asset->url,
          "brand": brand->name
        }`,
        queryParams
      ),
      fetchCMS<number>(`count(*[_type=="store"${filterSuffix}])`, queryParams),
    ]);

    const storeSummaries = (stores || []).map((s) => {
      const { isOpenNow, closesInMinutes, nextCloseAt } = calculateStoreHours(s.hours, s.timezone);
      return {
        id: s._id,
        name: s.name,
        slug: s.slug,
        address1: s.address || null,
        city: s.city || null,
        state: s.stateCode || null,
        postalCode: s.zip || null,
        latitude: s.latitude ?? null,
        longitude: s.longitude ?? null,
        phone: s.phone || null,
        logoUrl: s.logoUrl || null,
        brand: s.brand || null,
        isOpenNow,
        closesInMinutes,
        nextCloseAt,
        isDeliveryEnabled: s.isDeliveryEnabled ?? false,
        isPickupEnabled: s.isPickupEnabled ?? false,
        avgRating: s.avgRating ?? null,
        reviewCount: s.reviewCount ?? 0,
        amenities: s.amenities || [],
      };
    });

    const mapPins = (stores || []).map((s) => ({
      storeId: s._id,
      lat: s.latitude ?? null,
      lng: s.longitude ?? null,
      pinType: s.isDeliveryEnabled ? "delivery" : s.isPickupEnabled ? "pickup" : "store",
    }));

    res.json({
      meta: {
        total: totalCount || 0,
        page: params.page,
        pageSize: params.pageSize,
        sort: params.sort,
      },
      stores: storeSummaries,
      map: { pins: mapPins },
    });
  } catch (error: any) {
    logger.error("stores.v1.search.error", error);
    res.status(500).json({ error: "Failed to search stores" });
  }
});

/**
 * GET /v1/stores/facets
 * Get filter facets with counts
 */
storesV1Router.get("/facets", async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      q: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      lat: z.coerce.number().optional(),
      lng: z.coerce.number().optional(),
      radiusMi: z.coerce.number().min(1).max(300).default(50),
      bounds: z.string().optional(),
      openNow: z.coerce.boolean().optional(),
      delivery: z.coerce.boolean().optional(),
      storefront: z.coerce.boolean().optional(),
    });

    const params = schema.parse(req.query);
    const filterParts: string[] = ["(!defined(isActive) || isActive == true)"];
    const queryParams: Record<string, unknown> = {};

    // Apply same location/search filters as search endpoint
    if (params.city && params.state) {
      filterParts.push(`city match "${params.city}" && stateCode match "${params.state}"`);
    } else if (params.lat !== undefined && params.lng !== undefined) {
      const dLat = params.radiusMi / 111;
      const dLng = params.radiusMi / (111 * Math.cos((params.lat * Math.PI) / 180));
      queryParams.minLat = params.lat - dLat;
      queryParams.maxLat = params.lat + dLat;
      queryParams.minLng = params.lng - dLng;
      queryParams.maxLng = params.lng + dLng;
      filterParts.push(
        "defined(latitude) && defined(longitude) && latitude >= $minLat && latitude <= $maxLat && longitude >= $minLng && longitude <= $maxLng"
      );
    } else if (params.bounds) {
      const [swLat, swLng, neLat, neLng] = params.bounds.split(",").map(Number);
      filterParts.push(
        `defined(latitude) && defined(longitude) && latitude >= ${swLat} && latitude <= ${neLat} && longitude >= ${swLng} && longitude <= ${neLng}`
      );
    }

    if (params.q) {
      filterParts.push(`(name match "*${params.q}*" || city match "*${params.q}*")`);
    }

    const filterSuffix = filterParts.length ? ` && ${filterParts.join(" && ")}` : "";

    const [totalCount, stores] = await Promise.all([
      fetchCMS<number>(`count(*[_type=="store"${filterSuffix}])`, queryParams),
      fetchCMS<any[]>(
        `*[_type=="store"${filterSuffix}]{
          amenities,
          "brand": brand->{_id, name}
        }`,
        queryParams
      ),
    ]);

    // Count amenities
    const amenityCounts: Record<string, number> = {};
    const brandCounts: Record<string, { id: string; name: string; count: number }> = {};

    (stores || []).forEach((store) => {
      (store.amenities || []).forEach((amenity: string) => {
        amenityCounts[amenity] = (amenityCounts[amenity] || 0) + 1;
      });

      if (store.brand) {
        const brandId = store.brand._id;
        if (!brandCounts[brandId]) {
          brandCounts[brandId] = { id: brandId, name: store.brand.name, count: 0 };
        }
        brandCounts[brandId].count++;
      }
    });

    const amenities = Object.entries(amenityCounts).map(([key, count]) => ({
      key,
      label: key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
      count,
    }));

    const brands = Object.values(brandCounts);

    res.json({
      total: totalCount || 0,
      brands,
      amenities,
      categories: [], // TODO: Add product categories if needed
    });
  } catch (error: any) {
    logger.error("stores.v1.facets.error", error);
    res.status(500).json({ error: "Failed to fetch facets" });
  }
});

/**
 * GET /v1/stores/:storeId
 * Get full store details
 */
storesV1Router.get("/:storeId", async (req: Request, res: Response) => {
  try {
    const { storeId } = req.params;
    const store = await fetchCMS<any>(
      `*[_type=="store" && (_id == $storeId || slug.current == $storeId)][0]{
        _id,
        name,
        "slug": slug.current,
        description,
        "logoUrl": logo.asset->url,
        "bannerUrl": banner.asset->url,
        "galleryImages": gallery[].asset->url,
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
        holidayHours,
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
        longitude,
        amenities,
        "brand": brand->{_id, name, "logo": logo.asset->url},
        orderingUrl,
        menuUrl,
        complianceFlags
      }`,
      { storeId }
    );

    if (!store) {
      return res.status(404).json({ error: "Store not found" });
    }

    const { isOpenNow, closesInMinutes, nextCloseAt } = calculateStoreHours(store.hours, store.timezone);

    res.json({
      id: store._id,
      name: store.name,
      slug: store.slug,
      description: store.description || null,
      logoUrl: store.logoUrl || null,
      bannerUrl: store.bannerUrl || null,
      galleryImages: store.galleryImages || [],
      address1: store.address || null,
      address2: store.address2 || null,
      city: store.city || null,
      state: store.stateCode || null,
      postalCode: store.zip || null,
      country: store.country || "US",
      latitude: store.latitude ?? null,
      longitude: store.longitude ?? null,
      phone: store.phone || null,
      email: store.email || null,
      timezone: store.timezone || null,
      hours: store.hours || null,
      holidayHours: store.holidayHours || null,
      isOpenNow,
      closesInMinutes,
      nextCloseAt,
      licenseNumber: store.licenseNumber || null,
      licenseExpiry: store.licenseExpiry || null,
      fulfillment: {
        delivery: store.isDeliveryEnabled ?? false,
        pickup: store.isPickupEnabled ?? true,
        curbside: store.isPickupEnabled ?? true,
        orderOnline: !!store.orderingUrl,
      },
      minOrderAmount: store.minOrderAmount ?? null,
      deliveryRadius: store.deliveryRadius ?? null,
      deliveryFee: store.deliveryFee ?? null,
      avgRating: store.avgRating ?? null,
      reviewCount: store.reviewCount ?? 0,
      amenities: store.amenities || [],
      brand: store.brand || null,
      orderingUrl: store.orderingUrl || null,
      menuUrl: store.menuUrl || null,
      complianceFlags: store.complianceFlags || [],
    });
  } catch (error: any) {
    logger.error("stores.v1.detail.error", error);
    res.status(500).json({ error: "Failed to fetch store" });
  }
});

/**
 * GET /v1/stores/:storeId/promos
 * Get active promotions for a store
 */
storesV1Router.get("/:storeId/promos", async (req: Request, res: Response) => {
  try {
    const { storeId } = req.params;
    const { active } = z.object({ active: z.coerce.boolean().default(true) }).parse(req.query);

    const now = new Date().toISOString();
    const activeFilter = active
      ? ` && (!defined(validFrom) || validFrom <= "${now}") && (!defined(validUntil) || validUntil >= "${now}")`
      : "";

    const promos = await fetchCMS<any[]>(
      `*[_type=="promo" && references($storeId)${activeFilter}]{
        _id,
        title,
        description,
        promoCode,
        discountPercent,
        discountAmount,
        validFrom,
        validUntil,
        terms,
        "image": image.asset->url
      }`,
      { storeId }
    );

    res.json({ promos: promos || [] });
  } catch (error: any) {
    logger.error("stores.v1.promos.error", error);
    res.status(500).json({ error: "Failed to fetch promotions" });
  }
});

/**
 * GET /v1/stores/:storeId/reviews/summary
 * Get reviews summary for a store
 */
storesV1Router.get("/:storeId/reviews/summary", async (req: Request, res: Response) => {
  try {
    const { storeId } = req.params;

    // Get store's review stats
    const store = await fetchCMS<any>(
      `*[_type=="store" && (_id == $storeId || slug.current == $storeId)][0]{
        avgRating,
        reviewCount
      }`,
      { storeId }
    );

    if (!store) {
      return res.status(404).json({ error: "Store not found" });
    }

    // Mock distribution (in real app, query actual reviews)
    const distribution = {
      5: Math.floor((store.reviewCount || 0) * 0.6),
      4: Math.floor((store.reviewCount || 0) * 0.2),
      3: Math.floor((store.reviewCount || 0) * 0.1),
      2: Math.floor((store.reviewCount || 0) * 0.05),
      1: Math.floor((store.reviewCount || 0) * 0.05),
    };

    res.json({
      avgRating: store.avgRating ?? 0,
      reviewCount: store.reviewCount ?? 0,
      distribution,
    });
  } catch (error: any) {
    logger.error("stores.v1.reviews.summary.error", error);
    res.status(500).json({ error: "Failed to fetch review summary" });
  }
});
