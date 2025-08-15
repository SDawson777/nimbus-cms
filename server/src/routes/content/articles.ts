import { Router } from 'express'
import { z } from 'zod'
import { fetchCMS } from '../../lib/cms'

export const articlesRouter = Router()

// list articles
articlesRouter.get('/', async (req, res) => {
  const { page, limit, tag } = z
    .object({
      page: z.coerce.number().min(1).default(1),
      limit: z.coerce.number().min(1).max(50).default(20),
      tag: z.string().optional()
    })
    .parse(req.query)
  const preview = (req as any).preview ?? false
  const from = (page - 1) * limit
  const filter = tag ? '&& $tag in tags' : ''
  const base = `*[_type=="greenhouseArticle" && status=="published" ${filter}]`
  const total = await fetchCMS<number>(`count(${base})`, { tag }, { preview })
  const items = await fetchCMS(
    `${base} | order(publishedAt desc)[${from}...${from + limit}]{
    "id":_id, title, "slug":slug.current, excerpt, body,
    "cover":{"src":coverImage.asset->url,"alt":coverImage.alt},
    tags, author, publishedAt, featured
  }`,
    { tag },
    { preview }
  )
  res.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=300')
  res.json({ items, page, limit, total, totalPages: Math.ceil(total / limit) })
})

// single article
articlesRouter.get('/:slug', async (req, res) => {
  const preview = (req as any).preview ?? false
  const query = `*[_type=="greenhouseArticle" && slug.current==$s][0]{
    "id":_id, title, "slug":slug.current, excerpt, body,
    "cover":{"src":coverImage.asset->url,"alt":coverImage.alt},
    tags, author, publishedAt, featured
  }`
  const item = await fetchCMS(query, { s: req.params.slug }, { preview })
  if (!item) return res.status(404).json({ error: 'NOT_FOUND' })
  res.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=300')
  res.json(item)
})

