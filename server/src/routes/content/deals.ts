// GET /api/v1/content/deals
import {Router} from 'express'
import {z} from 'zod'
import {fetchCMS} from '../../lib/cms'

export const dealsRouter = Router()

dealsRouter.get('/', async (req, res) => {
  const {storeId, limit, brand, store, org} = z
    .object({
      storeId: z.string().optional(),
      limit: z.coerce.number().min(1).max(50).default(20),
      brand: z.string().optional(),
      store: z.string().optional(),
      org: z.string().optional(),
      channel: z.string().optional(),
    })
    .parse(req.query)

  // build tenant filter: prefer explicit storeId (legacy), otherwise accept slug-based filters
  let filter = ''
  const params: any = {lim: limit}
  if (storeId) {
    filter = '&& $sid in stores[]'
    params.sid = storeId
  } else {
    if (store) {
      filter += ' && references(*[_type=="store" && slug.current==$store]._id)'
      params.store = store
    }
    if (brand) {
      filter += ' && references(*[_type=="brand" && slug.current==$brand]._id)'
      params.brand = brand
    }
    if (org) {
      filter += ' && references(*[_type=="organization" && slug.current==$org]._id)'
      params.org = org
    }
  }

  const channel = String((req.query as any).channel || '').trim()
  const channelExpr = channel
    ? ' && ( !defined(channels) || count(channels) == 0 || $channel in channels )'
    : ''
  const scheduleExpr =
    ' && ( !defined(schedule) || !schedule.isScheduled || (( !defined(schedule.publishAt) || schedule.publishAt <= now() ) && ( !defined(schedule.unpublishAt) || schedule.unpublishAt > now() )) )'

  const query = `*[_type=="deal" && active==true && now() >= startAt && now() <= endAt ${filter}${channelExpr}${scheduleExpr}] | order(priority desc)[0...$lim]{
    title,"slug":slug.current,badge,ctaText,ctaLink,
    "image":{"src":image.asset->url,"alt":image.alt},
    priority,startAt,endAt,stores
  }`
  const items = await fetchCMS(query, {...params, channel})
  const results = Array.isArray(items) ? items : []
  res.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=300')
  res.json(results)
})
