import { Router } from 'express'
import { fetchCMS } from '../../lib/cms'

export const faqsRouter = Router()

faqsRouter.get('/', async (req, res) => {
  const preview = (req as any).preview ?? false
  const query =
    '*[_type=="faqGroup"] | order(weight asc){title,slug, "items":items(){"q":question,"a":answer}}'
  const items = await fetchCMS(query, {}, { preview })
  res.set('Cache-Control', 'public, max-age=86400, stale-while-revalidate=300')
  res.json(items)
})