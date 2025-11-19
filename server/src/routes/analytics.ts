import {Router} from 'express'
import {z} from 'zod'
import {createClient} from '@sanity/client'

export const analyticsRouter = Router()

// POST /analytics/event
// Body: { type: 'view'|'click', contentType: 'article'|'faq'|'legal'|'product', contentSlug: string }
analyticsRouter.post('/event', async (req, res) => {
  const body = z
    .object({
      type: z.enum(['view', 'click']),
      contentType: z.enum(['article', 'faq', 'legal', 'product']),
      contentSlug: z.string(),
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
  const id = `contentMetric-${body.contentType}-${safeSlug}`

  const now = new Date().toISOString()

  try {
    // Ensure document exists
    await client.createIfNotExists({
      _id: id,
      _type: 'contentMetric',
      contentType: body.contentType,
      contentSlug: body.contentSlug,
      views: 0,
      clickThroughs: 0,
      lastUpdated: now,
    })

    // Patch and increment the counter
    const patch = client.patch(id).set({lastUpdated: now})
    if (body.type === 'view') patch.inc({views: 1})
    else patch.inc({clickThroughs: 1})

    const updated = await patch.commit({autoGenerateArrayKeys: true})
    res.status(200).json({ok: true, metric: updated})
  } catch (err) {
    console.error('analytics event failed', err)
    res.status(500).json({error: 'FAILED'})
  }
})

export default analyticsRouter
