import {Router} from 'express'
import {fetchCMS, createWriteClient} from '../lib/cms'
import {z} from 'zod'
import {requireRole} from '../middleware/requireRole'
import {portableTextToHtml} from '../lib/portableText'

// helper to build tenant filters based on admin scope
function buildScopeFilter(admin: any) {
  let filter = ''
  const params: any = {}
  if (!admin) return {filter, params}
  if (admin.brandSlug) {
    filter += ' && references(*[_type=="brand" && slug.current==$brand]._id)'
    params.brand = admin.brandSlug
  }
  if (admin.storeSlug) {
    filter += ' && references(*[_type=="store" && slug.current==$store]._id)'
    params.store = admin.storeSlug
  }
  if (admin.organizationSlug) {
    filter += ' && references(*[_type=="organization" && slug.current==$org]._id)'
    params.org = admin.organizationSlug
  }
  return {filter, params}
}

export const adminRouter = Router()

// multer may not be installed in all environments (tests/mock). Require lazily.
let upload: any = null
try {
  const m = require('multer')
  upload = m({storage: m.memoryStorage(), limits: {fileSize: 5 * 1024 * 1024}})
} catch {
  upload = null
}

// preview middleware consistent with content routes
adminRouter.use((req, _res, next) => {
  // Preview gating consistent with content routes. If PREVIEW_SECRET is set,
  // require the secret in the query or X-Preview-Secret header.
  const previewQuery = req.query && req.query.preview === 'true'
  const previewHeader = String(req.header('X-Preview') || '').toLowerCase() === 'true'

  const previewSecretEnv = process.env.PREVIEW_SECRET
  const querySecret = req.query && String((req.query as any).secret || '')
  const headerSecret = String(req.header('X-Preview-Secret') || '')

  const querySecretValid = !previewSecretEnv || querySecret === previewSecretEnv
  const headerSecretValid = !previewSecretEnv || headerSecret === previewSecretEnv

  ;(req as any).preview = (previewQuery && querySecretValid) || (previewHeader && headerSecretValid)
  next()
})

// GET /products -> returns CMSProduct[]
adminRouter.get('/products', requireRole('EDITOR'), async (req, res) => {
  const preview = (req as any).preview ?? false
  const query = `*[_type == "product"]{
    _id, name, "slug":slug.current, price, effects, productType->{title},
    "image": image{ "url": image.asset->url, "alt": image.alt }
  }`
  try {
    const items = await fetchCMS<any[]>(query, {}, {preview})
    const mapped = (items || []).map((p: any) => {
      const out: any = {
        __id: p._id,
        name: p.name,
        slug: p.slug,
        price: typeof p.price === 'number' ? p.price : Number(p.price || 0),
        type: p.productType?.title || (p.productType as any) || 'unknown',
      }
      if (p.effects && p.effects.length) out.effects = p.effects
      if (p.image && (p.image.url || p.image.alt)) out.image = {url: p.image.url, alt: p.image.alt}
      return out
    })
    res.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=300')
    res.json(mapped)
  } catch (err) {
    console.error('Failed to fetch admin products', err)
    res.status(500).json({error: 'FAILED_TO_FETCH_PRODUCTS'})
  }
})

// GET /api/admin/organizations
adminRouter.get('/organizations', requireRole('VIEWER'), async (req, res) => {
  try {
    const admin = (req as any).admin
    const {filter, params} = buildScopeFilter(admin)
    const q = `*[_type=="organization" ${filter}]{_id, name, "slug":slug.current}`
    const items = await fetchCMS(q, params)
    res.json(items || [])
  } catch (err) {
    console.error('failed orgs', err)
    res.status(500).json({error: 'FAILED'})
  }
})

// GET/POST /api/admin/theme - read or update theme configs
adminRouter.get('/theme', requireRole('VIEWER'), async (req, res) => {
  try {
    const {brand, store} = req.query as any
    if (!brand) return res.status(400).json({error: 'MISSING_BRAND'})
    const q = `*[_type=="themeConfig" && brand->slug.current==$brand ${store ? '&& store->slug.current==$store' : '&& !defined(store)'}][0]{"brand":brand->slug.current, primaryColor, secondaryColor, backgroundColor, textColor, "logoUrl":logo.asset->url, logoUrl, typography}`
    const item = await fetchCMS(q, {brand, store})
    if (!item) return res.status(404).json({error: 'NOT_FOUND'})
    res.json(item)
  } catch (err) {
    console.error('failed admin theme read', err)
    res.status(500).json({error: 'FAILED'})
  }
})

adminRouter.post('/theme', requireRole('EDITOR'), async (req, res) => {
  const body = req.body || {}
  // Validate incoming theme payload. Color fields must be hex (#fff or #ffffff).
  const colorRegex = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/
  const schema = z
    .object({
      brand: z.string(),
      store: z.string().optional(),
      primaryColor: z
        .string()
        .optional()
        .refine((v) => !v || colorRegex.test(v), {message: 'Invalid hex color'}),
      secondaryColor: z
        .string()
        .optional()
        .refine((v) => !v || colorRegex.test(v), {message: 'Invalid hex color'}),
      backgroundColor: z
        .string()
        .optional()
        .refine((v) => !v || colorRegex.test(v), {message: 'Invalid hex color'}),
      textColor: z
        .string()
        .optional()
        .refine((v) => !v || colorRegex.test(v), {message: 'Invalid hex color'}),
      logoUrl: z.string().optional(),
      typography: z
        .object({fontFamily: z.string().optional(), fontSize: z.string().optional()})
        .optional(),
    })
    .parse(body)

  try {
    // create client to perform writes (use wrapper to make testing easier)
    const client = createWriteClient()

    // Resolve brand and store IDs
    const brandId = await client.fetch('*[_type=="brand" && slug.current==$b][0]._id', {
      b: schema.brand,
    })
    if (!brandId) return res.status(400).json({error: 'UNKNOWN_BRAND'})
    let storeId: string | undefined
    if (schema.store) {
      storeId = await client.fetch('*[_type=="store" && slug.current==$s][0]._id', {
        s: schema.store,
      })
      if (!storeId) return res.status(400).json({error: 'UNKNOWN_STORE'})
    }

    // deterministic id per brand (+store)
    const id = storeId
      ? `themeConfig-${schema.brand}-store-${schema.store}`
      : `themeConfig-${schema.brand}`

    const doc: any = {
      _id: id,
      _type: 'themeConfig',
      brand: {_type: 'reference', _ref: brandId},
      primaryColor: schema.primaryColor,
      secondaryColor: schema.secondaryColor,
      backgroundColor: schema.backgroundColor,
      textColor: schema.textColor,
      logoUrl: schema.logoUrl,
      typography: schema.typography,
    }
    if (storeId) doc.store = {_type: 'reference', _ref: storeId}
    // if caller provided a Sanity asset id for the uploaded logo, attach it as image reference
    if ((body as any).logoAssetId) {
      const aid = String((body as any).logoAssetId)
      doc.logo = {_type: 'image', asset: {_type: 'reference', _ref: aid}}
      // include alt text if provided
      if ((body as any).logoAlt) doc.logo.alt = String((body as any).logoAlt)
      // also clear logoUrl if not explicitly provided
      if (!schema.logoUrl) doc.logoUrl = undefined
    }

    const created = await client.createOrReplace(doc)
    res.json({ok: true, theme: created})
  } catch (err) {
    console.error('failed admin theme write', err)
    res.status(500).json({error: 'FAILED'})
  }
})

// GET /api/admin/brands
adminRouter.get('/brands', requireRole('VIEWER'), async (req, res) => {
  try {
    const admin = (req as any).admin
    const {filter, params} = buildScopeFilter(admin)
    const q = `*[_type=="brand" ${filter}]{_id, name, "slug":slug.current, "org":organization->slug}`
    const items = await fetchCMS(q, params)
    res.json(items || [])
  } catch (err) {
    console.error('failed brands', err)
    res.status(500).json({error: 'FAILED'})
  }
})

// GET /api/admin/stores
adminRouter.get('/stores', requireRole('VIEWER'), async (req, res) => {
  try {
    const admin = (req as any).admin
    const {filter, params} = buildScopeFilter(admin)
    const q = `*[_type=="store" ${filter}]{_id, name, "slug":slug.current, "brand":brand->slug, address}`
    const items = await fetchCMS(q, params)
    res.json(items || [])
  } catch (err) {
    console.error('failed stores', err)
    res.status(500).json({error: 'FAILED'})
  }
})

// GET /api/admin/articles
adminRouter.get('/articles', requireRole('VIEWER'), async (req, res) => {
  try {
    const admin = (req as any).admin
    const {filter, params} = buildScopeFilter(admin)
    const q = `*[_type=="greenhouseArticle" ${filter}] | order(publishedAt desc){_id, title, "slug":slug.current, publishedAt, status}`
    const items = await fetchCMS(q, params)
    res.json(items || [])
  } catch (err) {
    console.error('failed articles', err)
    res.status(500).json({error: 'FAILED'})
  }
})

// GET /api/admin/faqs
adminRouter.get('/faqs', requireRole('VIEWER'), async (req, res) => {
  try {
    const admin = (req as any).admin
    const {filter, params} = buildScopeFilter(admin)
    const q = `*[_type=="faqGroup" ${filter}] | order(weight asc){_id, title, slug, items}`
    const items = await fetchCMS(q, params)
    res.json(items || [])
  } catch (err) {
    console.error('failed faqs', err)
    res.status(500).json({error: 'FAILED'})
  }
})

// GET /api/admin/legal
adminRouter.get('/legal', requireRole('VIEWER'), async (req, res) => {
  try {
    const admin = (req as any).admin
    const {filter, params} = buildScopeFilter(admin)
    const q = `*[_type=="legalDoc" ${filter}] | order(effectiveFrom desc, version desc){_id, title, type, stateCode, version, effectiveFrom, effectiveTo}`
    const items = await fetchCMS(q, params)
    res.json(items || [])
  } catch (err) {
    console.error('failed legal', err)
    res.status(500).json({error: 'FAILED'})
  }
})

// GET /api/admin/analytics/content-metrics
adminRouter.get('/analytics/content-metrics', requireRole('VIEWER'), async (req, res) => {
  try {
    const admin = (req as any).admin
    // basic tenant scoping preserved via buildScopeFilter if needed
    const {filter, params} = buildScopeFilter(admin)
    const limit = Number((req.query as any).limit || 50)
    const q = `*[_type=="contentMetric" ${filter}] | order(views desc, clickThroughs desc)[0...${limit}]`
    const items = await fetchCMS(q, params)
    res.json(items || [])
  } catch (err) {
    console.error('failed analytics metrics', err)
    res.status(500).json({error: 'FAILED'})
  }
})

// GET current effective legal doc for type/state - useful for other services
adminRouter.get('/legal/current', requireRole('VIEWER'), async (req, res) => {
  try {
    const admin = (req as any).admin
    const {type, state} = req.query as any
    const {filter, params} = buildScopeFilter(admin)
    if (type) params.t = type
    if (state) params.state = state
    const nowExpr = 'now()'
    const q = `*[_type=="legalDoc" && type==$t ${filter} ${state ? '&& stateCode==$state' : '&& (!defined(stateCode) || stateCode == null)'} && effectiveFrom <= ${nowExpr} && (!defined(effectiveTo) || effectiveTo > ${nowExpr})] | order(effectiveFrom desc, version desc)[0]{_id,title,type,stateCode,version,effectiveFrom,body}`
    const item = await fetchCMS(q, params)
    if (!item) return res.status(404).json({error: 'NOT_FOUND'})
    const it: any = item
    res.json({
      _id: it._id,
      title: it.title,
      type: it.type,
      stateCode: it.stateCode || undefined,
      version: it.version,
      effectiveFrom: it.effectiveFrom,
      body: it.body,
      bodyHtml: portableTextToHtml(it.body),
    })
  } catch (err) {
    console.error('failed current legal', err)
    res.status(500).json({error: 'FAILED'})
  }
})

// POST /api/admin/upload-logo - accepts {filename, data} where data is a dataURL or base64 string
adminRouter.post('/upload-logo', requireRole('EDITOR'), async (req, res) => {
  try {
    const {filename, data} = req.body || {}
    if (!filename || !data) return res.status(400).json({error: 'MISSING_FILE'})
    const client = createWriteClient()
    // strip data URL prefix if present
    const base64 = typeof data === 'string' ? data.replace(/^data:.*;base64,/, '') : ''
    const buffer = Buffer.from(base64, 'base64')
    // use Sanity assets.upload
    // @ts-ignore
    const uploaded = await client.assets.upload('image', buffer, {filename})
    // uploaded typically contains _id and url
    const url = (uploaded && (uploaded.url || (uploaded.asset && uploaded.asset.url))) || null
    const assetId = uploaded && (uploaded._id || (uploaded.asset && uploaded.asset._id))
    res.json({ok: true, url, assetId, uploaded})
  } catch (err) {
    console.error('failed upload logo', err)
    res.status(500).json({error: 'FAILED'})
  }
})

// POST /api/admin/upload-logo-multipart - multipart form upload (field `file`)
adminRouter.post(
  '/upload-logo-multipart',
  requireRole('EDITOR'),
  upload ? upload.single('file') : (req, res, next) => next(),
  async (req, res) => {
    try {
      // multer places file on req.file
      const file = (req as any).file
      if (!file) return res.status(400).json({error: 'MISSING_FILE'})
      const client = createWriteClient()
      // use buffer from multer
      // @ts-ignore
      const uploaded = await client.assets.upload('image', file.buffer, {
        filename: file.originalname,
      })
      const url = (uploaded && (uploaded.url || (uploaded.asset && uploaded.asset.url))) || null
      const assetId = uploaded && (uploaded._id || (uploaded.asset && uploaded.asset._id))
      res.json({ok: true, url, assetId, uploaded})
    } catch (err) {
      console.error('failed multipart upload', err)
      res.status(500).json({error: 'FAILED'})
    }
  },
)

export default adminRouter
