import express from "express";
import { z } from "zod";
import { requireRoleV2 } from "../middleware/requireRole";
import { Role } from "../types/roles";
import { logger } from "../lib/logger";
import OpenAI from "openai";
import { ensureCsrfCookie, requireCsrfToken } from "../middleware/requireCsrfToken";
import { createWriteClient } from "../lib/cms";

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function toPortableTextBlocks(text: string) {
  const paragraphs = String(text || "").split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
  return paragraphs.map((p) => ({
    _type: "block",
    style: "normal",
    markDefs: [],
    children: [
      { _type: "span", text: p, marks: [] },
    ],
  }));
}

const router = express.Router();

/**
 * @openapi
 * /api/v1/nimbus/ai/chat:
 *   post:
 *     tags:
 *       - AI
 *     summary: Send a message to the AI chat assistant
 *     description: Interact with the Nimbus CMS AI assistant for content recommendations and support
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *                 description: User's chat message
 *                 example: "How do I create a new article?"
 *               context:
 *                 type: string
 *                 description: Optional context (e.g., current page, recent actions)
 *     responses:
 *       200:
 *         description: AI response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 reply:
 *                   type: string
 *                   example: "To create a new article, navigate to the Content section..."
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post(
  "/chat",
  requireRoleV2([Role.Admin, Role.Editor, Role.Viewer]),
  async (req, res) => {
    try {
      const parsed = z
        .object({
          message: z.string().min(1, "Message is required"),
          context: z.string().optional(),
        })
        .safeParse(req.body || {});

      if (!parsed.success) {
        return res.status(400).json({
          code: "INVALID_MESSAGE",
          message: "Message is required and must be a string",
          details: parsed.error.issues,
        });
      }

      const { message, context } = parsed.data;
      const apiKey = (process.env.OPENAI_API_KEY || "").trim();
      const aiModel = (process.env.OPENAI_MODEL || "gpt-4o-mini").trim();

      let reply: string | undefined;

      if (apiKey) {
        try {
          const openai = new OpenAI({ apiKey });
          const completion = await openai.chat.completions.create({
            model: aiModel,
            messages: [
              {
                role: "system",
                content:
                  "You are Nimbus CMS Concierge, a concise assistant for admins. Keep replies under 120 words, give actionable steps, and avoid guessing metrics.",
              },
              {
                role: "user",
                content: message,
              },
              ...(context
                ? [
                    {
                      role: "system" as const,
                      content: `Context: ${context}`,
                    },
                  ]
                : []),
            ],
            temperature: 0.3,
            max_tokens: 240,
          });

          reply = completion.choices?.[0]?.message?.content?.trim();
        } catch (error: any) {
          logger.error("AI chat provider error", error);
        }
      }

      const friendlyFallback =
        "I’m on it. For quick wins: review pipeline health, confirm compliance attestations, and refresh personalization to boost conversions.";

      res.json({
        reply: reply || friendlyFallback,
        echo: { context, message },
        provider: apiKey ? "openai" : "static-fallback",
      });
    } catch (error: any) {
      logger.error("AI chat error", error);
      res.status(500).json({
        code: "AI_ERROR",
        message: "Failed to process AI request",
      });
    }
  },
);

export default router;

/**
 * @openapi
 * /api/v1/nimbus/ai/drafts:
 *   post:
 *     tags:
 *       - AI
 *     summary: Generate article content and save a draft to Sanity
 *     description: Uses AI (when configured) to generate content, then saves a draft Article document to Sanity and returns a Studio edit URL.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *               prompt:
 *                 type: string
 *               excerpt:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               dryRun:
 *                 type: boolean
 *                 description: If true, do not persist to Sanity; return a simulated Studio URL.
 *     responses:
 *       201:
 *         description: Draft created
 *       202:
 *         description: Preview generated; persistence skipped (dryRun or missing token)
 */
router.post(
  "/drafts",
  async (req, res) => {
    try {
      const parsed = z
        .object({
          title: z.string().min(4),
          prompt: z.string().optional(),
          excerpt: z.string().optional(),
          tags: z.array(z.string()).optional(),
          dryRun: z.boolean().optional(),
        })
        .safeParse(req.body || {});
      if (!parsed.success) {
        return res.status(400).json({ ok: false, error: "invalid payload", details: parsed.error.issues });
      }
      const { title, prompt, excerpt, tags, dryRun } = parsed.data;
      const aiKey = (process.env.OPENAI_API_KEY || "").trim();
      const aiModel = (process.env.OPENAI_MODEL || "gpt-4o-mini").trim();

      let generated = prompt || title;
      if (aiKey) {
        try {
          const openai = new OpenAI({ apiKey: aiKey });
          const completion = await openai.chat.completions.create({
            model: aiModel,
            messages: [
              { role: "system", content: "Generate 4-6 concise paragraphs suitable for a blog article. Avoid headings. Separate paragraphs with blank lines." },
              { role: "user", content: prompt || `Write an article titled: ${title}` },
            ],
            temperature: 0.5,
            max_tokens: 600,
          });
          generated = completion.choices?.[0]?.message?.content?.trim() || generated;
        } catch (e) {
          logger.warn("AI generation failed, using fallback", e as any);
        }
      }

      const blocks = toPortableTextBlocks(generated);
      const slug = slugify(title).slice(0, 120) || `article-${Date.now()}`;
      const doc: any = {
        _type: "greenhouseArticle",
        title,
        slug: { _type: "slug", current: slug },
        excerpt: excerpt || (blocks[0]?.children?.[0]?.text || ""),
        body: blocks,
        tags: Array.isArray(tags) ? tags : [],
        status: "draft",
      };

      const token =
        process.env.SANITY_API_TOKEN ||
        process.env.SANITY_AUTH_TOKEN ||
        process.env.SANITY_TOKEN || "";
      const canWrite = Boolean(token.trim()) && !dryRun;

      if (!canWrite) {
        // Simulate a Studio URL
        const studioBase = (process.env.STUDIO_ORIGIN || "/studio").replace(/\/$/, "");
        const simulatedId = `draft-preview-${Date.now()}`;
        const studioUrl = `${studioBase}/desk/greenhouseArticle;${simulatedId}`;
        return res.status(202).json({ ok: true, previewOnly: true, studioUrl, data: doc });
      }

      const client = createWriteClient();
      const created = await client.create(doc);
      const studioBase = (process.env.STUDIO_ORIGIN || "/studio").replace(/\/$/, "");
      const studioUrl = `${studioBase}/desk/greenhouseArticle;${created._id}`;
      return res.status(201).json({ ok: true, id: created._id, studioUrl });
    } catch (err: any) {
      logger.error("AI draft error", err);
      return res.status(500).json({ ok: false, error: "failed to create draft" });
    }
  },
);

// Mobile AI recommendations endpoint - no authentication required
const recommendProductsSchema = z.object({
  desiredEffects: z.array(z.string()).optional().default([]),
  experienceLevel: z.enum(['new', 'regular', 'heavy']).optional().default('regular'),
  budgetLevel: z.enum(['low', 'medium', 'high']).optional().default('medium'),
  preferredCategories: z.array(z.string()).optional().default([]),
  limit: z.number().min(1).max(20).optional().default(5)
});

// Effect mappings for different strain types
const EFFECT_MAPPINGS = {
  'Relaxed': ['Flower', 'Edibles', 'Tincture'],
  'Happy': ['Flower', 'PreRoll', 'Vape'],
  'Euphoric': ['Flower', 'Vape', 'Concentrate'],
  'Focused': ['Vape', 'PreRoll', 'Flower'],
  'Creative': ['Flower', 'Vape', 'PreRoll'],
  'Energetic': ['Vape', 'PreRoll', 'Beverage'],
  'Sleepy': ['Edibles', 'Tincture', 'Topical'],
  'Hungry': ['Edibles', 'Flower'],
  'Pain Relief': ['Topical', 'Tincture', 'Edibles'],
  'Stress Relief': ['Tincture', 'Edibles', 'Topical']
};

// Experience level to price/potency mapping
const EXPERIENCE_MAPPINGS = {
  'new': { maxPrice: 30, preferredCategories: ['Edibles', 'Tincture', 'Topical'] },
  'regular': { maxPrice: 50, preferredCategories: ['Flower', 'PreRoll', 'Vape'] },
  'heavy': { maxPrice: 100, preferredCategories: ['Concentrate', 'Vape', 'Flower'] }
};

// Budget level to price ranges
const BUDGET_MAPPINGS = {
  'low': { minPrice: 0, maxPrice: 25 },
  'medium': { minPrice: 15, maxPrice: 50 },
  'high': { minPrice: 35, maxPrice: 200 }
};

// Generate AI-like recommendation explanations
function generateRecommendationReason(product: any, effects: string[], experienceLevel: string): string {
  const reasons: string[] = [];
  
  // Effect-based reasoning
  if (effects.length > 0) {
    const matchingEffect = effects.find(effect => 
      EFFECT_MAPPINGS[effect as keyof typeof EFFECT_MAPPINGS]?.includes(product.category)
    );
    if (matchingEffect) {
      reasons.push(`Great for ${matchingEffect.toLowerCase()} effects`);
    }
  }
  
  // Experience level reasoning
  if (experienceLevel === 'new') {
    if (['Edibles', 'Tincture', 'Topical'].includes(product.category)) {
      reasons.push('Perfect for beginners');
    }
  } else if (experienceLevel === 'heavy') {
    if (['Concentrate', 'Vape'].includes(product.category)) {
      reasons.push('High potency for experienced users');
    }
  }
  
  // Brand/quality reasoning
  if (product.brand === 'Nimbus') {
    reasons.push('Premium Nimbus quality');
  }
  
  // Price reasoning
  if (product.price <= 20) {
    reasons.push('Great value');
  } else if (product.price >= 50) {
    reasons.push('Premium option');
  }
  
  return reasons.length > 0 ? reasons[0] : `Popular ${product.category.toLowerCase()}`;
}

// Calculate recommendation score
function calculateScore(product: any, criteria: {
  desiredEffects: string[];
  experienceLevel: string;
  budgetLevel: string;
  preferredCategories: string[];
}): number {
  let score = 0;
  
  // Effect matching (highest weight)
  if (criteria.desiredEffects.length > 0) {
    const effectMatches = criteria.desiredEffects.filter(effect =>
      EFFECT_MAPPINGS[effect as keyof typeof EFFECT_MAPPINGS]?.includes(product.category)
    ).length;
    score += effectMatches * 30;
  }
  
  // Experience level matching
  const expMapping = EXPERIENCE_MAPPINGS[criteria.experienceLevel as keyof typeof EXPERIENCE_MAPPINGS];
  if (expMapping.preferredCategories.includes(product.category)) {
    score += 20;
  }
  if (product.price <= expMapping.maxPrice) {
    score += 15;
  }
  
  // Budget matching
  const budgetMapping = BUDGET_MAPPINGS[criteria.budgetLevel as keyof typeof BUDGET_MAPPINGS];
  if (product.price >= budgetMapping.minPrice && product.price <= budgetMapping.maxPrice) {
    score += 25;
  }
  
  // Category preference
  if (criteria.preferredCategories.includes(product.category)) {
    score += 15;
  }
  
  // Active product boost
  if (product.isActive) {
    score += 5;
  }
  
  return score;
}

/**
 * POST /api/v1/nimbus/ai/recommend-products
 * Mobile AI-powered product recommendations - no auth required
 */
router.post("/recommend-products", async (req, res) => {
  try {
    const body = recommendProductsSchema.parse(req.body);
    
    // Get products for scoring (using fallback products if no database)
    const FALLBACK_PRODUCTS = [
      {
        id: "demo-product-1",
        name: "Blue Dream",
        brand: "Cloud Nine",
        category: "Flower", 
        price: 45,
        description: "Sativa-dominant hybrid with sweet berry flavors",
        imageUrl: null,
        isActive: true
      },
      {
        id: "demo-product-2", 
        name: "OG Kush",
        brand: "Heritage Farms",
        category: "Flower",
        price: 50,
        description: "Classic indica with earthy pine undertones",
        imageUrl: null,
        isActive: true
      },
      {
        id: "demo-product-3",
        name: "Calm CBD Gummies", 
        brand: "Wellness Co",
        category: "Edibles",
        price: 35,
        description: "25mg CBD per gummy for relaxation",
        imageUrl: null,
        isActive: true
      },
      {
        id: "demo-product-4",
        name: "Hybrid Vape Cart",
        brand: "Vapor Labs", 
        category: "Vape",
        price: 55,
        description: "1g cartridge with balanced hybrid blend",
        imageUrl: null,
        isActive: true
      },
      {
        id: "demo-product-5",
        name: "Relief Topical Cream",
        brand: "Wellness Co",
        category: "Topical",
        price: 40, 
        description: "THC/CBD infused cream for muscle relief",
        imageUrl: null,
        isActive: true
      }
    ];

    let products = FALLBACK_PRODUCTS;
    
    // Score and rank products
    const scoredProducts = products.map(product => ({
      ...product,
      score: calculateScore(product, body),
      reason: generateRecommendationReason(product, body.desiredEffects, body.experienceLevel)
    }));
    
    // Sort by score and take top results
    const recommendations = scoredProducts
      .sort((a, b) => b.score - a.score)
      .slice(0, body.limit)
      .map(product => ({
        id: product.id,
        name: product.name,
        brand: product.brand,
        category: product.category,
        price: product.price,
        description: product.description,
        imageUrl: product.imageUrl,
        reason: product.reason,
        score: product.score
      }));
    
    // Generate AI-like summary message
    const effectsText = body.desiredEffects.length > 0 
      ? `for ${body.desiredEffects.join(', ').toLowerCase()} effects` 
      : '';
    const experienceText = body.experienceLevel === 'new' 
      ? 'beginner-friendly' 
      : body.experienceLevel === 'heavy' 
        ? 'high-potency' 
        : '';
    
    const message = `Found ${recommendations.length} ${experienceText} products ${effectsText} in your ${body.budgetLevel} budget range.`;
    
    res.json({
      recommendations,
      message,
      criteria: body,
      totalAnalyzed: products.length
    });
    
  } catch (error: any) {
    logger.error("ai.recommend-products.error", error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid request parameters',
        details: error.errors
      });
    }
    
    res.status(500).json({
      error: 'Failed to generate recommendations',
      details: 'AI service temporarily unavailable'
    });
  }
});
