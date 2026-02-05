import express, { Router, Request, Response } from "express";
import { z } from "zod";
import { logger } from "../lib/logger";

export const webhooksRouter = Router();

// Simple in-memory cache invalidation tracker
// In production, you'd use Redis or similar
const contentUpdateLog: Array<{ type: string; id: string; timestamp: Date }> = [];
const MAX_LOG_SIZE = 1000;

// Sanity webhook payload schema
const sanityWebhookSchema = z.object({
  _type: z.string(),
  _id: z.string(),
  _rev: z.string().optional(),
  projectId: z.string().optional(),
  dataset: z.string().optional()
}).passthrough(); // Allow additional fields

/**
 * POST /webhooks/sanity-sync
 * Handle Sanity CMS content updates
 * 
 * NOTE: This webhook does NOT store content in PostgreSQL.
 * Content is served directly from Sanity via the /mobile/sanity/* endpoints.
 * This webhook is for:
 * 1. Logging content updates
 * 2. Cache invalidation (if implemented)
 * 3. Triggering push notifications to mobile apps
 */
webhooksRouter.post("/sanity-sync", async (req: Request, res: Response) => {
  try {
    // Validate webhook secret if configured
    const webhookSecret = process.env.SANITY_WEBHOOK_SECRET;
    if (webhookSecret) {
      const providedSecret = req.headers['x-sanity-webhook-secret'] || req.headers['authorization'];
      if (providedSecret !== webhookSecret && providedSecret !== `Bearer ${webhookSecret}`) {
        logger.warn("webhook.unauthorized", { headers: Object.keys(req.headers) });
        return res.status(401).json({ error: 'Unauthorized' });
      }
    }

    const body = sanityWebhookSchema.parse(req.body);
    const { _type, _id, _rev, projectId, dataset } = body;
    
    logger.info("sanity.webhook.received", { 
      type: _type, 
      id: _id, 
      rev: _rev,
      project: projectId,
      dataset
    });

    // Log the content update for cache invalidation tracking
    contentUpdateLog.unshift({ type: _type, id: _id, timestamp: new Date() });
    if (contentUpdateLog.length > MAX_LOG_SIZE) {
      contentUpdateLog.pop();
    }

    // Map of supported Sanity content types
    const CONTENT_TYPES = [
      'article', 'faqItem', 'banner', 'category', 'deal', 'promo',
      'legalDoc', 'accessibilityPage', 'awardsExplainer', 'quiz',
      'themeConfig', 'transparencyPage', 'author', 'product', 'store',
      'brand', 'effectTag', 'filterGroup', 'productType', 'organization',
      'personalizationRule', 'contentMetric', 'complianceMonitor',
      'productDrop', 'variantInventory', 'productRecallAudit'
    ];

    const isKnownType = CONTENT_TYPES.includes(_type);
    
    // TODO: Implement push notification to mobile apps
    // await sendPushNotification({ type: _type, id: _id, action: 'updated' });
    
    // TODO: Implement Redis cache invalidation
    // await invalidateCache(_type, _id);

    res.json({ 
      success: true, 
      acknowledged: _id,
      type: _type,
      known: isKnownType,
      timestamp: new Date().toISOString(),
      message: isKnownType 
        ? `Content update logged. Query /mobile/sanity/* for fresh data.`
        : `Unknown type acknowledged. No action taken.`
    });
    
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
 * POST /webhooks/sanity-test
 * Test endpoint for Sanity webhook integration
 */
webhooksRouter.post("/sanity-test", async (req: Request, res: Response) => {
  try {
    logger.info("sanity.test.webhook.received", req.body);
    
    // Simulate a webhook call to the main handler
    const testPayload = {
      _type: req.body._type || 'article',
      _id: req.body._id || 'test-' + Date.now(),
      _rev: 'test-rev',
      projectId: 'ygbu28p2',
      dataset: 'nimbus_demo'
    };
    
    contentUpdateLog.unshift({ 
      type: testPayload._type, 
      id: testPayload._id, 
      timestamp: new Date() 
    });
    
    res.json({
      success: true,
      message: 'Test webhook processed successfully',
      payload: testPayload,
      timestamp: new Date().toISOString(),
      note: 'Content is served directly from Sanity via /mobile/sanity/* endpoints'
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
    timestamp: new Date().toISOString(),
    recentUpdates: contentUpdateLog.slice(0, 10),
    endpoints: [
      { path: '/webhooks/sanity-sync', method: 'POST', description: 'Sanity CMS content update notifications' },
      { path: '/webhooks/sanity-test', method: 'POST', description: 'Test webhook endpoint' },
      { path: '/webhooks/health', method: 'GET', description: 'Health check' },
      { path: '/webhooks/recent', method: 'GET', description: 'Recent content updates' }
    ],
    mobileContentEndpoint: '/mobile/sanity/*',
    note: 'Content is served directly from Sanity - webhook only logs updates'
  });
});

/**
 * GET /webhooks/recent
 * Get recent content updates logged by the webhook
 */
webhooksRouter.get("/recent", async (req: Request, res: Response) => {
  const { limit = 20, type } = req.query;
  const limitNum = Math.min(parseInt(limit as string) || 20, 100);
  
  let updates = contentUpdateLog.slice(0, limitNum);
  
  if (type) {
    updates = updates.filter(u => u.type === type);
  }
  
  res.json({
    updates,
    count: updates.length,
    total: contentUpdateLog.length
  });
});

export default webhooksRouter;