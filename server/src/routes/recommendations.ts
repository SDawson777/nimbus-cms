import { Router, Request, Response } from "express";
import { z } from "zod";
import IORedis, { Redis } from "ioredis";
import { fetchCMS } from "../lib/cms";
import { logger } from "../lib/logger";
import {
  DayPart,
  mapWeatherToPreset,
  getStyleHints,
  getWeatherReason,
} from "../lib/weatherPresets";

export const recommendationsRouter = Router();

// Weather condition to product category/tag mapping
const WEATHER_PRODUCT_MAP: Record<
  string,
  { tags: string[]; categories: string[]; description: string; biasTag?: string }
> = {
  sunny: {
    tags: ["energizing", "uplifting", "daytime", "sativa"],
    categories: ["Flower", "PreRoll", "Vape"],
    description: "Energizing strains perfect for sunny days",
    biasTag: "uplifting",
  },
  clear: {
    tags: ["energizing", "uplifting", "daytime", "sativa"],
    categories: ["Flower", "PreRoll", "Vape"],
    description: "Uplifting products for clear skies",
    biasTag: "uplifting",
  },
  cloudy: {
    tags: ["balanced", "hybrid", "relaxing"],
    categories: ["Flower", "Edibles", "Tincture"],
    description: "Balanced hybrids for mellower moods",
    biasTag: "balanced",
  },
  rainy: {
    tags: ["relaxing", "calming", "indica", "cozy"],
    categories: ["Edibles", "Tincture", "Flower"],
    description: "Relaxing products for rainy day comfort",
    biasTag: "relaxing",
  },
  snow: {
    tags: ["warming", "relaxing", "indica", "cozy", "sleep"],
    categories: ["Edibles", "Tincture", "Concentrate"],
    description: "Warming products for cold weather",
    biasTag: "cozy",
  },
  storm: {
    tags: ["relaxing", "calming", "stress-relief", "indica"],
    categories: ["Edibles", "Tincture"],
    description: "Calming products for stormy weather",
    biasTag: "calming",
  },
  hot: {
    tags: ["cooling", "refreshing", "light"],
    categories: ["Vape", "Tincture", "Topical"],
    description: "Refreshing options for hot days",
    biasTag: "refreshing",
  },
  cold: {
    tags: ["warming", "comforting", "relaxing", "cozy"],
    categories: ["Edibles", "Concentrate", "Flower", "Topical"],
    description: "Comforting products for cold weather",
    biasTag: "cozy",
  },
};

type WeatherSnapshot = {
  conditionCode: string;
  temp?: number;
  feelsLike?: number;
  wind?: number;
  precipProb?: number;
  cloudCover?: number;
  dayPart: DayPart;
  units: "imperial" | "metric";
  source: "provided" | "cached" | "fallback" | "provider";
  provider?: "openweather";
};

type CacheEntry<T> = { value: T; expiresAt: number };
const WEATHER_CACHE = new Map<string, CacheEntry<WeatherSnapshot>>();
const RECO_CACHE = new Map<string, CacheEntry<any>>();

let redisClient: Redis | null = null;
if (process.env.REDIS_URL) {
  try {
    redisClient = new IORedis(process.env.REDIS_URL);
  } catch (error) {
    logger.warn("weather.redis.init_failed", error as any);
    redisClient = null;
  }
}

function readMemory<T>(cache: Map<string, CacheEntry<T>>, key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    cache.delete(key);
    return null;
  }
  return entry.value;
}

function writeMemory<T>(
  cache: Map<string, CacheEntry<T>>,
  key: string,
  value: T,
  ttlMs: number,
) {
  cache.set(key, { value, expiresAt: Date.now() + ttlMs });
}

async function readCache<T>(
  cache: Map<string, CacheEntry<T>>,
  key: string,
): Promise<T | null> {
  const memory = readMemory<T>(cache, key);
  if (memory) return memory;
  if (!redisClient) return null;
  try {
    const raw = await redisClient.get(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as T;
    writeMemory(cache, key, parsed, 15_000);
    return parsed;
  } catch {
    return null;
  }
}

async function writeCache<T>(
  cache: Map<string, CacheEntry<T>>,
  key: string,
  value: T,
  ttlMs: number,
) {
  writeMemory(cache, key, value, ttlMs);
  if (!redisClient) return;
  try {
    await redisClient.set(key, JSON.stringify(value), "PX", ttlMs);
  } catch (error) {
    logger.warn("weather.cache.write_failed", error as any);
  }
}

function getDayPartFromHour(hour?: number): DayPart {
  const h = hour ?? new Date().getHours();
  if (h >= 5 && h < 7) return "dawn";
  if (h >= 7 && h < 19) return "day";
  if (h >= 19 && h < 21) return "dusk";
  return "night";
}

function inferWeatherSnapshot(
  conditionCode: string,
  temp: number | undefined,
  units: "imperial" | "metric",
): Omit<WeatherSnapshot, "source" | "provider"> {
  const normalized = conditionCode.toLowerCase();
  const isRain = normalized.includes("rain") || normalized.includes("storm");
  const isSnow = normalized.includes("snow");
  const isWindy = normalized.includes("wind");

  return {
    conditionCode: normalized,
    temp,
    feelsLike: temp,
    wind: isWindy ? 20 : 8,
    precipProb: isRain ? 70 : isSnow ? 60 : 10,
    cloudCover: normalized.includes("overcast") ? 90 : 40,
    dayPart: getDayPartFromHour(),
    units,
  };
}

function mapOpenWeatherCondition(code?: number, main?: string): string {
  if (!code && main) return main.toLowerCase();
  if (!code) return "clear";
  if (code >= 200 && code < 300) return "storm";
  if (code >= 300 && code < 600) return "rainy";
  if (code >= 600 && code < 700) return "snow";
  if (code >= 700 && code < 800) return "fog";
  if (code === 800) return "clear";
  if (code >= 801 && code <= 803) return "cloudy";
  if (code === 804) return "overcast";
  return "clear";
}

function getLocalHour(unixSeconds?: number, tzOffsetSeconds?: number): number {
  if (!unixSeconds) return new Date().getHours();
  const offset = tzOffsetSeconds ?? 0;
  const localMs = (unixSeconds + offset) * 1000;
  return new Date(localMs).getUTCHours();
}

async function fetchOpenWeatherSnapshot(params: {
  lat: number;
  lng: number;
  units: "imperial" | "metric";
  apiKey: string;
}): Promise<WeatherSnapshot> {
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${params.lat}&lon=${params.lng}&units=${params.units}&appid=${params.apiKey}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`OpenWeather failed: ${res.status}`);
  }
  const data: any = await res.json();

  const conditionCode = mapOpenWeatherCondition(
    data?.weather?.[0]?.id,
    data?.weather?.[0]?.main,
  );
  const hour = getLocalHour(data?.dt, data?.timezone);
  const dayPart = getDayPartFromHour(hour);

  const windMpsOrMph = typeof data?.wind?.speed === "number" ? data.wind.speed : undefined;
  const windMph =
    windMpsOrMph !== undefined
      ? params.units === "metric"
        ? windMpsOrMph * 2.23694
        : windMpsOrMph
      : undefined;

  const precipProb =
    typeof data?.rain?.["1h"] === "number" || typeof data?.snow?.["1h"] === "number"
      ? 80
      : undefined;

  return {
    conditionCode,
    temp: typeof data?.main?.temp === "number" ? data.main.temp : undefined,
    feelsLike:
      typeof data?.main?.feels_like === "number" ? data.main.feels_like : undefined,
    wind: windMph,
    precipProb,
    cloudCover:
      typeof data?.clouds?.all === "number" ? data.clouds.all : undefined,
    dayPart,
    units: params.units,
    source: "provider",
    provider: "openweather",
  };
}

async function getWeatherSnapshot(params: {
  condition?: string;
  temp?: number;
  lat?: number;
  lng?: number;
  brand?: string;
  store?: string;
  brandId?: string;
  storeId?: string;
  units: "imperial" | "metric";
  providerMode?: string;
  provider?: string;
  ttlSeconds: number;
}): Promise<WeatherSnapshot> {
  const normalizedCondition = (params.condition || "clear").toLowerCase();
  const key = [
    "weather",
    params.brandId || params.brand || "*",
    params.storeId || params.store || "*",
    params.lat ?? "*",
    params.lng ?? "*",
    params.units,
    normalizedCondition,
  ].join(":");

  const cached = await readCache<WeatherSnapshot>(WEATHER_CACHE, key);
  if (cached) {
    return { ...cached, source: "cached" };
  }

  const apiKey = process.env.OPENWEATHER_API_KEY;
  const providerMode = params.providerMode || "server_managed";
  const provider = params.provider || "openweather";

  if (
    apiKey &&
    params.lat !== undefined &&
    params.lng !== undefined &&
    (providerMode === "server_managed" || provider === "openweather")
  ) {
    try {
      const live = await fetchOpenWeatherSnapshot({
        lat: params.lat,
        lng: params.lng,
        units: params.units,
        apiKey,
      });
      await writeCache(WEATHER_CACHE, key, live, params.ttlSeconds * 1000);
      return live;
    } catch (error) {
      logger.warn("weather.openweather.failed", {
        message: (error as Error)?.message || "unknown",
      });
    }
  }

  const snapshot: WeatherSnapshot = {
    ...inferWeatherSnapshot(normalizedCondition, params.temp, params.units),
    source: params.condition ? "provided" : "fallback",
  };

  await writeCache(WEATHER_CACHE, key, snapshot, params.ttlSeconds * 1000);
  return snapshot;
}

function resolveUnits(
  configUnits: string | undefined,
  queryUnits: string | undefined,
): "imperial" | "metric" {
  if (configUnits === "metric") return "metric";
  if (configUnits === "imperial") return "imperial";
  if (queryUnits === "metric" || queryUnits === "imperial") return queryUnits;
  return "imperial";
}

async function resolveCoordinates(params: {
  lat?: number;
  lng?: number;
  locationSource: string;
  storeId?: string;
  store?: string;
}): Promise<{ lat: number; lng: number; source: "query" | "store" } | null> {
  if (params.lat !== undefined && params.lng !== undefined) {
    return { lat: params.lat, lng: params.lng, source: "query" };
  }

  if (params.locationSource === "device_location") return null;

  if (params.storeId || params.store) {
    const storeQuery = params.storeId
      ? `*[_type=="store" && _id==$storeId][0]{latitude, longitude}`
      : `*[_type=="store" && slug.current==$store][0]{latitude, longitude}`;
    const storeData = await fetchCMS<any>(storeQuery, {
      storeId: params.storeId,
      store: params.store,
    });
    const lat = storeData?.latitude;
    const lng = storeData?.longitude;
    if (typeof lat === "number" && typeof lng === "number") {
      return { lat, lng, source: "store" };
    }
  }

  return null;
}

/**
 * GET /recommendations/weather
 * GET /api/v1/personalization/weather-recommendations
 * Enhanced weather-based product recommendations with white-label config support
 * Query params:
 *   - condition: weather condition code (sunny, rainy, etc.)
 *   - brand / brandId: brand slug or id for white-label config
 *   - store / storeId: store slug or id (optional)
 *   - temp: temperature in Fahrenheit (optional)
 *   - lat, lng: coordinates for location-based logic (optional)
 *   - limit: max items (1-20, default from config or 6)
 */
const handleWeatherRecommendations = async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      condition: z.string().optional(),
      brand: z.string().optional(),
      brandId: z.string().optional(),
      store: z.string().optional(),
      storeId: z.string().optional(),
      orgId: z.string().optional(),
      temp: z.coerce.number().optional(),
      lat: z.coerce.number().optional(),
      lng: z.coerce.number().optional(),
      units: z.enum(["imperial", "metric"]).optional(),
      limit: z.coerce.number().min(1).max(20).optional(),
      userId: z.string().optional(), // for personalization
    });

    const params = schema.parse(req.query);
    const brand = params.brand?.trim();
    const brandId = params.brandId?.trim();
    const store = params.store?.trim();
    const storeId = params.storeId?.trim();

    // 1. Load white-label config (if brand provided)
    let config: any = null;
    if (brandId || brand) {
      try {
        const configQuery = storeId && brandId
          ? `*[_type=="whiteLabelConfig" && brand._ref==$brandId && store._ref==$storeId][0]{weatherRecommendationsWidget}`
          : store
          ? `*[_type=="whiteLabelConfig" && brand->slug.current==$brand && store->slug.current==$store][0]{weatherRecommendationsWidget}`
          : brandId
          ? `*[_type=="whiteLabelConfig" && brand._ref==$brandId && !defined(store)][0]{weatherRecommendationsWidget}`
          : `*[_type=="whiteLabelConfig" && brand->slug.current==$brand && !defined(store)][0]{weatherRecommendationsWidget}`;
        const configData: any = await fetchCMS(
          configQuery,
          { brand, store, brandId, storeId },
          { preview: (req as any).preview },
        );
        config = configData?.weatherRecommendationsWidget;
      } catch (err) {
        logger.warn("Failed to load white-label config", {
          brand,
          brandId,
          store,
          storeId,
        });
      }
    }

    // If widget disabled, return minimal response
    if (config && config.enabled === false) {
      return res.json({ enabled: false });
    }

    const locationSource = config?.locationSource || "hybrid";
    const units = resolveUnits(config?.units, params.units);
    const coords = await resolveCoordinates({
      lat: params.lat,
      lng: params.lng,
      locationSource,
      storeId,
      store,
    });

    // 2. Determine limit from config or default
    const maxItems = params.limit || config?.maxItems || 6;
    const minItems = config?.minItems || 3;

    const cacheEligible = !params.userId;
    const recoCacheKey = [
      "weather-reco",
      brandId || brand || "*",
      storeId || store || "*",
      coords?.lat ?? "*",
      coords?.lng ?? "*",
      units,
      params.temp ?? "*",
      params.condition || "auto",
      maxItems,
    ].join(":");

    if (cacheEligible) {
      const cachedResponse = await readCache<any>(RECO_CACHE, recoCacheKey);
      if (cachedResponse) {
        logger.info("weather_widget_impression", {
          brand,
          brandId,
          store,
          storeId,
          condition: cachedResponse.condition,
          itemCount: cachedResponse.items?.length || 0,
          source: "cached",
          timestamp: new Date().toISOString(),
        });
        const ttl = config?.recommendationsTtlSeconds || 1800;
        const swr = config?.staleWhileRevalidateSeconds || 86400;
        res.set(
          "Cache-Control",
          `public, max-age=${ttl}, stale-while-revalidate=${swr}`,
        );
        return res.json(cachedResponse);
      }
    }

    // 3. Resolve weather (cached)
    const weatherSnapshot = await getWeatherSnapshot({
      condition: params.condition,
      temp: params.temp,
      lat: coords?.lat,
      lng: coords?.lng,
      brand,
      store,
      brandId,
      storeId,
      units,
      providerMode: config?.providerMode,
      provider: config?.provider,
      ttlSeconds: config?.weatherTtlSeconds || 1800,
    });

    // 4. Normalize weather condition
    const condition = weatherSnapshot.conditionCode;
    const weatherMap =
      WEATHER_PRODUCT_MAP[condition] || WEATHER_PRODUCT_MAP["clear"];

    // 5. Apply config-based category filters
    let allowedCategories = weatherMap.categories;
    if (config?.allowCategories && config.allowCategories.length > 0) {
      // Intersect with weather-suggested categories
      allowedCategories = allowedCategories.filter((c: string) =>
        config.allowCategories.includes(c),
      );
    }
    if (config?.excludeCategories && config.excludeCategories.length > 0) {
      allowedCategories = allowedCategories.filter(
        (c: string) => !config.excludeCategories.includes(c),
      );
    }

    // 6. Apply config-based rules
    let tags = [...weatherMap.tags];
    // Include topicals when cold
    if (
      config?.includeTopicalsWhenCold &&
      (condition === "cold" || condition === "snow" || (params.temp && params.temp < 40))
    ) {
      if (!allowedCategories.includes("Topical")) {
        allowedCategories.push("Topical");
      }
    }
    // Include sleep when snow
    if (config?.includeSleepWhenSnow && condition === "snow") {
      tags.push("sleep");
    }

    // Exclude tags
    if (config?.excludeTags && config.excludeTags.length > 0) {
      tags = tags.filter((t) => !config.excludeTags.includes(t));
    }

    // 7. Build product query with filters
    const baseFilter =
      "_type==\"product\" && (!defined(isRecalled) || isRecalled != true)";
    const weatherFilter =
      "((defined(productType) && productType->title in $categories) || (defined(effects) && count(effects[@ in $tags]) > 0))";

    const listQuery = `*[${baseFilter} && ${weatherFilter}] | order(_updatedAt desc)[0...${maxItems}]{
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
      categories: allowedCategories,
      tags,
    });

    // 8. Fallback if no products found
    if (!products || products.length < minItems) {
      const fallbackMode = config?.fallbackMode || "time_of_day";
      logger.info(
        `Insufficient products for weather: ${condition}, using fallback: ${fallbackMode}`,
      );

      let fallbackQuery = "";
      if (fallbackMode === "top_sellers") {
        // Use some popularity metric if available
        fallbackQuery = `*[_type=="product" && (!defined(isRecalled) || isRecalled != true)] | order(coalesce(popularity, 0) desc, _updatedAt desc)[0...${maxItems}]{_id, name, "slug": slug.current, "image": image.asset->url, price, thcPercent, cbdPercent, strainType, "brand": brand->{name, "slug": slug.current}, "productType": productType->{title}}`;
      } else {
        // Default: latest products
        fallbackQuery = `*[_type=="product" && (!defined(isRecalled) || isRecalled != true)] | order(_updatedAt desc)[0...${maxItems}]{_id, name, "slug": slug.current, "image": image.asset->url, price, thcPercent, cbdPercent, strainType, "brand": brand->{name, "slug": slug.current}, "productType": productType->{title}}`;
      }

      products = await fetchCMS<any[]>(fallbackQuery, {});
    }

    // 9. Generate visual preset
    const presetResult = mapWeatherToPreset(
      condition,
      weatherSnapshot.dayPart,
      {
        visualStyle: config?.visualStyle,
        motionIntensity: config?.motionIntensity,
        particlesEnabled: config?.particlesEnabled,
        parallaxEnabled: config?.parallaxEnabled,
        paletteMode: config?.paletteMode,
        brandTintStrength: config?.brandTintStrength,
      },
      {
        temp: weatherSnapshot.temp,
        feelsLike: weatherSnapshot.feelsLike,
        wind: weatherSnapshot.wind,
        precipProb: weatherSnapshot.precipProb,
        cloudCover: weatherSnapshot.cloudCover,
      },
    );

    const styleHints = getStyleHints(presetResult.preset, presetResult.modifiers, {
      visualStyle: config?.visualStyle,
      motionIntensity: config?.motionIntensity,
      particlesEnabled: config?.particlesEnabled,
      parallaxEnabled: config?.parallaxEnabled,
    });

    // 10. Generate reason chips
    const weatherReason = getWeatherReason(condition, weatherSnapshot.temp);
    const reasonChips: string[] = [];
    if (config?.reasonChipsEnabled !== false) {
      const maxChips = config?.maxReasonChips || 3;
      if (weatherMap.biasTag) reasonChips.push(weatherMap.biasTag);
      if (condition === "rainy" || condition === "storm")
        reasonChips.push("cozy vibes");
      if (condition === "sunny" || condition === "clear")
        reasonChips.push("energizing");
      if (weatherSnapshot.temp && weatherSnapshot.temp < 40)
        reasonChips.push("warming");
      if (weatherSnapshot.temp && weatherSnapshot.temp > 85)
        reasonChips.push("refreshing");
      reasonChips.splice(maxChips); // limit to maxChips
    }

    // 11. Format products with reason tags
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
      reasonTag:
        reasonChips.length > 0 ? reasonChips[0] : weatherMap.description,
    }));

    // 12. Build response
    const response = {
      enabled: true,
      condition,
      tags: weatherMap.tags,
      description: weatherMap.description,
      products: formattedProducts,
      weather: {
        normalized: condition,
        temp: weatherSnapshot.temp ?? null,
        feelsLike: weatherSnapshot.feelsLike ?? null,
        wind: weatherSnapshot.wind ?? null,
        precipProb: weatherSnapshot.precipProb ?? null,
        cloudCover: weatherSnapshot.cloudCover ?? null,
        dayPart: weatherSnapshot.dayPart,
        units: weatherSnapshot.units,
        source: weatherSnapshot.source,
        provider: weatherSnapshot.provider || null,
        preset: presetResult.preset,
        modifiers: presetResult.modifiers,
        ttlSeconds: config?.weatherTtlSeconds || 1800,
      },
      visual: {
        enabled: config?.visualEnabled !== false,
        preset: presetResult.preset,
        modifiers: presetResult.modifiers,
        styleHints,
        visualStyle: config?.visualStyle || "premium_atmosphere",
        motionIntensity: config?.motionIntensity ?? 0.35,
        particlesEnabled: config?.particlesEnabled ?? true,
        parallaxEnabled: config?.parallaxEnabled ?? false,
        paletteMode: config?.paletteMode || "brand_tinted",
        brandTintStrength: config?.brandTintStrength ?? 0.15,
        transitionMs: config?.transitionMs || 450,
      },
      reasons: {
        title: weatherReason.primary,
        subtitle: weatherReason.secondary || null,
        chips: reasonChips,
        chipStyle: config?.chipStyle || "pill",
        whyModalEnabled: config?.whyModalEnabled !== false,
        whyModalCopy: config?.whyModalCopy || null,
      },
      compliance: {
        showMedicalDisclaimer: config?.showMedicalDisclaimer ?? true,
        disclaimerText: config?.disclaimerText || null,
        ageGateDependency: config?.ageGateDependency ?? true,
      },
      items: formattedProducts,
      ttlSeconds: config?.recommendationsTtlSeconds || 1800,
    };

    logger.info("weather_widget_impression", {
      brand,
      brandId,
      store,
      storeId,
      condition,
      itemCount: formattedProducts.length,
      source: weatherSnapshot.source,
      timestamp: new Date().toISOString(),
    });

    // Set cache headers
    const ttl = config?.recommendationsTtlSeconds || 1800;
    const swr = config?.staleWhileRevalidateSeconds || 86400;
    res.set(
      "Cache-Control",
      `public, max-age=${ttl}, stale-while-revalidate=${swr}`,
    );

    if (cacheEligible) {
      await writeCache(RECO_CACHE, recoCacheKey, response, ttl * 1000);
    }

    return res.json(response);
  } catch (error: any) {
    logger.error("recommendations.weather.error", error);
    res.status(500).json({ error: "Failed to fetch weather recommendations" });
  }
};

recommendationsRouter.get("/weather", handleWeatherRecommendations);
recommendationsRouter.get(
  "/weather-recommendations",
  handleWeatherRecommendations,
);

recommendationsRouter.post("/weather-recommendations/event", (req, res) => {
  try {
    const body = z
      .object({
        event: z.enum([
          "weather_widget_impression",
          "weather_widget_click",
          "weather_widget_product_click",
          "weather_widget_why_open",
        ]),
        brand: z.string().optional(),
        brandId: z.string().optional(),
        store: z.string().optional(),
        storeId: z.string().optional(),
        productId: z.string().optional(),
        reasonTag: z.string().optional(),
        condition: z.string().optional(),
        userId: z.string().optional(),
      })
      .parse(req.body || {});

    logger.info(body.event, {
      brand: body.brand,
      brandId: body.brandId,
      store: body.store,
      storeId: body.storeId,
      productId: body.productId,
      reasonTag: body.reasonTag,
      condition: body.condition,
      userId: body.userId || "anonymous",
      timestamp: new Date().toISOString(),
    });

    return res.json({ success: true });
  } catch (error: any) {
    logger.error("weather_widget_event.error", error);
    return res.status(400).json({ error: "INVALID_EVENT" });
  }
});
