import {Router} from 'express'
import rateLimit from 'express-rate-limit'
import {logger} from '../lib/logger'
import {z} from 'zod'
import {createClient} from '@sanity/client'

export const analyticsRouter = Router()

// Configurable rate limiter for analytics events (protects the Sanity write endpoint)
const analyticsLimiter = rateLimit({
  windowMs: Number(process.env.ANALYTICS_RATE_LIMIT_WINDOW_MS || 60 * 1000),
  max: Number(process.env.ANALYTICS_RATE_LIMIT_MAX || 60),
  standardHeaders: true,
  legacyHeaders: false,
})

// POST /analytics/event
// Body: { type: 'view'|'click', contentType: 'article'|'faq'|'legal'|'product', contentSlug: string }
analyticsRouter.post('/event', analyticsLimiter, async (req, res) => {
  const body = z
    .object({
      type: z.enum(['view', 'click']),
      contentType: z.enum(['article', 'faq', 'legal', 'product']),
      contentSlug: z.string(),
      contentId: z.string().optional(),
      brandSlug: z.string().optional(),
      storeSlug: z.string().optional(),
    })
    .parse(req.body)

  const client = createClient({
    projectId: process.env.SANITY_PROJECT_ID!,
    dataset: process.env.SANITY_DATASET!,
    apiVersion: process.env.SANITY_API_VERSION || '2023-07-01',
    token: process.env.SANITY_API_TOKEN,
    useCdn: false,
  })

  // Use a deterministic _id so repeated events for the same content map to the same metric doc.
  // sanitize slug by replacing / with - for safety
  const safeSlug = String(body.contentSlug).replace(/[^a-zA-Z0-9-_.]/g, '-')
  // Use a deterministic id that includes optional brand/store so metrics are scoped safely
  const brandPart = body.brandSlug ? `-brand-${String(body.brandSlug)}` : ''
  const storePart = body.storeSlug ? `-store-${String(body.storeSlug)}` : ''
  const id = `contentMetric-${body.contentType}${brandPart}${storePart}-${safeSlug}`

  const now = new Date().toISOString()

  try {
    // Ensure aggregate metric exists and increment
    await client.createIfNotExists({
      _id: id,
      _type: 'contentMetric',
      contentType: body.contentType,
      contentSlug: body.contentSlug,
      contentId: body.contentId || undefined,
      brandSlug: body.brandSlug || undefined,
      storeSlug: body.storeSlug || undefined,
      views: 0,
      clickThroughs: 0,
      lastUpdated: now,
    })

    // Patch and increment the aggregate counter
    const patch = client.patch(id).set({lastUpdated: now})
    if (body.type === 'view') patch.inc({views: 1})
    else patch.inc({clickThroughs: 1})
    const updated = await patch.commit({autoGenerateArrayKeys: true})

    // Also write a daily bucket metric (one doc per day) so we can compute recent trends
    const day = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
    const dailyId = `contentMetricDaily-${body.contentType}${brandPart}${storePart}-${day}-${safeSlug}`
    const dayDoc = {
      _id: dailyId,
      _type: 'contentMetricDaily',
      date: `${day}T00:00:00Z`,
      contentType: body.contentType,
      contentSlug: body.contentSlug,
      brandSlug: body.brandSlug || undefined,
      storeSlug: body.storeSlug || undefined,
      views: 0,
      clickThroughs: 0,
    }
    await client.createIfNotExists(dayDoc)
    const dayPatch = client.patch(dailyId).set({date: dayDoc.date})
    if (body.type === 'view') dayPatch.inc({views: 1})
    else dayPatch.inc({clickThroughs: 1})
    await dayPatch.commit({autoGenerateArrayKeys: true})

    res.status(200).json({ok: true, metric: updated})
  } catch (err) {
    logger.error('analytics event failed', err)
    res.status(500).json({error: 'FAILED'})
  }
})

export default analyticsRouter
