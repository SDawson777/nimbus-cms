import express, { Router, Request, Response } from "express";
import { z } from "zod";
import getPrisma from "../lib/prisma";
import { logger } from "../lib/logger";

export const mobileContentRouter = Router();

/**
 * GET /content/faq
 * Mobile app FAQ content
 */
mobileContentRouter.get("/faq", async (req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const tenantId = (req.headers['x-tenant-id'] as string) || "demo-operator";
    
    // Fetch FAQs from PostgreSQL (synced from Sanity)
    const faqPages = await prisma.contentPage.findMany({
      where: {
        type: 'faq',
        tenantId: tenantId,
        isPublished: true
      },
      select: {
        id: true,
        slug: true,
        title: true,
        body: true,
        updatedAt: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // If no FAQs in database, return demo data
    if (faqPages.length === 0) {
      logger.info("No FAQs found in database, returning demo data");
      return res.json({
        faqs: [
          {
            id: 'demo-faq-1',
            question: 'What payment methods do you accept?',
            answer: 'We accept cash, debit cards, and approved payment apps. Credit cards are not accepted due to federal regulations.',
            category: 'Payment',
            lastUpdated: new Date()
          },
          {
            id: 'demo-faq-2', 
            question: 'What are your delivery hours?',
            answer: 'Delivery is available Monday-Sunday from 10am to 8pm. Orders must be placed at least 2 hours in advance.',
            category: 'Delivery',
            lastUpdated: new Date()
          },
          {
            id: 'demo-faq-3',
            question: 'Do I need a medical card?',
            answer: 'You must be 21+ with valid ID for recreational purchases. Medical patients with valid cards receive tax exemptions.',
            category: 'Legal',
            lastUpdated: new Date()
          },
          {
            id: 'demo-faq-4',
            question: 'How do I earn loyalty points?',
            answer: 'Earn 1 point per dollar spent. Gold status unlocks exclusive products and 5% discounts on all purchases.',
            category: 'Loyalty',
            lastUpdated: new Date()
          },
          {
            id: 'demo-faq-5',
            question: 'Can I return or exchange products?',
            answer: 'All sales are final due to state regulations. Please inspect products before leaving the store.',
            category: 'Returns',
            lastUpdated: new Date()
          }
        ],
        categories: ['Payment', 'Delivery', 'Legal', 'Loyalty', 'Returns'],
        lastSync: new Date(),
        source: 'demo'
      });
    }

    // Transform database records to API format
    const faqs = faqPages.map(page => {
      // Extract category from slug or content
      let category = 'General';
      if (page.slug.includes('payment')) category = 'Payment';
      else if (page.slug.includes('delivery')) category = 'Delivery';
      else if (page.slug.includes('legal')) category = 'Legal';
      else if (page.slug.includes('loyalty')) category = 'Loyalty';
      else if (page.slug.includes('return')) category = 'Returns';
      
      return {
        id: page.id,
        question: page.title,
        answer: page.body || '',
        category,
        lastUpdated: page.updatedAt
      };
    });

    const categories = [...new Set(faqs.map(faq => faq.category))];

    res.json({
      faqs,
      categories,
      lastSync: new Date(),
      source: 'database'
    });

  } catch (error: any) {
    logger.error("content.faq.error", error);
    res.status(500).json({
      error: 'Failed to fetch FAQ',
      details: 'Content service temporarily unavailable'
    });
  }
});

/**
 * GET /content/:type/:slug
 * Get specific content page
 */
mobileContentRouter.get("/:type/:slug", async (req: Request, res: Response) => {
  try {
    const { type, slug } = req.params;
    const tenantId = (req.headers['x-tenant-id'] as string) || "demo-operator";
    const prisma = getPrisma();
    
    const page = await prisma.contentPage.findFirst({
      where: {
        type,
        slug,
        tenantId,
        isPublished: true
      },
      select: {
        id: true,
        type: true,
        title: true,
        body: true,
        updatedAt: true,
        createdAt: true
      }
    });

    if (!page) {
      return res.status(404).json({
        error: 'Content not found'
      });
    }

    res.json({
      id: page.id,
      type: page.type,
      title: page.title,
      body: page.body,
      lastUpdated: page.updatedAt,
      created: page.createdAt
    });

  } catch (error: any) {
    logger.error("content.page.error", error);
    res.status(500).json({
      error: 'Failed to fetch content'
    });
  }
});

/**
 * GET /content/pages
 * List all content pages by type
 */
mobileContentRouter.get("/pages", async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      type: z.string().optional(),
      limit: z.coerce.number().min(1).max(50).default(20)
    });

    const params = schema.parse(req.query);
    const tenantId = (req.headers['x-tenant-id'] as string) || "demo-operator";
    const prisma = getPrisma();
    
    const where: any = {
      tenantId,
      isPublished: true
    };

    if (params.type) {
      where.type = params.type;
    }

    const pages = await prisma.contentPage.findMany({
      where,
      select: {
        id: true,
        type: true,
        title: true,
        slug: true,
        updatedAt: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: params.limit
    });

    res.json({
      pages,
      total: pages.length
    });

  } catch (error: any) {
    logger.error("content.pages.error", error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid request parameters',
        details: error.issues
      });
    }
    
    res.status(500).json({
      error: 'Failed to fetch content pages'
    });
  }
});