import {Router} from 'express'
import {z} from 'zod'
import {fetchCMS} from '../../lib/cms'
import {portableTextToHtml} from '../../lib/portableText'

export const legalRouter = Router()

const slugPattern = /^[a-z0-9-]+$/i
const preprocessQueryValue = (value: unknown): string | undefined => {
  if (Array.isArray(value)) {
    const [first] = value
    return typeof first === 'string' ? first.trim() : undefined
  }
  if (typeof value === 'string') {
    return value.trim()
  }
  return undefined
}

const optionalSlugField = z
  .preprocess(preprocessQueryValue, z.string().min(1).max(64).regex(slugPattern))
  .transform((val) => val?.toLowerCase())
  .optional()

const optionalStateField = z
  .preprocess(preprocessQueryValue, z.string().length(2).regex(/^[a-z]{2}$/i))
  .transform((val) => val?.toUpperCase())
  .optional()

const querySchema = z.object({
  type: optionalSlugField,
  state: optionalStateField,
  org: optionalSlugField,
  brand: optionalSlugField,
  store: optionalSlugField,
  channel: optionalSlugField,
})

// returns a single legal document from CMS; honors `?preview=true`
legalRouter.get('/', async (req, res) => {
  const parsed = querySchema.safeParse(req.query || {})
  if (!parsed.success) {
    return res.status(400).json({error: 'INVALID_LEGAL_FILTERS', details: parsed.error.issues})
  }
  // support `type` (terms/privacy/etc) and optional `state` (US state code)
  const {type, state, org, brand, store, channel} = parsed.data
  const preview = (req as any).preview ?? false

  // tenant filters
  let tenantFilter = ''
  if (brand) tenantFilter += ' && references(*[_type=="brand" && slug.current==$brand]._id)'
  if (store) tenantFilter += ' && references(*[_type=="store" && slug.current==$store]._id)'
  if (org) tenantFilter += ' && references(*[_type=="organization" && slug.current==$org]._id)'

  // state scoping: if provided require stateCode==$state, otherwise allow global docs that do not define stateCode
  let stateFilter = ''
  const params: any = {brand, store, org}
  if (state) {
    stateFilter = ' && stateCode==$state'
    params.state = state
  } else {
    // prefer global docs (no stateCode) if no state passed
    stateFilter = ' && (!defined(stateCode) || stateCode == null)'
  }

  // type: optional, default to 'terms' for backward compatibility
  const docType = type || 'terms'
  params.t = docType

  // effective date window: effectiveFrom <= now && (effectiveTo not defined OR effectiveTo > now)
  const nowExpr = 'now()'
  const channelExpr = channel
    ? ' && ( !defined(channels) || count(channels) == 0 || $channel in channels )'
    : ''
  const query = `*[_type=="legalDoc" && type==$t ${tenantFilter} ${stateFilter}${channelExpr} && effectiveFrom <= ${nowExpr} && (!defined(effectiveTo) || effectiveTo > ${nowExpr})] | order(effectiveFrom desc, version desc)[0]{title,type,stateCode,version,effectiveFrom,body}`

  if (channel) params.channel = channel
  const item = await fetchCMS(query, params, {preview})
  res.set('Cache-Control', 'public, max-age=86400, stale-while-revalidate=300')
  if (!item) return res.status(404).json({error: 'NOT_FOUND'})
  const it: any = item
  // Legacy mount (/api/v1) expects the old shape {title, body}
  if (String(req.baseUrl || '').startsWith('/api/v1')) {
    return res.json({title: it.title, body: it.body})
  }
  // map to the mobile-friendly shape with version/effectiveFrom and server-side HTML
  res.json({
    title: it.title,
    body: it.body,
    bodyHtml: portableTextToHtml(it.body),
    type: it.type,
    stateCode: it.stateCode || undefined,
    version: it.version,
    effectiveFrom: it.effectiveFrom,
  })
})
