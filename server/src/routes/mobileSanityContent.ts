import { Router, Request, Response } from "express";
import { z } from "zod";
import { fetchCMS } from "../lib/cms";
import { logger } from "../lib/logger";

/**
 * Mobile Sanity Content Router
 * 
 * Serves ALL Sanity CMS content directly to mobile app.
 * No PostgreSQL dependency - queries Sanity CMS in real-time.
 * 
 * Content Types Supported:
 * - Articles
 * - Categories  
 * - FAQ Items
 * - Banners
 * - Deals/Promos
 * - Legal Documents
 * - Products (from Sanity)
 * - Stores (from Sanity)
 * - Brands
 * - Accessibility Pages
 * - Awards Explainers
 * - Transparency Pages
 * - Theme Configuration
 * - Quiz
 * - Authors
 * - Effect Tags
 * - Filter Groups
 * - Product Types
 * - Organizations
 * - Personalization Rules
 */

export const mobileSanityRouter = Router();

const CATEGORY_PROJECTION = `*[_type in ["category", "shopCategory"] && coalesce(isActive, active, true)==true] | order(coalesce(name, title) asc){
  _id,
  "name": coalesce(name, title),
  "title": coalesce(title, name),
  "slug": coalesce(slug.current, key),
  "key": coalesce(key, slug.current),
  description,
  "image": coalesce(image.asset->url, icon.asset->url, heroImage.asset->url),
  "icon": iconEmoji,
  "color": color,
  _updatedAt
}`;

// ============================================================
// ARTICLES
// ============================================================

/**
 * GET /articles
 * Fetch all published articles from Sanity
 * 
 * Includes:
 * - Educational fields: points, viewCount, difficulty, estimatedCompletionTime
 * - Content: title, slug, excerpt, body
 * - Metadata: author, mainImage, publishedAt
 */
mobileSanityRouter.get("/articles", async (req: Request, res: Response) => {
  try {
    const { limit = 20, page = 1 } = z.object({
      limit: z.coerce.number().min(1).max(50).default(20),
      page: z.coerce.number().min(1).default(1)
    }).parse(req.query);

    const from = (page - 1) * limit;
    
    const articles = await fetchCMS(
      `*[_type=="article" && defined(publishedAt)] | order(publishedAt desc)[${from}...${from + limit}]{
        _id,
        title,
        "slug": slug.current,
        excerpt,
        body,
        "author": author->{name, "image": image.asset->url},
        "category": category->{name, "slug": slug.current},
        "mainImage": mainImage.asset->url,
        "image": mainImage.asset->url,
        publishedAt,
        readingTime,
        tags,
        points,
        viewCount,
        difficulty,
        estimatedCompletionTime,
        channels,
        published,
        _updatedAt
      }`,
      {}
    );

    const total = await fetchCMS('count(*[_type=="article" && defined(publishedAt)])', {});

    res.json({
      articles: articles || [],
      page,
      limit,
      total: total || 0
    });
  } catch (error: any) {
    logger.error("mobile.articles.error", error);
    res.json({ articles: [], page: 1, limit: 20, total: 0 });
  }
});

/**
 * GET /articles/:slug
 * Fetch single article by slug with all fields including educational metadata
 */
mobileSanityRouter.get("/articles/:slug", async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    
    const article = await fetchCMS(
      `*[_type=="article" && slug.current==$slug][0]{
        _id,
        title,
        "slug": slug.current,
        excerpt,
        body,
        "author": author->{name, bio, "image": image.asset->url},
        "category": category->{name, "slug": slug.current},
        "mainImage": mainImage.asset->url,
        "image": mainImage.asset->url,
        publishedAt,
        readingTime,
        tags,
        points,
        viewCount,
        difficulty,
        estimatedCompletionTime,
        channels,
        published,
        _updatedAt
      }`,
      { slug }
    );

    if (!article) {
      return res.status(404).json({ error: "Article not found" });
    }

    res.json({ article });
  } catch (error: any) {
    logger.error("mobile.article.error", error);
    res.status(500).json({ error: "Failed to fetch article" });
  }
});

/**
 * POST /articles/:slug/view
 * Track article view - increments viewCount in Sanity
 * 
 * This endpoint logs that a user has viewed/opened an article.
 * In production, this would increment the viewCount field in Sanity.
 * For now, logs the event for analytics purposes.
 */
mobileSanityRouter.post("/articles/:slug/view", async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const { userId } = req.body || {};
    
    // Log the view event for analytics
    logger.info("article.view", {
      slug,
      userId: userId || "anonymous",
      timestamp: new Date().toISOString()
    });

    // Note: In a production system with proper Sanity token permissions,
    // you would increment the viewCount here:
    // await sanityClient.patch(`article-${slug}`).inc({ viewCount: 1 }).commit();
    
    // For now, just acknowledge the event was logged
    res.json({ 
      success: true, 
      message: "View tracked",
      slug,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    logger.error("mobile.article.view.error", error);
    // Don't error on view tracking - it's not critical
    res.json({ success: true, message: "View event logged" });
  }
});

/**
 * GET /categories
 * Fetch all categories from Sanity
 */
mobileSanityRouter.get("/categories", async (req: Request, res: Response) => {
  try {
    const categories = await fetchCMS(CATEGORY_PROJECTION, {});

    res.json({ categories: categories || [] });
  } catch (error: any) {
    logger.error("mobile.categories.error", error);
    res.json({ categories: [] });
  }
});

// ============================================================
// FAQ ITEMS
// ============================================================

/**
 * GET /faq
 * Fetch all FAQ items from Sanity
 */
mobileSanityRouter.get("/faq", async (req: Request, res: Response) => {
  try {
    const { category } = z.object({
      category: z.string().optional()
    }).parse(req.query);

    const filter = category ? '&& category->slug.current==$category' : '';
    
    const faqs = await fetchCMS<any[]>(
      `*[_type=="faqItem" ${filter}] | order(order asc){
        _id,
        question,
        answer,
        "category": category->{name, "slug": slug.current},
        order,
        _updatedAt
      }`,
      { category }
    );

    // Group by category for mobile app convenience
    const grouped: Record<string, any[]> = {};
    (faqs || []).forEach((faq: any) => {
      const cat = faq.category?.name || 'General';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(faq);
    });

    res.json({ 
      faqs: faqs || [],
      grouped,
      categories: Object.keys(grouped)
    });
  } catch (error: any) {
    logger.error("mobile.faq.error", error);
    res.json({ faqs: [], grouped: {}, categories: [] });
  }
});

// ============================================================
// BANNERS
// ============================================================

/**
 * GET /banners
 * Fetch active banners from Sanity
 */
mobileSanityRouter.get("/banners", async (req: Request, res: Response) => {
  try {
    type HomeHeroSettings = {
      rotationMs?: number | null;
      autoplay?: boolean | null;
      transitionStyle?: "fade" | "slide" | "none" | null;
      homeCategoryLimit?: number | null;
    };

    const [banners, settings] = await Promise.all([
      fetchCMS(
        `*[_type=="banner" && coalesce(active, isActive, true)==true && (!defined(schedule.startAt) || schedule.startAt <= now()) && (!defined(schedule.endAt) || schedule.endAt >= now())] | order(priority desc){
          _id,
          title,
          headline,
          subheadline,
          "image": {
            "url": image.asset->url,
            "alt": image.alt
          },
          "cta": coalesce(ctaLabel, ctaText),
          "link": coalesce(link, ctaLink),
          rotationMsOverride,
          placement,
          priority,
          "startDate": schedule.startAt,
          "endDate": schedule.endAt,
          _updatedAt
        }`,
        {}
      ),
      fetchCMS<HomeHeroSettings | null>(
        `*[_type=="homeHeroSettings"][0]{
          rotationMs,
          autoplay,
          transitionStyle,
          homeCategoryLimit
        }`,
        {}
      ),
    ]);

    res.json({
      banners: banners || [],
      settings: {
        rotationMs: settings?.rotationMs ?? 15000,
        autoplay: settings?.autoplay ?? true,
        transitionStyle: settings?.transitionStyle ?? "fade",
        homeCategoryLimit:
          typeof settings?.homeCategoryLimit === "number" &&
          Number.isFinite(settings.homeCategoryLimit) &&
          settings.homeCategoryLimit > 0
            ? Math.floor(settings.homeCategoryLimit)
            : null,
      },
    });
  } catch (error: any) {
    logger.error("mobile.banners.error", error);
    res.json({
      banners: [],
      settings: {
        rotationMs: 15000,
        autoplay: true,
        transitionStyle: "fade",
        homeCategoryLimit: null,
      },
    });
  }
});

// ============================================================
// DEALS & PROMOS
// ============================================================

/**
 * GET /deals
 * Fetch active deals from Sanity
 */
mobileSanityRouter.get("/deals", async (req: Request, res: Response) => {
  try {
    const deals = await fetchCMS(
      `*[_type=="deal" && coalesce(active, isActive, true)==true && now() >= coalesce(startAt, startDate) && now() <= coalesce(endAt, endDate)] | order(priority desc){
        _id,
        title,
        description,
        "image": image.asset->url,
        "discountType": coalesce(discountType, dealType),
        discountValue,
        "promoCode": coalesce(promoCode, couponCode, code),
        "applicationType": coalesce(applicationType, select(defined(coalesce(promoCode, couponCode, code)) => "code", "auto")),
        "autoApply": coalesce(autoApply, !defined(coalesce(promoCode, couponCode, code))),
        "startAt": coalesce(startAt, startDate),
        "endAt": coalesce(endAt, endDate),
        "products": coalesce(products, applicableProducts)[]->{_id, name, "slug": slug.current},
        "categories": coalesce(categories, applicableCategoryRefs)[]->{_id, name, "slug": slug.current},
        "categoryKeys": applicableCategories,
        priority,
        _updatedAt
      }`,
      {}
    );

    res.json({ deals: deals || [] });
  } catch (error: any) {
    logger.error("mobile.deals.error", error);
    res.json({ deals: [] });
  }
});

/**
 * GET /promos
 * Fetch active promos from Sanity
 */
mobileSanityRouter.get("/promos", async (req: Request, res: Response) => {
  try {
    const promos = await fetchCMS(
      `*[_type=="promo" && coalesce(active, isActive, true)==true && (!defined(schedule.publishAt) || schedule.publishAt <= now()) && (!defined(schedule.unpublishAt) || schedule.unpublishAt >= now())] | order(priority desc){
        _id,
        title,
        description,
        "image": image.asset->url,
        "promoCode": coalesce(promoCode, code),
        "discountType": coalesce(discountType, select(defined(discountPercent) => "percent_off", defined(discountAmount) => "amount_off", defined(discount) => "percent_off", "percent_off")),
        "discountValue": coalesce(discountValue, discountPercent, discountAmount, discount),
        "discountPercent": coalesce(discountPercent, discount),
        discountAmount,
        "applicationType": coalesce(applicationType, select(defined(coalesce(promoCode, code)) => "code", "auto")),
        "autoApply": coalesce(autoApply, !defined(coalesce(promoCode, code))),
        "categories": categories[]->{_id, name, "slug": slug.current},
        "categoryKeys": applicableCategories,
        "validFrom": coalesce(validFrom, schedule.publishAt),
        "validUntil": coalesce(validUntil, schedule.unpublishAt),
        terms,
        _updatedAt
      }`,
      {}
    );

    res.json({ promos: promos || [] });
  } catch (error: any) {
    logger.error("mobile.promos.error", error);
    res.json({ promos: [] });
  }
});

// ============================================================
// LEGAL DOCUMENTS
// ============================================================

/**
 * GET /legal
 * Fetch all legal documents from Sanity
 */
mobileSanityRouter.get("/legal", async (req: Request, res: Response) => {
  try {
    const legal = await fetchCMS(
      `*[_type=="legalDoc"] | order(type asc){
        _id,
        title,
        type,
        "slug": slug.current,
        body,
        effectiveFrom,
        effectiveTo,
        version,
        _updatedAt
      }`,
      {}
    );

    res.json({ legal: legal || [] });
  } catch (error: any) {
    logger.error("mobile.legal.error", error);
    res.json({ legal: [] });
  }
});

/**
 * GET /legal/:type
 * Fetch specific legal document by type (terms, privacy, etc.)
 */
mobileSanityRouter.get("/legal/:type", async (req: Request, res: Response) => {
  try {
    const { type } = req.params;
    
    const doc = await fetchCMS(
      `*[_type=="legalDoc" && type==$type] | order(effectiveFrom desc)[0]{
        _id,
        title,
        type,
        "slug": slug.current,
        body,
        effectiveFrom,
        effectiveTo,
        version,
        _updatedAt
      }`,
      { type }
    );

    if (!doc) {
      return res.status(404).json({ error: "Legal document not found" });
    }

    res.json({ document: doc });
  } catch (error: any) {
    logger.error("mobile.legal.type.error", error);
    res.status(500).json({ error: "Failed to fetch legal document" });
  }
});

// ============================================================
// PRODUCTS (from Sanity)
// ============================================================

/**
 * GET /sanity-products
 * Fetch products from Sanity CMS (not PostgreSQL)
 */
mobileSanityRouter.get("/sanity-products", async (req: Request, res: Response) => {
  try {
    const { limit = 20, page = 1, category } = z.object({
      limit: z.coerce.number().min(1).max(50).default(20),
      page: z.coerce.number().min(1).default(1),
      category: z.string().optional()
    }).parse(req.query);

    const from = (page - 1) * limit;
    const filter = category ? '&& category->slug.current==$category' : '';
    
    const products = await fetchCMS(
      `*[_type=="product" ${filter}] | order(name asc)[${from}...${from + limit}]{
        _id,
        name,
        "slug": slug.current,
        description,
        "image": image.asset->url,
        "images": images[].asset->url,
        price,
        compareAtPrice,
        "category": category->{name, "slug": slug.current},
        "brand": brand->{name, "slug": slug.current},
        thcPercent,
        cbdPercent,
        strainType,
        weight,
        "effects": effects[]->{name, "slug": slug.current},
        inStock,
        _updatedAt
      }`,
      { category }
    );

    const total = await fetchCMS(`count(*[_type=="product" ${filter}])`, { category });

    res.json({
      products: products || [],
      page,
      limit,
      total: total || 0
    });
  } catch (error: any) {
    logger.error("mobile.sanity-products.error", error);
    res.json({ products: [], page: 1, limit: 20, total: 0 });
  }
});

// ============================================================
// STORES (from Sanity)
// ============================================================

/**
 * GET /sanity-stores
 * Fetch stores from Sanity CMS
 */
mobileSanityRouter.get("/sanity-stores", async (req: Request, res: Response) => {
  try {
    const stores = await fetchCMS<any[]>(
      `*[_type=="store"] | order(name asc){
        _id,
        name,
        "slug": slug.current,
        description,
        "image": banner.asset->url,
        "logo": logo.asset->url,
        address,
        address2,
        city,
        stateCode,
        zip,
        phone,
        email,
        hours,
        latitude,
        longitude,
        isActive,
        amenities,
        deliveryFee,
        minOrderAmount,
        deliveryRadius,
        isDeliveryEnabled,
        isPickupEnabled,
        _updatedAt
      }`,
      {}
    );

    const formattedStores = (stores || []).map((store) => ({
      ...store,
      state: store.stateCode || null,
      zipCode: store.zip || null,
    }));

    res.json({ stores: formattedStores });
  } catch (error: any) {
    logger.error("mobile.sanity-stores.error", error);
    res.json({ stores: [] });
  }
});

// ============================================================
// BRANDS
// ============================================================

/**
 * GET /brands
 * Fetch all brands from Sanity
 */
mobileSanityRouter.get("/brands", async (req: Request, res: Response) => {
  try {
    const brands = await fetchCMS(
      `*[_type=="brand"] | order(name asc){
        _id,
        name,
        "slug": slug.current,
        description,
        "logo": logo.asset->url,
        website,
        featured,
        _updatedAt
      }`,
      {}
    );

    res.json({ brands: brands || [] });
  } catch (error: any) {
    logger.error("mobile.brands.error", error);
    res.json({ brands: [] });
  }
});

// ============================================================
// ACCESSIBILITY PAGES
// ============================================================

/**
 * GET /accessibility
 * Fetch accessibility page content from Sanity
 */
mobileSanityRouter.get("/accessibility", async (req: Request, res: Response) => {
  try {
    const page = await fetchCMS(
      `*[_type=="accessibilityPage"][0]{
        _id,
        title,
        "slug": slug.current,
        introduction,
        body,
        features,
        contactInfo,
        lastReviewDate,
        _updatedAt
      }`,
      {}
    );

    res.json({ accessibility: page || null });
  } catch (error: any) {
    logger.error("mobile.accessibility.error", error);
    res.json({ accessibility: null });
  }
});

// ============================================================
// AWARDS EXPLAINER
// ============================================================

/**
 * GET /awards
 * Fetch awards explainer content from Sanity
 */
mobileSanityRouter.get("/awards", async (req: Request, res: Response) => {
  try {
    const awards = await fetchCMS(
      `*[_type=="awardsExplainer"] | order(order asc){
        _id,
        title,
        "slug": slug.current,
        description,
        body,
        "image": image.asset->url,
        criteria,
        order,
        _updatedAt
      }`,
      {}
    );

    res.json({ awards: awards || [] });
  } catch (error: any) {
    logger.error("mobile.awards.error", error);
    res.json({ awards: [] });
  }
});

// ============================================================
// TRANSPARENCY PAGES
// ============================================================

/**
 * GET /transparency
 * Fetch transparency page content from Sanity
 */
mobileSanityRouter.get("/transparency", async (req: Request, res: Response) => {
  try {
    const pages = await fetchCMS(
      `*[_type=="transparencyPage"] | order(order asc){
        _id,
        title,
        "slug": slug.current,
        description,
        body,
        "documents": documents[]{title, "file": file.asset->url},
        order,
        _updatedAt
      }`,
      {}
    );

    res.json({ transparencyPages: pages || [] });
  } catch (error: any) {
    logger.error("mobile.transparency.error", error);
    res.json({ transparencyPages: [] });
  }
});

// ============================================================
// THEME CONFIGURATION
// ============================================================

/**
 * GET /theme
 * Fetch theme configuration from Sanity
 */
mobileSanityRouter.get("/theme", async (req: Request, res: Response) => {
  try {
    const { brand, store } = z.object({
      brand: z.string().optional(),
      store: z.string().optional()
    }).parse(req.query);

    let query = '*[_type=="themeConfig"';
    const params: any = {};
    
    if (store && brand) {
      query += ' && brand->slug.current==$brand && store->slug.current==$store';
      params.brand = brand;
      params.store = store;
    } else if (brand) {
      query += ' && brand->slug.current==$brand && !defined(store)';
      params.brand = brand;
    } else {
      query += ' && !defined(brand) && !defined(store)';
    }
    
    query += `][0]{
      _id,
      primaryColor,
      secondaryColor,
      accentColor,
      backgroundColor,
      surfaceColor,
      textColor,
      mutedTextColor,
      "logo": logo.asset->url,
      typography,
      darkModeEnabled,
      cornerRadius,
      elevationStyle,
      screenBorderEnabled,
      screenBorderColor,
      screenBorderPattern,
      heroTitle,
      heroSubtitle,
      heroBackgroundColor,
      heroTextColor,
      "heroBackgroundImageUrl": heroBackgroundImage.asset->url,
      homeCategoryLimit,
      _updatedAt
    }`;

    const theme = await fetchCMS(query, params);

    res.json({ theme: theme || null });
  } catch (error: any) {
    logger.error("mobile.theme.error", error);
    res.json({ theme: null });
  }
});

// ============================================================
// QUIZ
// ============================================================

/**
 * GET /quizzes
 * Fetch all quizzes from Sanity
 */
mobileSanityRouter.get("/quizzes", async (req: Request, res: Response) => {
  try {
    const quizzes = await fetchCMS(
      `*[_type=="quiz" && isActive==true] | order(order asc){
        _id,
        title,
        "slug": slug.current,
        description,
        "image": image.asset->url,
        questions[]{
          question,
          options,
          correctAnswer,
          explanation
        },
        passingScore,
        timeLimit,
        order,
        _updatedAt
      }`,
      {}
    );

    res.json({ quizzes: quizzes || [] });
  } catch (error: any) {
    logger.error("mobile.quizzes.error", error);
    res.json({ quizzes: [] });
  }
});

/**
 * GET /quizzes/:slug
 * Fetch single quiz by slug
 */
mobileSanityRouter.get("/quizzes/:slug", async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    
    const quiz = await fetchCMS(
      `*[_type=="quiz" && slug.current==$slug][0]{
        _id,
        title,
        "slug": slug.current,
        description,
        "image": image.asset->url,
        questions[]{
          question,
          options,
          correctAnswer,
          explanation
        },
        passingScore,
        timeLimit,
        _updatedAt
      }`,
      { slug }
    );

    if (!quiz) {
      return res.status(404).json({ error: "Quiz not found" });
    }

    res.json({ quiz });
  } catch (error: any) {
    logger.error("mobile.quiz.error", error);
    res.status(500).json({ error: "Failed to fetch quiz" });
  }
});

// ============================================================
// AUTHORS
// ============================================================

/**
 * GET /authors
 * Fetch all authors from Sanity
 */
mobileSanityRouter.get("/authors", async (req: Request, res: Response) => {
  try {
    const authors = await fetchCMS(
      `*[_type=="author"] | order(name asc){
        _id,
        name,
        "slug": slug.current,
        bio,
        "image": image.asset->url,
        socialLinks,
        _updatedAt
      }`,
      {}
    );

    res.json({ authors: authors || [] });
  } catch (error: any) {
    logger.error("mobile.authors.error", error);
    res.json({ authors: [] });
  }
});

// ============================================================
// EFFECT TAGS
// ============================================================

/**
 * GET /effects
 * Fetch all effect tags from Sanity
 */
mobileSanityRouter.get("/effects", async (req: Request, res: Response) => {
  try {
    const effects = await fetchCMS(
      `*[_type=="effectTag"] | order(name asc){
        _id,
        name,
        "slug": slug.current,
        description,
        "icon": icon.asset->url,
        color,
        _updatedAt
      }`,
      {}
    );

    res.json({ effects: effects || [] });
  } catch (error: any) {
    logger.error("mobile.effects.error", error);
    res.json({ effects: [] });
  }
});

// ============================================================
// FILTER GROUPS
// ============================================================

/**
 * GET /filters
 * Fetch all filter groups from Sanity
 */
mobileSanityRouter.get("/filters", async (req: Request, res: Response) => {
  try {
    const filters = await fetchCMS(
      `*[_type=="filterGroup"] | order(order asc){
        _id,
        name,
        "slug": slug.current,
        type,
        options[]{
          label,
          value
        },
        order,
        _updatedAt
      }`,
      {}
    );

    res.json({ filters: filters || [] });
  } catch (error: any) {
    logger.error("mobile.filters.error", error);
    res.json({ filters: [] });
  }
});

// ============================================================
// PRODUCT TYPES
// ============================================================

/**
 * GET /product-types
 * Fetch all product types from Sanity
 */
mobileSanityRouter.get("/product-types", async (req: Request, res: Response) => {
  try {
    const productTypes = await fetchCMS(
      `*[_type=="productType"] | order(name asc){
        _id,
        name,
        "slug": slug.current,
        description,
        "image": image.asset->url,
        _updatedAt
      }`,
      {}
    );

    res.json({ productTypes: productTypes || [] });
  } catch (error: any) {
    logger.error("mobile.product-types.error", error);
    res.json({ productTypes: [] });
  }
});

// ============================================================
// ORGANIZATIONS
// ============================================================

/**
 * GET /organizations
 * Fetch all organizations from Sanity
 */
mobileSanityRouter.get("/organizations", async (req: Request, res: Response) => {
  try {
    const organizations = await fetchCMS(
      `*[_type=="organization"] | order(name asc){
        _id,
        name,
        "slug": slug.current,
        description,
        "logo": logo.asset->url,
        website,
        _updatedAt
      }`,
      {}
    );

    res.json({ organizations: organizations || [] });
  } catch (error: any) {
    logger.error("mobile.organizations.error", error);
    res.json({ organizations: [] });
  }
});

// ============================================================
// PERSONALIZATION RULES
// ============================================================

/**
 * GET /personalization
 * Fetch personalization rules from Sanity
 */
mobileSanityRouter.get("/personalization", async (req: Request, res: Response) => {
  try {
    const { context } = z.object({
      context: z.string().optional()
    }).parse(req.query);

    const filter = context ? '&& context==$context' : '';
    
    const rules = await fetchCMS(
      `*[_type=="personalizationRule" && isActive==true ${filter}] | order(priority desc){
        _id,
        name,
        context,
        conditions,
        actions,
        priority,
        isActive,
        _updatedAt
      }`,
      { context }
    );

    res.json({ rules: rules || [] });
  } catch (error: any) {
    logger.error("mobile.personalization.error", error);
    res.json({ rules: [] });
  }
});

// ============================================================
// CONTENT METRICS
// ============================================================

/**
 * GET /metrics
 * Fetch content metrics from Sanity
 */
mobileSanityRouter.get("/metrics", async (req: Request, res: Response) => {
  try {
    const metrics = await fetchCMS(
      `*[_type=="contentMetric"] | order(_createdAt desc)[0...50]{
        _id,
        contentType,
        contentId,
        views,
        engagement,
        _createdAt,
        _updatedAt
      }`,
      {}
    );

    res.json({ metrics: metrics || [] });
  } catch (error: any) {
    logger.error("mobile.metrics.error", error);
    res.json({ metrics: [] });
  }
});

// ============================================================
// COMPLIANCE
// ============================================================

/**
 * GET /compliance
 * Fetch compliance information from Sanity
 */
mobileSanityRouter.get("/compliance", async (req: Request, res: Response) => {
  try {
    const [monitors, snapshots] = await Promise.all([
      fetchCMS(
        `*[_type=="complianceMonitor"] | order(_updatedAt desc)[0...10]{
          _id,
          title,
          status,
          lastChecked,
          issues,
          _updatedAt
        }`,
        {}
      ),
      fetchCMS(
        `*[_type=="complianceSnapshot"] | order(date desc)[0...10]{
          _id,
          date,
          overallScore,
          categories,
          _updatedAt
        }`,
        {}
      )
    ]);

    res.json({ 
      monitors: monitors || [],
      snapshots: snapshots || []
    });
  } catch (error: any) {
    logger.error("mobile.compliance.error", error);
    res.json({ monitors: [], snapshots: [] });
  }
});

// ============================================================
// HERO FOOTER
// ============================================================

const HERO_FOOTER_QUERY = `*[_type == "heroFooter" && !(_id in path("drafts.**"))] | order(_updatedAt desc)[0] {
  _id, title, subtitle, cta, link,
  image { ..., asset->{ url } },
  backgroundColor, textColor
}`;

/**
 * GET /hero-footer
 * Fetch the singleton hero footer document from Sanity.
 * Returns { footer: {...} } or { footer: null } when no document exists.
 */
mobileSanityRouter.get("/hero-footer", async (req: Request, res: Response) => {
  try {
    const footer = await fetchCMS(HERO_FOOTER_QUERY, {});
    res.json({ footer: footer || null });
  } catch (error: any) {
    logger.error("mobile.hero-footer.error", error);
    res.json({ footer: null });
  }
});

// ============================================================
// PRODUCT DROPS
// ============================================================

/**
 * GET /product-drops
 * Fetch product drops/launches from Sanity
 */
mobileSanityRouter.get("/product-drops", async (req: Request, res: Response) => {
  try {
    const drops = await fetchCMS(
      `*[_type=="productDrop" && releaseDate >= now()] | order(releaseDate asc){
        _id,
        title,
        description,
        "image": image.asset->url,
        releaseDate,
        "products": products[]->{_id, name, "slug": slug.current, "image": image.asset->url},
        notifyEnabled,
        _updatedAt
      }`,
      {}
    );

    res.json({ productDrops: drops || [] });
  } catch (error: any) {
    logger.error("mobile.product-drops.error", error);
    res.json({ productDrops: [] });
  }
});

// ============================================================
// VARIANT INVENTORY
// ============================================================

/**
 * GET /inventory/:productId
 * Fetch variant inventory for a product from Sanity
 */
mobileSanityRouter.get("/inventory/:productId", async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    
    const inventory = await fetchCMS(
      `*[_type=="variantInventory" && product._ref==$productId]{
        _id,
        "variant": variant->{name, sku, price},
        "store": store->{name, "slug": slug.current},
        quantity,
        lastUpdated,
        _updatedAt
      }`,
      { productId }
    );

    res.json({ inventory: inventory || [] });
  } catch (error: any) {
    logger.error("mobile.inventory.error", error);
    res.json({ inventory: [] });
  }
});

// ============================================================
// PRODUCT RECALL AUDITS
// ============================================================

/**
 * GET /recalls
 * Fetch product recall audits from Sanity
 */
mobileSanityRouter.get("/recalls", async (req: Request, res: Response) => {
  try {
    const recalls = await fetchCMS(
      `*[_type=="productRecallAudit"] | order(date desc){
        _id,
        title,
        date,
        description,
        "products": affectedProducts[]->{_id, name, "slug": slug.current},
        status,
        resolution,
        _updatedAt
      }`,
      {}
    );

    res.json({ recalls: recalls || [] });
  } catch (error: any) {
    logger.error("mobile.recalls.error", error);
    res.json({ recalls: [] });
  }
});

// ============================================================
// ANALYTICS SETTINGS
// ============================================================

/**
 * GET /analytics-settings
 * Fetch analytics settings from Sanity
 */
mobileSanityRouter.get("/analytics-settings", async (req: Request, res: Response) => {
  try {
    const settings = await fetchCMS(
      `*[_type=="analyticsSettings"][0]{
        _id,
        trackingEnabled,
        gaId,
        fbPixelId,
        customEvents,
        _updatedAt
      }`,
      {}
    );

    res.json({ settings: settings || null });
  } catch (error: any) {
    logger.error("mobile.analytics-settings.error", error);
    res.json({ settings: null });
  }
});

// ============================================================
// UNIFIED CONTENT ENDPOINT
// ============================================================

/**
 * GET /all
 * Fetch all content types in a single request (for initial app load)
 */
mobileSanityRouter.get("/all", async (req: Request, res: Response) => {
  try {
    type HomeHeroSettings = {
      homeCategoryLimit?: number | null;
    };

    const [
      articles,
      categories,
      faqs,
      banners,
      promos,
      deals,
      brands,
      theme,
      effects,
      homeHeroSettings,
      heroFooter
    ] = await Promise.all([
      fetchCMS('*[_type=="article" && defined(publishedAt)] | order(publishedAt desc)[0...10]{_id, title, "slug": slug.current, excerpt, "mainImage": mainImage.asset->url, publishedAt}', {}),
      fetchCMS(CATEGORY_PROJECTION, {}),
      fetchCMS('*[_type=="faqItem"] | order(order asc){_id, question, answer, "category": category->name}', {}),
      fetchCMS('*[_type=="banner" && coalesce(active, isActive, true)==true && (!defined(schedule.startAt) || schedule.startAt <= now()) && (!defined(schedule.endAt) || schedule.endAt >= now())] | order(priority desc){_id, title, "subtitle": coalesce(subheadline, subtitle), "image": image.asset->url, "link": coalesce(link, ctaLink)}', {}),
      fetchCMS('*[_type=="promo" && coalesce(active, isActive, true)==true && (!defined(schedule.publishAt) || schedule.publishAt <= now()) && (!defined(schedule.unpublishAt) || schedule.unpublishAt >= now())] | order(priority desc){_id, title, description, "image": image.asset->url, "promoCode": coalesce(promoCode, code), "discountType": coalesce(discountType, select(defined(discountPercent) => "percent_off", defined(discountAmount) => "amount_off", defined(discount) => "percent_off", "percent_off")), "discountValue": coalesce(discountValue, discountPercent, discountAmount, discount), "discountPercent": coalesce(discountPercent, discount), discountAmount, "applicationType": coalesce(applicationType, select(defined(coalesce(promoCode, code)) => "code", "auto")), "autoApply": coalesce(autoApply, !defined(coalesce(promoCode, code))), "categories": categories[]->{_id, name, "slug": slug.current}, "categoryKeys": applicableCategories, "validFrom": coalesce(validFrom, schedule.publishAt), "validUntil": coalesce(validUntil, schedule.unpublishAt), terms, _updatedAt}', {}),
      fetchCMS('*[_type=="deal" && coalesce(active, isActive, true)==true && now() >= coalesce(startAt, startDate) && now() <= coalesce(endAt, endDate)] | order(priority desc)[0...5]{_id, title, description, "discountType": coalesce(discountType, dealType), discountValue, "promoCode": coalesce(promoCode, couponCode, code), "applicationType": coalesce(applicationType, select(defined(coalesce(promoCode, couponCode, code)) => "code", "auto")), "autoApply": coalesce(autoApply, !defined(coalesce(promoCode, couponCode, code))), "categoryKeys": applicableCategories}', {}),
      fetchCMS('*[_type=="brand"] | order(name asc){_id, name, "slug": slug.current, "logo": logo.asset->url}', {}),
      fetchCMS('*[_type=="themeConfig" && !defined(brand) && !defined(store)][0]{primaryColor, secondaryColor, accentColor, backgroundColor, textColor, "logo": logo.asset->url, screenBorderEnabled, screenBorderColor, screenBorderPattern, heroTitle, heroSubtitle, heroBackgroundColor, heroTextColor, "heroBackgroundImageUrl": heroBackgroundImage.asset->url, homeCategoryLimit, heroFooterTitle, heroFooterSubtitle, heroFooterBackgroundColor, heroFooterTextColor, heroFooterBackgroundImageUrl}', {}),
      fetchCMS('*[_type=="effectTag"] | order(name asc){_id, name, "slug": slug.current, color}', {}),
      fetchCMS<HomeHeroSettings | null>(
        `*[_type=="homeHeroSettings"][0]{
          homeCategoryLimit
        }`,
        {},
      ),
      fetchCMS(HERO_FOOTER_QUERY, {}),
    ]);

    // Prefer themeConfig.homeCategoryLimit, fall back to homeHeroSettings
    const rawLimit =
      (theme as any)?.homeCategoryLimit ?? homeHeroSettings?.homeCategoryLimit;
    const resolvedHomeCategoryLimit =
      typeof rawLimit === "number" &&
      Number.isFinite(rawLimit) &&
      rawLimit > 0
        ? Math.floor(rawLimit)
        : null;

    const homeCategories =
      resolvedHomeCategoryLimit && Array.isArray(categories)
        ? categories.slice(0, resolvedHomeCategoryLimit)
        : categories;

    res.json({
      articles: articles || [],
      categories: homeCategories || [],
      faqs: faqs || [],
      banners: banners || [],
      promos: promos || [],
      deals: deals || [],
      brands: brands || [],
      theme: theme || null,
      effects: effects || [],
      heroFooter: heroFooter || null,
      settings: {
        homeCategoryLimit: resolvedHomeCategoryLimit,
      },
      lastSync: new Date().toISOString()
    });
  } catch (error: any) {
    logger.error("mobile.all.error", error);
    res.status(500).json({ error: "Failed to fetch content" });
  }
});

// ============================================================
// CONVENIENCE ALIASES
// These provide simpler URLs for common mobile app requests
// ============================================================

/**
 * GET /products
 * Alias for /sanity-products - Simple product listing from Sanity
 */
mobileSanityRouter.get("/products", async (req: Request, res: Response) => {
  try {
    const { limit = 20, page = 1, category } = z.object({
      limit: z.coerce.number().min(1).max(50).default(20),
      page: z.coerce.number().min(1).default(1),
      category: z.string().optional()
    }).parse(req.query);

    const from = (page - 1) * limit;
    const filter = category ? '&& (category->slug.current==$category || productType->slug.current==$category)' : '';
    
    const products = await fetchCMS(
      `*[_type=="product" ${filter}] | order(name asc)[${from}...${from + limit}]{
        _id,
        name,
        "slug": slug.current,
        description,
        "image": image.asset->url,
        price,
        "category": category->{name, "slug": slug.current},
        "brand": brand->{name, "slug": slug.current},
        "productType": productType->{name, "slug": slug.current},
        effects,
        availability,
        _updatedAt
      }`,
      { category }
    );

    // Return simple format for mobile app
    res.json({
      products: products || []
    });
  } catch (error: any) {
    logger.error("mobile.products.error", error);
    res.json({ products: [] });
  }
});

/**
 * GET /stores
 * Alias for /sanity-stores - Simple store listing from Sanity
 */
mobileSanityRouter.get("/stores", async (req: Request, res: Response) => {
  try {
    const stores = await fetchCMS(
      `*[_type=="store" && isActive==true] | order(name asc){
        _id,
        name,
        "slug": slug.current,
        address,
        city,
        "state": stateCode,
        "zipCode": zip,
        phone,
        "brand": brand->{name, "slug": slug.current},
        isActive,
        _updatedAt
      }`,
      {}
    );

    // Return simple format for mobile app
    res.json({
      stores: stores || []
    });
  } catch (error: any) {
    logger.error("mobile.stores.error", error);
    res.json({ stores: [] });
  }
});

export default mobileSanityRouter;
