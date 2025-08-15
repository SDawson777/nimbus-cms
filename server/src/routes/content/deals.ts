// GET /api/v1/content/deals
import { Router } from 'express'
import { z } from 'zod'
import { fetchCMS } from '../../lib/cms'

export const dealsRouter = Router()

dealsRouter.get('/', async (req, res) => {
  const { storeId, limit } = z
    .object({
      storeId: z.string().optional(),
      limit: z.coerce.number().min(1).max(50).default(20)
    })
    .parse(req.query)
  const filter = storeId ? '&& $sid in stores[]' : ''
  const query = `*[_type=="deal" && active==true && now() >= startAt && now() <= endAt ${filter}] | order(priority desc)[0...$lim]{
    title,"slug":slug.current,badge,ctaText,ctaLink,
    "image":{"src":image.asset->url,"alt":image.alt},
    priority,startAt,endAt,stores
  }`
  const items = await fetchCMS(query, { sid: storeId, lim: limit })
  res.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=300')
  res.json(items)
})
