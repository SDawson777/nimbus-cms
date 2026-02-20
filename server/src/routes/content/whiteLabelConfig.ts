import { Router } from "express";
import { z } from "zod";
import { fetchCMS } from "../../lib/cms";

export const whiteLabelConfigRouter = Router();

// GET /content/white-label-config?brand=brandSlug&store=storeSlug&preview=true
whiteLabelConfigRouter.get("/", async (req, res) => {
  const q = z
    .object({
      brand: z.string().optional(),
      store: z.string().optional(),
      brandId: z.string().optional(),
      storeId: z.string().optional(),
      orgId: z.string().optional(),
      preview: z.coerce.boolean().optional(),
    })
    .parse(req.query);
  const brand = q.brand && String(q.brand).trim();
  const store = q.store && String(q.store).trim();
  const brandId = q.brandId && String(q.brandId).trim();
  const storeId = q.storeId && String(q.storeId).trim();

  try {
    // Resolution: store override -> brand-level -> global default
    let storeConfig: any = null;
    let brandConfig: any = null;

    if (brandId && storeId) {
      const sq = `*[_type=="whiteLabelConfig" && brand._ref==$brandId && store._ref==$storeId][0]{
        "brand": brand->slug.current,
        "store": store->slug.current,
        weatherRecommendationsWidget
      }`;
      storeConfig = await fetchCMS(
        sq,
        { brandId, storeId },
        { preview: q.preview || (req as any).preview },
      );
    } else if (brand && store) {
      const sq = `*[_type=="whiteLabelConfig" && brand->slug.current==$brand && store->slug.current==$store][0]{
        "brand": brand->slug.current,
        "store": store->slug.current,
        weatherRecommendationsWidget
      }`;
      storeConfig = await fetchCMS(
        sq,
        { brand, store },
        { preview: q.preview || (req as any).preview },
      );
    }
    if (brandId) {
      const bq = `*[_type=="whiteLabelConfig" && brand._ref==$brandId && !defined(store)][0]{
        "brand": brand->slug.current,
        weatherRecommendationsWidget
      }`;
      brandConfig = await fetchCMS(
        bq,
        { brandId },
        { preview: q.preview || (req as any).preview },
      );
    } else if (brand) {
      const bq = `*[_type=="whiteLabelConfig" && brand->slug.current==$brand && !defined(store)][0]{
        "brand": brand->slug.current,
        weatherRecommendationsWidget
      }`;
      brandConfig = await fetchCMS(
        bq,
        { brand },
        { preview: q.preview || (req as any).preview },
      );
    }

    // pick base config
    let config: any = {};
    if (storeConfig) config = storeConfig;
    else if (brandConfig) config = brandConfig;

    if (!config || Object.keys(config).length === 0) {
      return res.status(404).json({ error: "NOT_FOUND" });
    }

    // Strip any admin-only fields and return mobile-safe config
    const widget = config.weatherRecommendationsWidget || {};

    const out = {
      brand: config.brand || undefined,
      store: config.store || undefined,
      weatherRecommendationsWidget: {
        enabled: Boolean(widget.enabled || false),
        placement: widget.placement || "home_top",
        priority: widget.priority ?? 10,
        title: widget.title || "Recommended for today",
        subtitle: widget.subtitle || null,
        ctaText: widget.ctaText || "See all",
        ctaRoute: widget.ctaRoute || "WeatherPicks",
        locationSource: widget.locationSource || "hybrid",
        units: widget.units || "inherit_device",
        fallbackMode: widget.fallbackMode || "time_of_day",
        visualEnabled: Boolean(widget.visualEnabled ?? true),
        visualStyle: widget.visualStyle || "premium_atmosphere",
        motionIntensity: widget.motionIntensity ?? 0.35,
        particlesEnabled: Boolean(widget.particlesEnabled ?? true),
        parallaxEnabled: Boolean(widget.parallaxEnabled || false),
        transitionMs: widget.transitionMs ?? 450,
        reducedMotionOverride: widget.reducedMotionOverride || "follow_os",
        paletteMode: widget.paletteMode || "brand_tinted",
        brandTintStrength: widget.brandTintStrength ?? 0.15,
        maxItems: widget.maxItems ?? 6,
        minItems: widget.minItems ?? 3,
        allowCategories: widget.allowCategories || null,
        excludeCategories: widget.excludeCategories || null,
        excludeTags: widget.excludeTags || null,
        includeTopicalsWhenCold: Boolean(widget.includeTopicalsWhenCold || false),
        includeSleepWhenSnow: Boolean(widget.includeSleepWhenSnow ?? true),
        upliftBiasWhenSunny: widget.upliftBiasWhenSunny ?? 0.3,
        relaxBiasWhenRainy: widget.relaxBiasWhenRainy ?? 0.4,
        cozyBiasWhenCold: widget.cozyBiasWhenCold ?? 0.35,
        reasonChipsEnabled: Boolean(widget.reasonChipsEnabled ?? true),
        maxReasonChips: widget.maxReasonChips ?? 3,
        chipStyle: widget.chipStyle || "pill",
        whyModalEnabled: Boolean(widget.whyModalEnabled ?? true),
        whyModalCopy: widget.whyModalCopy || null,
        showMedicalDisclaimer: Boolean(widget.showMedicalDisclaimer ?? true),
        disclaimerText: widget.disclaimerText || null,
        ageGateDependency: Boolean(widget.ageGateDependency ?? true),
        weatherTtlSeconds: widget.weatherTtlSeconds ?? 1800,
        recommendationsTtlSeconds: widget.recommendationsTtlSeconds ?? 1800,
        staleWhileRevalidateSeconds: widget.staleWhileRevalidateSeconds ?? 86400,
        // Do NOT expose providerMode, provider, or providerConfigRef to mobile
      },
    };

    res.set(
      "Cache-Control",
      "public, max-age=1800, stale-while-revalidate=86400",
    );
    return res.json(out);
  } catch (err) {
    req.log.error("content.whiteLabelConfig.fetch_failed", err);
    return res.status(500).json({ error: "FAILED" });
  }
});

export default whiteLabelConfigRouter;
