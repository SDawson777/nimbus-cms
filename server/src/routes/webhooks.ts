import express, { Router, Request, Response } from "express";
import { z } from "zod";
import getPrisma from "../lib/prisma";
import { logger } from "../lib/logger";

export const webhooksRouter = Router();

// Sanity webhook payload schema
const sanityWebhookSchema = z.object({
  _type: z.string(),
  _id: z.string(),
  _rev: z.string().optional(),
  projectId: z.string().optional(),
  dataset: z.string().optional()
});

/**
 * POST /webhooks/sanity-sync
 * Handle Sanity CMS content updates for instant sync
 */
webhooksRouter.post("/sanity-sync", async (req: Request, res: Response) => {
  try {
    // Validate webhook secret if configured
    const webhookSecret = process.env.SANITY_WEBHOOK_SECRET;
    if (webhookSecret) {
      const providedSecret = req.headers['x-sanity-webhook-secret'] || req.headers['authorization'];
      if (providedSecret !== webhookSecret && providedSecret !== `Bearer ${webhookSecret}`) {
        logger.warn("Invalid webhook secret provided");
        return res.status(401).json({ error: 'Unauthorized' });
      }
    }

    const body = sanityWebhookSchema.parse(req.body);
    const { _type, _id } = body;
    
    logger.info("Sanity webhook received", { type: _type, id: _id });

    if (_type === 'faq' || _type === 'contentPage') {
      await handleContentSync(_type, _id, req.body);
      
      res.json({ 
        success: true, 
        synced: _id,
        type: _type,
        timestamp: new Date()
      });
    } else {
      // Acknowledge webhook but don't process unknown types
      res.json({ 
        success: true, 
        skipped: _id, 
        reason: `Unknown content type: ${_type}` 
      });
    }
    
  } catch (error: any) {
    logger.error("sanity.webhook.error", error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid webhook payload',
        details: error.issues
      });
    }
    
    res.status(500).json({ 
      error: 'Webhook processing failed',
      details: error.message 
    });
  }
});

/**
 * Handle content synchronization from Sanity to PostgreSQL
 */
async function handleContentSync(type: string, sanityId: string, payload: any) {
  const prisma = getPrisma();
  
  try {
    // For demo purposes, we'll simulate content sync
    // In production, you would fetch from Sanity API here
    
    if (type === 'faq') {
      // Simulate FAQ from Sanity
      const faqData = {
        question: payload.question || `Demo FAQ ${sanityId}`,
        answer: payload.answer || 'This is a demo FAQ answer synced from Sanity.',
        category: payload.category || 'General',
        tenant: payload.tenant?._ref || 'demo-operator'
      };

      // Upsert FAQ content page
      await prisma.contentPage.upsert({
        where: {
          type_locale_slug: {
            type: 'faq',
            locale: 'en',
            slug: `faq-${sanityId}`
          }
        },
        update: {
          title: faqData.question,
          body: faqData.answer,
          isPublished: true,
          updatedAt: new Date()
        },
        create: {
          id: `faq-${sanityId}`,
          tenantId: faqData.tenant,
          type: 'faq',
          locale: 'en', 
          slug: `faq-${sanityId}`,
          title: faqData.question,
          body: faqData.answer,
          isPublished: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      
      logger.info("FAQ synced from Sanity", { id: sanityId, question: faqData.question });
      
    } else if (type === 'contentPage') {
      // Handle generic content pages
      const pageData = {
        title: payload.title || `Demo Page ${sanityId}`,
        body: payload.body || 'This is demo content synced from Sanity.',
        slug: payload.slug || `page-${sanityId}`,
        type: payload.pageType || 'page',
        tenant: payload.tenant?._ref || 'demo-operator'
      };

      await prisma.contentPage.upsert({
        where: {
          type_locale_slug: {
            type: pageData.type,
            locale: 'en',
            slug: pageData.slug
          }
        },
        update: {
          title: pageData.title,
          body: pageData.body,
          isPublished: true,
          updatedAt: new Date()
        },
        create: {
          id: `page-${sanityId}`,
          tenantId: pageData.tenant,
          type: pageData.type,
          locale: 'en',
          slug: pageData.slug,
          title: pageData.title,
          body: pageData.body,
          isPublished: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      
      logger.info("Content page synced from Sanity", { id: sanityId, title: pageData.title });
    }
    
  } catch (error) {
    logger.error("Content sync failed", { type, sanityId, error });
    throw error;
  }
}

/**
 * POST /webhooks/sanity-test
 * Test endpoint for Sanity webhook integration
 */
webhooksRouter.post("/sanity-test", async (req: Request, res: Response) => {
  try {
    logger.info("Sanity test webhook received", req.body);
    
    // Create a test FAQ entry
    await handleContentSync('faq', 'test-' + Date.now(), {
      question: 'Test FAQ from Sanity Webhook',
      answer: 'This is a test FAQ created via Sanity webhook to verify the integration is working.',
      category: 'Test',
      tenant: { _ref: 'demo-operator' }
    });
    
    res.json({
      success: true,
      message: 'Test webhook processed successfully',
      timestamp: new Date()
    });
    
  } catch (error: any) {
    logger.error("sanity.test.webhook.error", error);
    res.status(500).json({
      error: 'Test webhook failed',
      details: error.message
    });
  }
});

/**
 * GET /webhooks/health
 * Webhook health check
 */
webhooksRouter.get("/health", async (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'webhooks',
    timestamp: new Date(),
    endpoints: [
      '/webhooks/sanity-sync',
      '/webhooks/sanity-test',
      '/webhooks/health'
    ]
  });
});

export default webhooksRouter;