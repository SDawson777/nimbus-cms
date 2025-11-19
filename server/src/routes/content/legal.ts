import {Router} from 'express'
import {z} from 'zod'
import {fetchCMS} from '../../lib/cms'
import {portableTextToHtml} from '../../lib/portableText'

export const legalRouter = Router()

// returns a single legal document from CMS; honors `?preview=true`
legalRouter.get('/', async (req, res) => {
  // support `type` (terms/privacy/etc) and optional `state` (US state code)
  const {type, state, org, brand, store} = z
    .object({
      type: z.string().optional(),
      state: z.string().optional(),
      org: z.string().optional(),
      brand: z.string().optional(),
      store: z.string().optional(),
    })
    .parse(req.query)
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
  const query = `*[_type=="legalDoc" && type==$t ${tenantFilter} ${stateFilter} && effectiveFrom <= ${nowExpr} && (!defined(effectiveTo) || effectiveTo > ${nowExpr})] | order(effectiveFrom desc, version desc)[0]{title,type,stateCode,version,effectiveFrom,body}`

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
