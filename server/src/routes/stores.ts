import express, { Router, Request, Response } from "express";
import { z } from "zod";
import getPrisma from "../lib/prisma";
import { logger } from "../lib/logger";

export const storesRouter = Router();

// Fallback stores for demo/testing
const FALLBACK_STORES = [
  {
    id: "fallback-store-1",
    name: "Downtown Dispensary",
    slug: "downtown",
    address1: "123 Main St",
    city: "Detroit",
    state: "MI",
    postalCode: "48201",
    latitude: 42.3314,
    longitude: -83.0458,
    phone: "(313) 555-0100",
    hours: {
      monday: "9:00 AM - 9:00 PM",
      tuesday: "9:00 AM - 9:00 PM",
      wednesday: "9:00 AM - 9:00 PM",
      thursday: "9:00 AM - 9:00 PM",
      friday: "9:00 AM - 10:00 PM",
      saturday: "10:00 AM - 10:00 PM",
      sunday: "10:00 AM - 8:00 PM",
    },
    isActive: true,
  },
  {
    id: "fallback-store-2",
    name: "Eastside Cannabis",
    slug: "eastside",
    address1: "456 Jefferson Ave",
    city: "Detroit",
    state: "MI",
    postalCode: "48207",
    latitude: 42.3485,
    longitude: -83.0118,
    phone: "(313) 555-0200",
    hours: {
      monday: "10:00 AM - 8:00 PM",
      tuesday: "10:00 AM - 8:00 PM",
      wednesday: "10:00 AM - 8:00 PM",
      thursday: "10:00 AM - 8:00 PM",
      friday: "10:00 AM - 9:00 PM",
      saturday: "11:00 AM - 9:00 PM",
      sunday: "11:00 AM - 7:00 PM",
    },
    isActive: true,
  },
];

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
    const prisma = getPrisma();

    const where: any = {
      isActive: true,
    };

    // If lat/lng provided, filter by approximate radius
    if (params.lat !== undefined && params.lng !== undefined) {
      const dLat = params.radius / 111; // ~111 km per degree latitude
      const dLng = params.radius / (111 * Math.cos((params.lat * Math.PI) / 180));

      where.latitude = {
        gte: params.lat - dLat,
        lte: params.lat + dLat,
      };
      where.longitude = {
        gte: params.lng - dLng,
        lte: params.lng + dLng,
      };
    }

    const stores = await prisma.store.findMany({
      where,
      take: params.limit,
      orderBy: [{ city: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        slug: true,
        address1: true,
        address2: true,
        city: true,
        state: true,
        postalCode: true,
        latitude: true,
        longitude: true,
        phone: true,
        email: true,
        hours: true,
        isActive: true,
        isDeliveryEnabled: true,
        isPickupEnabled: true,
        deliveryFee: true,
        minOrderAmount: true,
      },
    });

    // If no stores found, return fallback data
    if (stores.length === 0) {
      logger.info("No stores in database, returning fallback data");
      return res.json({ stores: FALLBACK_STORES });
    }

    const formattedStores = stores.map((s) => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
      address1: s.address1,
      address2: s.address2,
      city: s.city,
      state: s.state,
      postalCode: s.postalCode,
      latitude: s.latitude ? Number(s.latitude) : null,
      longitude: s.longitude ? Number(s.longitude) : null,
      phone: s.phone,
      email: s.email,
      hours: s.hours,
      isActive: s.isActive,
      isDeliveryEnabled: s.isDeliveryEnabled,
      isPickupEnabled: s.isPickupEnabled,
      deliveryFee: s.deliveryFee,
      minOrderAmount: s.minOrderAmount,
    }));

    res.json({ stores: formattedStores });
  } catch (error: any) {
    logger.error("stores.list.error", error);
    // Return fallback on error
    res.json({ stores: FALLBACK_STORES });
  }
});

/**
 * GET /stores/:id
 * Fetch single store details
 */
storesRouter.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const prisma = getPrisma();

    const store = await prisma.store.findUnique({
      where: { id: String(id) },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        logoUrl: true,
        bannerUrl: true,
        address1: true,
        address2: true,
        city: true,
        state: true,
        postalCode: true,
        country: true,
        latitude: true,
        longitude: true,
        phone: true,
        email: true,
        timezone: true,
        hours: true,
        licenseNumber: true,
        licenseExpiry: true,
        minOrderAmount: true,
        deliveryRadius: true,
        deliveryFee: true,
        avgRating: true,
        reviewCount: true,
        isActive: true,
        isDeliveryEnabled: true,
        isPickupEnabled: true,
      },
    });

    if (!store) {
      return res.status(404).json({ error: "Store not found" });
    }

    res.json({
      ...store,
      latitude: store.latitude ? Number(store.latitude) : null,
      longitude: store.longitude ? Number(store.longitude) : null,
    });
  } catch (error: any) {
    logger.error("stores.detail.error", error);
    res.status(500).json({ error: "Failed to fetch store" });
  }
});
