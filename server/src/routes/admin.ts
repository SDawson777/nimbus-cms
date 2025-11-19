import {Router} from 'express'
import {fetchCMS, createWriteClient} from '../lib/cms'
import {computeCompliance} from '../lib/compliance'
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

// For lightweight metric documents we store simple slugs (brandSlug/storeSlug/orgSlug)
// Use this helper when building metric queries so admin scoping applies to metrics as well.
function buildMetricScopeFilter(admin: any) {
  let filter = ''
  const params: any = {}
  if (!admin) return {filter, params}
  if (admin.brandSlug) {
    filter += ' && brandSlug == $brand'
    params.brand = admin.brandSlug
  }
  if (admin.storeSlug) {
    filter += ' && storeSlug == $store'
    params.store = admin.storeSlug
  }
  if (admin.organizationSlug) {
    filter += ' && organizationSlug == $org'
    params.org = admin.organizationSlug
  }
  return {filter, params}
}

export const adminRouter = Router()

// Simple in-memory cache for overview responses to avoid repeated heavy queries.
const overviewCache: Map<string, {ts: number; data: any}> = new Map()
const OVERVIEW_CACHE_TTL = Number(process.env.ANALYTICS_OVERVIEW_CACHE_TTL_MS || 30000)

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
  const includeRecalled = String((req.query as any).includeRecalled || '').toLowerCase() === 'true'
  const query = `*[_type == "product"]{
    _id, name, "slug":slug.current, price, effects, productType->{title},
    "image": image{ "url": image.asset->url, "alt": image.alt },
    isRecalled, recallReason
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
      if (typeof p.isRecalled !== 'undefined') out.isRecalled = !!p.isRecalled
      if (p.recallReason) out.recallReason = p.recallReason
      return out
    })
    // By default exclude recalled products unless includeRecalled=true is set
    const filtered = includeRecalled ? mapped : mapped.filter((m) => !m.isRecalled)
    res.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=300')
    res.json(filtered)
  } catch (err) {
    console.error('Failed to fetch admin products', err)
    res.status(500).json({error: 'FAILED_TO_FETCH_PRODUCTS'})
  }
})

// GET /products/recalled-count -> returns number of recalled products (scoped)
adminRouter.get('/products/recalled-count', requireRole('VIEWER'), async (req, res) => {
  try {
    const admin = (req as any).admin
    const {filter, params} = buildMetricScopeFilter(admin)
    const cacheKey = `recalledCount:${params.brand || ''}:${params.store || ''}:${params.org || ''}`
    const cached = overviewCache.get(cacheKey)
    if (cached && Date.now() - cached.ts < OVERVIEW_CACHE_TTL) {
      return res.json(cached.data)
    }

    const q = `count(*[_type=="product" ${filter} && isRecalled == true])`
    const count = Number((await fetchCMS<number>(q, params)) || 0)
    const data = {count}
    overviewCache.set(cacheKey, {ts: Date.now(), data})
    res.json(data)
  } catch (err) {
    console.error('failed to fetch recalled count', err)
    res.status(500).json({error: 'FAILED'})
  }
})

// PATCH /api/admin/products/:id/recall -> toggle recall status (EDITOR)
adminRouter.post('/products/:id/recall', requireRole('EDITOR'), async (req, res) => {
  const id = req.params.id
  const {isRecalled, recallReason} = req.body || {}
  try {
    const client = createWriteClient()

    // Read previous state for audit (use fetchCMS so tests can mock it)
    const prev = await fetchCMS<any>(
      '*[_id == $id][0]{isRecalled, recallReason}',
      {id},
      {preview: false},
    )
    const previousState = {isRecalled: !!prev?.isRecalled, recallReason: prev?.recallReason || null}

    const patch = client.patch(id)
    if (typeof isRecalled !== 'undefined') patch.set({isRecalled: !!isRecalled})
    if (typeof recallReason !== 'undefined') patch.set({recallReason: recallReason || null})
    await patch.commit({returnDocuments: false})

    // Write an audit record for the recall change
    try {
      const admin = (req as any).admin || {}
      const currentState = {isRecalled: !!isRecalled, recallReason: recallReason || null}
      await client.create({
        _type: 'recallAudit',
        productId: id,
        changedBy: admin.email || admin.name || 'unknown',
        role: admin.role || 'unknown',
        previous: previousState,
        current: currentState,
        reason: (req.body && (req.body.reason || req.body.operatorReason)) || null,
        ts: new Date().toISOString(),
      })
    } catch (auditErr) {
      // Don't fail the main request if audit write fails; log and continue
      console.error('failed to write recall audit', auditErr)
    }

    res.json({ok: true})
  } catch (err) {
    console.error('failed to update recall', err)
    res.status(500).json({error: 'FAILED_TO_UPDATE'})
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

// GET /api/admin/personalization/rules - list rules
adminRouter.get('/personalization/rules', requireRole('VIEWER'), async (req, res) => {
  try {
    const q = `*[_type=="personalizationRule"]{_id, name, description, enabled, conditions[], actions[]}`
    const rows = await fetchCMS<any[]>(q, {})
    res.json(rows || [])
  } catch (err) {
    console.error('failed to fetch personalization rules', err)
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

// GET /api/admin/theme/configs - list all theme configs grouped by brand/store
adminRouter.get('/theme/configs', requireRole('VIEWER'), async (req, res) => {
  try {
    const q = z
      .object({
        page: z.coerce.number().optional(),
        perPage: z.coerce.number().optional(),
        brand: z.string().optional(),
        store: z.string().optional(),
      })
      .parse(req.query || {})
    const page = Math.max(0, Number(q.page || 0))
    const perPage = Math.max(1, Math.min(200, Number(q.perPage || 20)))
    const brand = q.brand && String(q.brand).trim()
    const store = q.store && String(q.store).trim()

    // Build where clause
    let where = ''
    const params: any = {}
    if (brand) {
      where += ' && brand->slug.current == $brand'
      params.brand = brand
    }
    if (store) {
      where += ' && store->slug.current == $store'
      params.store = store
    }

    const listQ = `*[_type=="themeConfig" ${where}]{_id, "brand":brand->slug.current, "brandName":brand->name, "store":store->slug.current, "storeName":store->name, primaryColor, secondaryColor, accentColor, backgroundColor, surfaceColor, textColor, mutedTextColor, "logoUrl":logo.asset->url, logoUrl, darkModeEnabled, cornerRadius, elevationStyle} | order(brand asc, store asc)[${page * perPage}...${page * perPage + perPage}]`
    const countQ = `count(*[_type=="themeConfig" ${where}])`
    const [rows, total] = await Promise.all([fetchCMS(listQ, params), fetchCMS(countQ, params)])
    const studioBase = process.env.SANITY_STUDIO_URL || null
    const items = Array.isArray(rows)
      ? rows.map((r: any) => ({
          id: r._id,
          brand: r.brand,
          brandName: r.brandName,
          store: r.store,
          storeName: r.storeName,
          primaryColor: r.primaryColor,
          secondaryColor: r.secondaryColor,
          accentColor: r.accentColor,
          backgroundColor: r.backgroundColor,
          surfaceColor: r.surfaceColor,
          textColor: r.textColor,
          mutedTextColor: r.mutedTextColor,
          logoUrl: r.logoUrl || r.logoUrl,
          darkModeEnabled: !!r.darkModeEnabled,
          cornerRadius: r.cornerRadius,
          elevationStyle: r.elevationStyle,
          studioUrl: studioBase
            ? `${studioBase.replace(/\/$/, '')}/desk/themeConfig;${r._id}`
            : null,
        }))
      : []

    res.json({items, total: Number(total || 0), page, perPage})
  } catch (e) {
    console.error('failed fetch theme configs', e)
    res.status(500).json({error: 'FAILED'})
  }
})

// POST /api/admin/theme/config - create or update a themeConfig
adminRouter.post('/theme/config', requireRole('EDITOR'), async (req, res) => {
  try {
    const colorRegex = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/
    const schema = z
      .object({
        id: z.string().optional(),
        brand: z.string().optional(),
        store: z.string().optional(),
        primaryColor: z
          .string()
          .optional()
          .refine((v) => !v || colorRegex.test(v), {message: 'Invalid hex color'}),
        secondaryColor: z
          .string()
          .optional()
          .refine((v) => !v || colorRegex.test(v), {message: 'Invalid hex color'}),
        accentColor: z
          .string()
          .optional()
          .refine((v) => !v || colorRegex.test(v), {message: 'Invalid hex color'}),
        backgroundColor: z
          .string()
          .optional()
          .refine((v) => !v || colorRegex.test(v), {message: 'Invalid hex color'}),
        surfaceColor: z
          .string()
          .optional()
          .refine((v) => !v || colorRegex.test(v), {message: 'Invalid hex color'}),
        textColor: z
          .string()
          .optional()
          .refine((v) => !v || colorRegex.test(v), {message: 'Invalid hex color'}),
        mutedTextColor: z
          .string()
          .optional()
          .refine((v) => !v || colorRegex.test(v), {message: 'Invalid hex color'}),
        logoAssetId: z.string().optional(),
        logoUrl: z.string().optional(),
        logoAlt: z.string().optional(),
        darkModeEnabled: z.boolean().optional(),
        cornerRadius: z.string().optional(),
        elevationStyle: z.string().optional(),
      })
      .parse(req.body || {})

    const client = createWriteClient()
    // Resolve brand and store refs if provided
    let brandId: string | undefined
    let storeId: string | undefined
    if (schema.brand) {
      brandId = await client.fetch('*[_type=="brand" && slug.current==$b][0]._id', {
        b: schema.brand,
      })
      if (!brandId) return res.status(400).json({error: 'UNKNOWN_BRAND'})
    }
    if (schema.store) {
      storeId = await client.fetch('*[_type=="store" && slug.current==$s][0]._id', {
        s: schema.store,
      })
      if (!storeId) return res.status(400).json({error: 'UNKNOWN_STORE'})
    }

    const id =
      schema.id ||
      (brandId
        ? storeId
          ? `themeConfig-${schema.brand}-store-${schema.store}`
          : `themeConfig-${schema.brand}`
        : 'themeConfig-global')
    const doc: any = {_id: id, _type: 'themeConfig'}
    if (brandId) doc.brand = {_type: 'reference', _ref: brandId}
    if (storeId) doc.store = {_type: 'reference', _ref: storeId}
    const fields = [
      'primaryColor',
      'secondaryColor',
      'accentColor',
      'backgroundColor',
      'surfaceColor',
      'textColor',
      'mutedTextColor',
      'logoUrl',
      'darkModeEnabled',
      'cornerRadius',
      'elevationStyle',
    ]
    for (const f of fields) {
      if ((schema as any)[f] !== undefined) doc[f] = (schema as any)[f]
    }
    if (schema.logoAssetId) {
      doc.logo = {_type: 'image', asset: {_type: 'reference', _ref: schema.logoAssetId}}
      if (schema.logoAlt) doc.logo.alt = schema.logoAlt
      if (!schema.logoUrl) doc.logoUrl = undefined
    }
    const created = await client.createOrReplace(doc)
    res.json({ok: true, theme: created})
  } catch (e) {
    console.error('failed save theme config', e)
    res.status(500).json({error: 'FAILED'})
  }
})

// DELETE /api/admin/theme/config/:id
adminRouter.delete('/theme/config/:id', requireRole('EDITOR'), async (req, res) => {
  try {
    const id = String((req.params as any).id || '')
    if (!id) return res.status(400).json({error: 'MISSING_ID'})
    const client = createWriteClient()
    // @ts-ignore
    await client.delete(id)
    res.json({ok: true})
  } catch (e) {
    console.error('failed delete theme config', e)
    res.status(500).json({error: 'FAILED'})
  }
})

// POST /api/admin/theme/preview - validate and return a flattened theme object without saving
adminRouter.post('/theme/preview', requireRole('EDITOR'), async (req, res) => {
  try {
    const colorRegex = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/
    const schema = z.object({
      brand: z.string().optional(),
      store: z.string().optional(),
      primaryColor: z
        .string()
        .optional()
        .refine((v) => !v || colorRegex.test(v), {message: 'Invalid hex color'}),
      secondaryColor: z
        .string()
        .optional()
        .refine((v) => !v || colorRegex.test(v), {message: 'Invalid hex color'}),
      accentColor: z
        .string()
        .optional()
        .refine((v) => !v || colorRegex.test(v), {message: 'Invalid hex color'}),
      backgroundColor: z
        .string()
        .optional()
        .refine((v) => !v || colorRegex.test(v), {message: 'Invalid hex color'}),
      surfaceColor: z
        .string()
        .optional()
        .refine((v) => !v || colorRegex.test(v), {message: 'Invalid hex color'}),
      textColor: z
        .string()
        .optional()
        .refine((v) => !v || colorRegex.test(v), {message: 'Invalid hex color'}),
      mutedTextColor: z
        .string()
        .optional()
        .refine((v) => !v || colorRegex.test(v), {message: 'Invalid hex color'}),
      logoUrl: z.string().optional(),
      darkModeEnabled: z.boolean().optional(),
      cornerRadius: z.string().optional(),
      elevationStyle: z.string().optional(),
    })
    const body = schema.parse(req.body || {})
    const out = {
      brand: body.brand || undefined,
      store: body.store || undefined,
      primaryColor: body.primaryColor || null,
      secondaryColor: body.secondaryColor || null,
      accentColor: body.accentColor || null,
      backgroundColor: body.backgroundColor || null,
      surfaceColor: body.surfaceColor || null,
      textColor: body.textColor || null,
      mutedTextColor: body.mutedTextColor || null,
      logoUrl: body.logoUrl || null,
      darkModeEnabled: Boolean(body.darkModeEnabled || false),
      cornerRadius: body.cornerRadius || null,
      elevationStyle: body.elevationStyle || null,
    }
    res.json(out)
  } catch (e) {
    if (e && (e as any).errors)
      return res.status(400).json({error: 'INVALID', details: (e as any).errors})
    console.error('failed theme preview', e)
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
    const channel = String((req.query as any).channel || '').trim()
    const channelExpr = channel
      ? ' && ( !defined(channels) || count(channels) == 0 || $channel in channels )'
      : ''
    // include channels so admin UI can display per-article channels; optionally filter by channel
    const q = `*[_type=="greenhouseArticle" ${filter}${channelExpr}] | order(publishedAt desc){_id, title, "slug":slug.current, publishedAt, status, channels}`
    params.channel = channel
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
    const channel = String((req.query as any).channel || '').trim()
    const itemChannelFilter = channel
      ? `[ ( !defined(channels) || count(channels) == 0 || $channel in channels ) ]`
      : ''
    const q = `*[_type=="faqGroup" ${filter}] | order(weight asc){_id, title, slug, "items":items()${itemChannelFilter}}`
    params.channel = channel
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
    const channel = String((req.query as any).channel || '').trim()
    const channelExpr = channel
      ? ' && ( !defined(channels) || count(channels) == 0 || $channel in channels )'
      : ''
    // include channels so admin UI can display which channels a legal doc targets; optionally filter
    const q = `*[_type=="legalDoc" ${filter}${channelExpr}] | order(effectiveFrom desc, version desc){_id, title, type, stateCode, version, effectiveFrom, effectiveTo, channels}`
    params.channel = channel
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
    const {filter, params} = buildMetricScopeFilter(admin)
    const limit = Number((req.query as any).limit || 50)
    const q = `*[_type=="contentMetric" ${filter}] | order(views desc, clickThroughs desc)[0...${limit}]`
    const items = await fetchCMS(q, params)
    res.json(items || [])
  } catch (err) {
    console.error('failed analytics metrics', err)
    res.status(500).json({error: 'FAILED'})
  }
})

// GET /api/admin/analytics/overview
// Returns aggregated metrics and top lists for the admin dashboard.
adminRouter.get('/analytics/overview', requireRole('ORG_ADMIN'), async (req, res) => {
  try {
    const admin = (req as any).admin
    const {filter, params} = buildMetricScopeFilter(admin)
    const limit = Number((req.query as any).limit || 5)

    // Pagination support for large windows / result sets
    const page = Math.max(0, Number((req.query as any).page || 0))
    const perPage = Math.max(1, Number((req.query as any).perPage || limit))

    // Construct cache key from admin scope and query params
    const cacheKey = JSON.stringify({
      brand: admin?.brandSlug,
      store: admin?.storeSlug,
      org: admin?.organizationSlug,
      query: req.query,
    })
    const cached = overviewCache.get(cacheKey)
    if (cached && Date.now() - cached.ts < OVERVIEW_CACHE_TTL) {
      // apply pagination to cached top lists if needed
      const out = {...cached.data}
      if (out.topProducts && perPage)
        out.topProducts = out.topProducts.slice(page * perPage, page * perPage + perPage)
      if (out.productSeries && perPage)
        out.productSeries = out.productSeries.slice(page * perPage, page * perPage + perPage)
      return res.json(out)
    }

    // Top articles and faqs by views, top products by clickThroughs
    const start = page * perPage
    const end = start + perPage
    const topArticlesQ = `*[_type=="contentMetric" && contentType=="article" ${filter}] | order(views desc)[${start}...${end}]{contentSlug, views, clickThroughs, lastUpdated}`
    const topFaqsQ = `*[_type=="contentMetric" && contentType=="faq" ${filter}] | order(views desc)[${start}...${end}]{contentSlug, views, clickThroughs, lastUpdated}`
    const topProductsQ = `*[_type=="contentMetric" && contentType=="product" ${filter}] | order(clickThroughs desc)[${start}...${end}]{contentSlug, views, clickThroughs, lastUpdated}`

    // Fetch product metrics to compute demand scores (simple rule-based)
    const productsForDemandQ = `*[_type==\"contentMetricDaily\" && contentType==\"product\" ${filter} && date >= $startHistoric]{contentSlug, views, clickThroughs, date}`

    // Allow window configuration via query params or env vars
    const windowDays = Number(
      (req.query as any).windowDays || process.env.ANALYTICS_WINDOW_DAYS || 30,
    )
    const recentDays = Number(
      (req.query as any).recentDays || process.env.ANALYTICS_RECENT_DAYS || 7,
    )
    const startHistoric = new Date(Date.now() - 1000 * 60 * 60 * 24 * windowDays).toISOString()
    const [topArticles, topFaqs, topProducts, productsForDemand] = await Promise.all([
      fetchCMS(topArticlesQ, params),
      fetchCMS(topFaqsQ, params),
      fetchCMS(topProductsQ, params),
      fetchCMS(productsForDemandQ, {...params, startHistoric}),
    ])

    // If the caller provided an org-level Analytics Settings doc, merge overrides
    // Try to read settings from Sanity (settings stored per organization slug)
    try {
      const orgSlug = admin?.organizationSlug || 'global'
      const settingsQ = `*[_type=="analyticsSettings" && orgSlug == $org][0]`
      const settings: any = await fetchCMS(settingsQ, {org: orgSlug})
      if (settings) {
        // prefer explicit query params, else settings, else env defaults — handled later when computing weights
        const qAny: any = (req as any).query
        if (!qAny.windowDays && settings.windowDays) qAny.windowDays = settings.windowDays
        if (!qAny.recentDays && settings.recentDays) qAny.recentDays = settings.recentDays
        if (!qAny.wRecentClicks && settings.wRecentClicks)
          qAny.wRecentClicks = settings.wRecentClicks
        if (!qAny.wRecentViews && settings.wRecentViews) qAny.wRecentViews = settings.wRecentViews
        if (!qAny.wHistoricClicks && settings.wHistoricClicks)
          qAny.wHistoricClicks = settings.wHistoricClicks
        if (!qAny.wHistoricViews && settings.wHistoricViews)
          qAny.wHistoricViews = settings.wHistoricViews
      }
    } catch (e) {
      // ignore settings fetch errors — fall back to env/query defaults
    }

    // Aggregate store engagement from daily metric docs that include storeSlug
    const storeQ = `*[_type==\"contentMetricDaily\" ${filter} && defined(storeSlug) && date >= $startHistoric]{storeSlug, date, views, clickThroughs}`
    const storeRows: any[] = (await fetchCMS(storeQ, {...params, startHistoric})) || []
    const storeMap: Record<string, {views: number; clickThroughs: number}> = {}
    storeRows.forEach((r: any) => {
      const s = r.storeSlug || 'unknown'
      if (!storeMap[s]) storeMap[s] = {views: 0, clickThroughs: 0}
      storeMap[s].views += Number(r.views || 0)
      storeMap[s].clickThroughs += Number(r.clickThroughs || 0)
    })
    const storeEngagement = Object.keys(storeMap).map((k) => ({storeSlug: k, ...storeMap[k]}))

    // Compute simple product demand score: score = clicks * 2 + views * 0.1
    // Classify: >100 = risingDemand, 20-100 = steady, 5-20 = fallingDemand, <5 = lowEngagement
    // productsForDemand contains daily rows across the historic window; aggregate by slug
    const bySlug: Record<
      string,
      {views: number; clicks: number; recentViews: number; recentClicks: number}
    > = {}
    const recentCutoff = new Date(Date.now() - 1000 * 60 * 60 * 24 * recentDays)
    ;((productsForDemand as any[]) || []).forEach((row) => {
      const slug = row.contentSlug
      if (!bySlug[slug]) bySlug[slug] = {views: 0, clicks: 0, recentViews: 0, recentClicks: 0}
      const v = Number(row.views || 0)
      const c = Number(row.clickThroughs || 0)
      bySlug[slug].views += v
      bySlug[slug].clicks += c
      const d = new Date(row.date)
      if (d >= recentCutoff) {
        bySlug[slug].recentViews += v
        bySlug[slug].recentClicks += c
      }
    })
    // Allow weight overrides via env or query params
    const wRecentClicks = Number(
      (req.query as any).wRecentClicks || process.env.ANALYTICS_WEIGHT_RECENT_CLICKS || 2.5,
    )
    const wRecentViews = Number(
      (req.query as any).wRecentViews || process.env.ANALYTICS_WEIGHT_RECENT_VIEWS || 0.2,
    )
    const wHistoricClicks = Number(
      (req.query as any).wHistoricClicks || process.env.ANALYTICS_WEIGHT_HISTORIC_CLICKS || 1,
    )
    const wHistoricViews = Number(
      (req.query as any).wHistoricViews || process.env.ANALYTICS_WEIGHT_HISTORIC_VIEWS || 0.05,
    )

    const productDemand = Object.keys(bySlug).map((slug) => {
      const s = bySlug[slug]
      // Weighted score: recent activity has higher weight
      const demandScore =
        s.recentClicks * wRecentClicks +
        s.recentViews * wRecentViews +
        (s.clicks - s.recentClicks) * wHistoricClicks +
        (s.views - s.recentViews) * wHistoricViews
      let status = 'lowEngagement'
      const risingThreshold = Number(process.env.ANALYTICS_THRESHOLD_RISING || 200)
      const steadyThreshold = Number(process.env.ANALYTICS_THRESHOLD_STEADY || 40)
      const fallingThreshold = Number(process.env.ANALYTICS_THRESHOLD_FALLING || 10)
      if (demandScore > risingThreshold) status = 'risingDemand'
      else if (demandScore >= steadyThreshold) status = 'steady'
      else if (demandScore >= fallingThreshold) status = 'fallingDemand'
      return {slug, demandScore, status}
    })

    // Build time series per product for the windowDays range (for sparklines)
    const seriesDates: string[] = []
    for (let i = windowDays - 1; i >= 0; i--) {
      const d = new Date()
      d.setUTCDate(d.getUTCDate() - i)
      seriesDates.push(d.toISOString().slice(0, 10))
    }
    const productSeries: Array<{
      slug: string
      series: Array<{date: string; views: number; clickThroughs: number}>
    }> = []
    const rows = (productsForDemand as any[]) || []
    const grouped: Record<string, Record<string, {views: number; clickThroughs: number}>> = {}
    rows.forEach((r) => {
      const slug = r.contentSlug
      const date = String(r.date).slice(0, 10)
      if (!grouped[slug]) grouped[slug] = {}
      if (!grouped[slug][date]) grouped[slug][date] = {views: 0, clickThroughs: 0}
      grouped[slug][date].views += Number(r.views || 0)
      grouped[slug][date].clickThroughs += Number(r.clickThroughs || 0)
    })
    // For topProducts, include series
    const slugsForSeries = ((topProducts as any[]) || []).map((p: any) => p.contentSlug)
    slugsForSeries.forEach((slug: string) => {
      const map = grouped[slug] || {}
      const series = seriesDates.map((date) => ({
        date,
        views: map[date]?.views || 0,
        clickThroughs: map[date]?.clickThroughs || 0,
      }))
      productSeries.push({slug, series})
    })

    const responsePayload = {
      topArticles: topArticles || [],
      topFaqs: topFaqs || [],
      topProducts: topProducts || [],
      storeEngagement,
      productDemand,
      productSeries,
    }

    // Cache the full payload for the TTL duration
    try {
      overviewCache.set(cacheKey, {ts: Date.now(), data: responsePayload})
    } catch (e) {
      // ignore cache set errors
    }

    return res.json(responsePayload)
  } catch (err) {
    console.error('failed analytics overview', err)
    res.status(500).json({error: 'FAILED'})
  }
})

// GET /api/admin/compliance/overview - per-store compliance summary
adminRouter.get('/compliance/overview', requireRole('ORG_ADMIN'), async (req, res) => {
  try {
    const reqTypes = (req.query.types as string) || ''
    const types = reqTypes
      ? reqTypes.split(',').map((s) => s.trim())
      : ['terms', 'privacy', 'accessibility', 'ageGate']
    const admin = (req as any).admin

    // Prefer a pre-computed snapshot for the org (or global fallback)
    try {
      const snapshot = await fetchCMS('*[_type=="complianceSnapshot" && _id == $id][0]', {
        id: `complianceSnapshotLatest-${admin?.organizationSlug || 'global'}`,
      })
      if (snapshot && (snapshot as any).results)
        return res.json({
          results: (snapshot as any).results,
          snapshotTs: (snapshot as any).ts,
          snapshotId: (snapshot as any)._id,
        })
    } catch (_e) {
      // fall back to live compute
    }

    const rows = await computeCompliance(types, {
      org: admin?.organizationSlug,
      brand: admin?.brandSlug,
    })
    // backward-compatible response: return array for live compute
    return res.json(rows)
  } catch (err) {
    console.error('failed compliance overview', err)
    res.status(500).json({error: 'FAILED'})
  }
})

// POST /api/admin/compliance/snapshot - trigger manual snapshot for admin's scope
adminRouter.post('/compliance/snapshot', requireRole('ORG_ADMIN'), async (req, res) => {
  try {
    const admin = (req as any).admin
    // determine target scope with RBAC enforcement
    // only allow org admins to snapshot their own org; OWNER can snapshot global or provide org param
    let targetOrg = admin.organizationSlug
    let targetBrand = admin.brandSlug
    if (admin.role === 'OWNER' && req.body?.org) {
      targetOrg = req.body.org
    }
    if (req.body?.brand) {
      // only OWNER or BRAND_ADMIN for their brand may specify brand param
      if (admin.role !== 'OWNER' && admin.role !== 'BRAND_ADMIN') {
        return res.status(403).json({error: 'FORBIDDEN'})
      }
      // BRAND_ADMIN may only snapshot their own brand
      if (admin.role === 'BRAND_ADMIN' && req.body.brand !== admin.brandSlug) {
        return res.status(403).json({error: 'FORBIDDEN'})
      }
      targetBrand = req.body.brand
    }

    // run a one-off compute for the given scope and persist
    const types = req.body?.types || ['terms', 'privacy', 'accessibility', 'ageGate']
    const results = await computeCompliance(types, {org: targetOrg, brand: targetBrand})
    const client = createWriteClient()
    const ts = new Date().toISOString()
    const idParts = [
      'complianceSnapshot',
      targetOrg || 'global',
      targetBrand ? `brand-${targetBrand}` : null,
      ts,
    ].filter(Boolean)
    const historyId = idParts.join('-')
    const runBy = (admin && (admin.email || admin.id || admin.name)) || 'unknown'
    const historyDoc: any = {
      _id: historyId,
      _type: 'complianceSnapshot',
      orgSlug: targetOrg || 'global',
      brandSlug: targetBrand || undefined,
      ts,
      results,
      runBy,
    }
    await client.create(historyDoc).catch(() => client.createOrReplace(historyDoc))
    const latestId = `complianceSnapshotLatest-${targetBrand ? `brand-${targetBrand}` : targetOrg || 'global'}`
    const latestDoc: any = {...historyDoc, _id: latestId}
    await client.createOrReplace(latestDoc)
    // update central monitor doc (merge previous lastRuns if present)
    try {
      const monitorId = 'complianceMonitor'
      const existing = await fetchCMS('*[_type=="complianceMonitor" && _id == $id][0]', {
        id: monitorId,
      })
      // existing may be a plain object from fetchCMS; guard and ensure lastRuns is an array
      const prev =
        existing && Array.isArray((existing as any).lastRuns) ? (existing as any).lastRuns : []
      const entry: any = {
        scope: targetBrand ? `brand:${targetBrand}` : `org:${targetOrg || 'global'}`,
        snapshotId: historyId,
        ts,
        runBy,
      }
      const merged = [entry, ...prev].slice(0, 20)
      const monitorDoc: any = {_id: monitorId, _type: 'complianceMonitor', lastRuns: merged}
      await client.createOrReplace(monitorDoc)
    } catch (e) {
      // ignore monitor update failures
    }
    const studioBase = process.env.SANITY_STUDIO_URL || null
    const studioUrl = studioBase
      ? `${studioBase.replace(/\/$/, '')}/desk/complianceSnapshot;${historyId}`
      : null
    console.info('compliance snapshot run', {
      runBy,
      scope: targetBrand ? `brand:${targetBrand}` : `org:${targetOrg || 'global'}`,
      ts,
      id: historyId,
    })
    res.json({ok: true, id: historyId, ts, studioUrl})
  } catch (err) {
    console.error('failed manual compliance snapshot', err)
    res.status(500).json({error: 'FAILED'})
  }
})

// GET /api/admin/compliance/history - list recent snapshot history for the admin scope
adminRouter.get('/compliance/history', requireRole('ORG_ADMIN'), async (req, res) => {
  try {
    const admin = (req as any).admin
    const limit = Math.max(1, Math.min(200, Number((req.query as any).limit || 50)))
    // scope: if brand query is provided, enforce RBAC similar to snapshot POST
    let targetOrg = admin.organizationSlug
    let targetBrand = admin.brandSlug
    if (admin.role === 'OWNER' && req.query?.org) targetOrg = String(req.query.org)
    if (req.query?.brand) {
      if (admin.role !== 'OWNER' && admin.role !== 'BRAND_ADMIN')
        return res.status(403).json({error: 'FORBIDDEN'})
      if (admin.role === 'BRAND_ADMIN' && String(req.query.brand) !== admin.brandSlug)
        return res.status(403).json({error: 'FORBIDDEN'})
      targetBrand = String(req.query.brand)
    }
    const q = `*[_type=="complianceSnapshot" && orgSlug == $org ${targetBrand ? '&& brandSlug == $brand' : ''}] | order(ts desc)[0...${limit}]`
    const params: any = {org: targetOrg || 'global'}
    if (targetBrand) params.brand = targetBrand
    const rows = await fetchCMS(q, params)
    const studioBase = process.env.SANITY_STUDIO_URL || null
    const mapped = Array.isArray(rows)
      ? rows.map((r: any) => ({
          ...r,
          studioUrl: studioBase
            ? `${studioBase.replace(/\/$/, '')}/desk/complianceSnapshot;${r._id}`
            : null,
        }))
      : []
    res.json(mapped)
  } catch (e) {
    console.error('failed fetch compliance history', e)
    res.status(500).json({error: 'FAILED'})
  }
})

// GET/POST /api/admin/analytics/settings - store per-org analytics tuning (persisted to Sanity)
adminRouter.get('/analytics/settings', requireRole('ORG_ADMIN'), async (req, res) => {
  try {
    const admin = (req as any).admin
    const org = admin?.organizationSlug || 'global'
    const q = `*[_type=="analyticsSettings" && orgSlug == $org][0]`
    const settings = await fetchCMS(q, {org})
    res.json(settings || null)
  } catch (err) {
    console.error('failed fetch analytics settings', err)
    res.status(500).json({error: 'FAILED'})
  }
})

adminRouter.post('/analytics/settings', requireRole('ORG_ADMIN'), async (req, res) => {
  try {
    const admin = (req as any).admin
    const org = admin?.organizationSlug || 'global'
    const body = req.body || {}
    // Server-side validation
    const errors: Record<string, string> = {}
    const windowDays = Number(body.windowDays ?? 30)
    const recentDays = Number(body.recentDays ?? 7)
    const wRecentClicks = Number(body.wRecentClicks ?? 2.5)
    const wRecentViews = Number(body.wRecentViews ?? 0.2)
    const wHistoricClicks = Number(body.wHistoricClicks ?? 1)
    const wHistoricViews = Number(body.wHistoricViews ?? 0.05)
    const thresholdRising = Number(body.thresholdRising ?? 200)
    const thresholdSteady = Number(body.thresholdSteady ?? 40)
    const thresholdFalling = Number(body.thresholdFalling ?? 10)

    if (!Number.isFinite(windowDays) || windowDays <= 0)
      errors.windowDays = 'windowDays must be a positive number'
    if (!Number.isFinite(recentDays) || recentDays <= 0)
      errors.recentDays = 'recentDays must be a positive number'
    if (recentDays > windowDays) errors.recentDays = 'recentDays cannot exceed windowDays'
    if (!Number.isFinite(wRecentClicks)) errors.wRecentClicks = 'wRecentClicks must be a number'
    if (!Number.isFinite(wRecentViews)) errors.wRecentViews = 'wRecentViews must be a number'
    if (!Number.isFinite(wHistoricClicks))
      errors.wHistoricClicks = 'wHistoricClicks must be a number'
    if (!Number.isFinite(wHistoricViews)) errors.wHistoricViews = 'wHistoricViews must be a number'
    if (!Number.isFinite(thresholdRising) || thresholdRising < 0)
      errors.thresholdRising = 'thresholdRising must be >= 0'
    if (!Number.isFinite(thresholdSteady) || thresholdSteady < 0)
      errors.thresholdSteady = 'thresholdSteady must be >= 0'
    if (!Number.isFinite(thresholdFalling) || thresholdFalling < 0)
      errors.thresholdFalling = 'thresholdFalling must be >= 0'

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({error: 'INVALID_SETTINGS', details: errors})
    }
    const id = `analyticsSettings-${org}`
    const doc: any = {
      _id: id,
      _type: 'analyticsSettings',
      orgSlug: org,
      windowDays,
      recentDays,
      wRecentClicks,
      wRecentViews,
      wHistoricClicks,
      wHistoricViews,
      thresholdRising,
      thresholdSteady,
      thresholdFalling,
    }
    const client = createWriteClient()
    const created = await client.createOrReplace(doc)

    // invalidate overview cache entries for this org
    for (const k of Array.from(overviewCache.keys())) {
      try {
        const parsed = JSON.parse(k)
        if (parsed.org === org) overviewCache.delete(k)
      } catch (_e) {
        // ignore
      }
    }

    res.json({ok: true, settings: created})
  } catch (err) {
    console.error('failed save analytics settings', err)
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
