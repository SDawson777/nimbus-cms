import { Router } from 'express'
import { z } from 'zod'
import { fetchCMS } from '../../lib/cms'

export const legalRouter = Router()

// returns a single legal document from CMS; honors `?preview=true`
legalRouter.get('/', async (req, res) => {
  const { type } = z
    .object({ type: z.enum(['terms', 'privacy', 'accessibility']) })
    .parse(req.query)
  const preview = (req as any).preview ?? false
  const query =
    '*[_type=="legalDoc" && type==$t] | order(updatedAt desc)[0]{title,version,updatedAt,body}'
  const item = await fetchCMS(query, { t: type }, { preview })
  res.set('Cache-Control', 'public, max-age=86400, stale-while-revalidate=300')
  res.json(item)
})
