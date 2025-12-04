import { Router } from "express";
import { z } from "zod";
import { fetchCMS } from "../../lib/cms";
import { isSanityConfigured } from "../../lib/sanityConfig";
import { defaultDemoTheme } from "../../lib/controlPlaneDefaults";

export const themeRouter = Router();

// GET /content/theme?brand=brandSlug
themeRouter.get("/", async (req, res) => {
  const q = z
    .object({ brand: z.string().optional(), store: z.string().optional() })
    .parse(req.query);
  const brand = q.brand && String(q.brand).trim();
  const store = q.store && String(q.store).trim();

  try {
    // Resolution: store override -> brand-level -> global default
    let storeTheme: any = null;
    let brandTheme: any = null;
    let globalTheme: any = null;

    if (isSanityConfigured() && brand && store) {
      const sq = `*[_type=="themeConfig" && brand->slug.current==$brand && store->slug.current==$store][0]{"brand":brand->slug.current, store:store->slug.current, primaryColor, secondaryColor, accentColor, backgroundColor, surfaceColor, textColor, mutedTextColor, "logoUrl":logo.asset->url, logoUrl, typography, darkModeEnabled, cornerRadius, elevationStyle}`;
      storeTheme = await fetchCMS(
        sq,
        { brand, store },
        { preview: (req as any).preview },
      );
    }
    if (isSanityConfigured() && brand) {
      const bq = `*[_type=="themeConfig" && brand->slug.current==$brand && !defined(store)][0]{"brand":brand->slug.current, primaryColor, secondaryColor, accentColor, backgroundColor, surfaceColor, textColor, mutedTextColor, "logoUrl":logo.asset->url, logoUrl, typography, darkModeEnabled, cornerRadius, elevationStyle}`;
      brandTheme = await fetchCMS(
        bq,
        { brand },
        { preview: (req as any).preview },
      );
    }
    // global default (no brand and no store)
    if (isSanityConfigured()) {
      const gq = `*[_type=="themeConfig" && !defined(brand) && !defined(store)][0]{primaryColor, secondaryColor, accentColor, backgroundColor, surfaceColor, textColor, mutedTextColor, "logoUrl":logo.asset->url, logoUrl, typography, darkModeEnabled, cornerRadius, elevationStyle}`;
      try {
        globalTheme = await fetchCMS(gq, {}, { preview: (req as any).preview });
      } catch {
        globalTheme = null;
      }
    }

    if (!isSanityConfigured() && !storeTheme && !brandTheme && !globalTheme) {
      globalTheme = defaultDemoTheme;
    }

    // pick base theme
    let merged: any = {};
    if (storeTheme) merged = Object.assign({}, storeTheme);
    else if (brandTheme) merged = Object.assign({}, brandTheme);
    else if (globalTheme) merged = Object.assign({}, globalTheme);

    if (!merged || Object.keys(merged).length === 0)
      return res.status(404).json({ error: "NOT_FOUND" });

    // Flatten response to the agreed contract
    const out = {
      brand: merged.brand || undefined,
      store: merged.store || undefined,
      primaryColor: merged.primaryColor || null,
      secondaryColor: merged.secondaryColor || null,
      accentColor: merged.accentColor || null,
      backgroundColor: merged.backgroundColor || null,
      surfaceColor: merged.surfaceColor || null,
      textColor: merged.textColor || null,
      mutedTextColor: merged.mutedTextColor || null,
      logoUrl: merged.logoUrl || merged.logo || null,
      darkModeEnabled: Boolean(merged.darkModeEnabled || false),
      cornerRadius: merged.cornerRadius || null,
      elevationStyle: merged.elevationStyle || null,
    };

    res.set(
      "Cache-Control",
      "public, max-age=86400, stale-while-revalidate=3600",
    );
    return res.json(out);
  } catch (err) {
    req.log.error("content.theme.fetch_failed", err);
    return res.status(500).json({ error: "FAILED" });
  }
});

export default themeRouter;
