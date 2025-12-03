import {Router, Response, Request} from 'express'
import crypto from 'crypto'
import {fetchCMS, createWriteClient} from '../lib/cms'
import {computeCompliance} from '../lib/compliance'
import {z} from 'zod'
import {requireRole, canAccessBrand, canAccessStore} from '../middleware/requireRole'
import {portableTextToHtml} from '../lib/portableText'
import {logger} from '../lib/logger'
import {
  getDashboardLayout,
  saveDashboardLayout,
  getNotificationPreferences,
  saveNotificationPreferences,
  getDefaults,
} from '../lib/preferencesStore'

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

function ensureBrandScope(res: Response, admin: any, brand?: string | null) {
  if (!brand) return true
  if (canAccessBrand(admin, brand)) return true
  res.status(403).json({error: 'FORBIDDEN'})
  return false
}

function ensureStoreScope(res: Response, admin: any, store?: string | null, brand?: string | null) {
  if (!store) return true
  if (canAccessStore(admin, store, brand)) return true
  res.status(403).json({error: 'FORBIDDEN'})
  return false
}

function resolveScopedBrand(
  req: Request,
  providedBrand?: string | null,
): {ok: true; brand: string} | {ok: false; status: number; error: string} {
  const admin = (req as any).admin
  const targetBrand = (providedBrand || admin?.brandSlug || '').trim()
  if (!targetBrand) return {ok: false, status: 400, error: 'MISSING_BRAND'}
  if (!canAccessBrand(admin, targetBrand)) return {ok: false, status: 403, error: 'FORBIDDEN'}
  return {ok: true, brand: targetBrand}
}

export const adminRouter = Router()

// Simple in-memory cache for overview responses to avoid repeated heavy queries.
type AnalyticsCacheEntry = {ts: number; data: any; refreshedAt?: string}
const overviewCache: Map<string, AnalyticsCacheEntry> = new Map()
const OVERVIEW_CACHE_TTL = Number(process.env.ANALYTICS_OVERVIEW_CACHE_TTL_MS || 30000)
const complianceOverviewCache: Map<string, {ts: number; data: any}> = new Map()
const COMPLIANCE_OVERVIEW_CACHE_TTL_MS = Number(
  process.env.COMPLIANCE_OVERVIEW_CACHE_TTL_MS || 60000,
)

export function __clearComplianceOverviewCacheForTests() {
  complianceOverviewCache.clear()
}
const ANALYTICS_CACHE_DOC_PREFIX = 'analyticsOverviewCache'
const MAX_LOGO_BYTES = Number(process.env.MAX_LOGO_BYTES || 2 * 1024 * 1024)
const ALLOWED_LOGO_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'svg', 'webp'])
const ALLOWED_LOGO_MIME = new Set(['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'])
const analyticsSettingsSchema = z
  .object({
    windowDays: z.coerce.number().positive().max(365).default(30),
    recentDays: z.coerce.number().positive().max(365).default(7),
    wRecentClicks: z.coerce
      .number()
      .refine((n) => Number.isFinite(n), {
        message: 'wRecentClicks must be a number',
      })
      .default(2.5),
    wRecentViews: z.coerce
      .number()
      .refine((n) => Number.isFinite(n), {
        message: 'wRecentViews must be a number',
      })
      .default(0.2),
    wHistoricClicks: z.coerce
      .number()
      .refine((n) => Number.isFinite(n), {
        message: 'wHistoricClicks must be a number',
      })
      .default(1),
    wHistoricViews: z.coerce
      .number()
      .refine((n) => Number.isFinite(n), {
        message: 'wHistoricViews must be a number',
      })
      .default(0.05),
    thresholdRising: z.coerce.number().min(0).default(200),
    thresholdSteady: z.coerce.number().min(0).default(40),
    thresholdFalling: z.coerce.number().min(0).default(10),
  })
  .superRefine((val, ctx) => {
    if (val.recentDays > val.windowDays) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['recentDays'],
        message: 'recentDays cannot exceed windowDays',
      })
    }
  })

function firstQueryValue(value: any) {
  if (Array.isArray(value)) return value[0]
  return value
}

function normalizeQueryParams(query: any): Record<string, any> {
  const normalized: Record<string, any> = {}
  if (!query) return normalized
  for (const key of Object.keys(query)) {
    normalized[key] = firstQueryValue((query as any)[key])
  }
  return normalized
}

function withoutCacheBust(query: Record<string, any>) {
  const next = {...query}
  if (Object.prototype.hasOwnProperty.call(next, 'cacheBust')) {
    delete next.cacheBust
  }
  return next
}

function coerceNumber(value: any): number | undefined {
  if (value === undefined || value === null || value === '') return undefined
  const num = Number(value)
  if (!Number.isFinite(num)) return undefined
  return num
}

function resolveNumber(values: Array<any>, fallback: number): number {
  for (const value of values) {
    const num = coerceNumber(value)
    if (typeof num === 'number') return num
  }
  return fallback
}

function buildAnalyticsCacheKey(admin: any, query: any) {
  return JSON.stringify({
    org: admin?.organizationSlug || null,
    brand: admin?.brandSlug || null,
    store: admin?.storeSlug || null,
    query: query || {},
  })
}

function getAnalyticsCacheDocId(cacheKey: string) {
  const hash = crypto.createHash('sha256').update(cacheKey).digest('hex').slice(0, 32)
  return `${ANALYTICS_CACHE_DOC_PREFIX}-${hash}`
}

type AnalyticsCacheDoc = {data: any; ts: string}

async function readAnalyticsOverviewCacheDoc(cacheKey: string): Promise<AnalyticsCacheDoc | null> {
  try {
    const doc = await fetchCMS('*[_id == $id][0]{payload, ts}', {
      id: getAnalyticsCacheDocId(cacheKey),
    })
    if (!doc || !(doc as any).payload || !(doc as any).ts) return null
    const ts = (doc as any).ts as string
    const payload = JSON.parse((doc as any).payload as string)
    return {data: payload, ts}
  } catch (err) {
    logger.warn('analytics overview cache read failed', {
      error: err instanceof Error ? err.message : String(err),
    })
  }
  return null
}

type AnalyticsOverviewComputation = {
  payload: {
    topArticles: any[]
    topFaqs: any[]
    topProducts: any[]
    storeEngagement: any[]
    productDemand: any[]
    productSeries: any[]
  }
  cacheMode: 'HIT' | 'PERSISTED' | 'MISS'
  refreshedAt: string
}

async function computeAnalyticsOverview(
  admin: any,
  rawQuery: any,
  options: {forceRefresh?: boolean} = {},
): Promise<AnalyticsOverviewComputation> {
  const normalizedQuery = normalizeQueryParams(rawQuery)
  const cacheKey = buildAnalyticsCacheKey(admin, normalizedQuery)
  const now = Date.now()
  const forceRefresh = options.forceRefresh === true

  if (!forceRefresh) {
    const cached = overviewCache.get(cacheKey)
    if (cached && now - cached.ts < OVERVIEW_CACHE_TTL) {
      const refreshedAt = cached.refreshedAt || new Date(cached.ts).toISOString()
      return {payload: cached.data, cacheMode: 'HIT', refreshedAt}
    }
    const persisted = await readPersistentAnalyticsOverviewCache(cacheKey, OVERVIEW_CACHE_TTL)
    if (persisted) {
      overviewCache.set(cacheKey, {ts: now, data: persisted.data, refreshedAt: persisted.ts})
      return {payload: persisted.data, cacheMode: 'PERSISTED', refreshedAt: persisted.ts}
    }
  }

  const limit = Math.max(1, resolveNumber([normalizedQuery.limit], 5))
  const page = Math.max(0, resolveNumber([normalizedQuery.page], 0))
  const perPage = Math.max(1, resolveNumber([normalizedQuery.perPage], limit))

  const {filter, params} = buildMetricScopeFilter(admin)
  const orgSlug = admin?.organizationSlug || 'global'

  let settings: any = null
  try {
    settings = await fetchCMS('*[_type=="analyticsSettings" && orgSlug == $org][0]', {org: orgSlug})
  } catch (err) {
    logger.warn('analytics settings fetch failed', {
      orgSlug,
      error: err instanceof Error ? err.message : String(err),
    })
  }

  const windowDays = Math.max(
    1,
    resolveNumber(
      [normalizedQuery.windowDays, settings?.windowDays, process.env.ANALYTICS_WINDOW_DAYS],
      30,
    ),
  )
  const recentDaysRaw = resolveNumber(
    [normalizedQuery.recentDays, settings?.recentDays, process.env.ANALYTICS_RECENT_DAYS],
    7,
  )
  const recentDays = Math.min(windowDays, Math.max(1, recentDaysRaw))
  const wRecentClicks = resolveNumber(
    [
      normalizedQuery.wRecentClicks,
      settings?.wRecentClicks,
      process.env.ANALYTICS_WEIGHT_RECENT_CLICKS,
    ],
    2.5,
  )
  const wRecentViews = resolveNumber(
    [
      normalizedQuery.wRecentViews,
      settings?.wRecentViews,
      process.env.ANALYTICS_WEIGHT_RECENT_VIEWS,
    ],
    0.2,
  )
  const wHistoricClicks = resolveNumber(
    [
      normalizedQuery.wHistoricClicks,
      settings?.wHistoricClicks,
      process.env.ANALYTICS_WEIGHT_HISTORIC_CLICKS,
    ],
    1,
  )
  const wHistoricViews = resolveNumber(
    [
      normalizedQuery.wHistoricViews,
      settings?.wHistoricViews,
      process.env.ANALYTICS_WEIGHT_HISTORIC_VIEWS,
    ],
    0.05,
  )
  const thresholdRising = resolveNumber(
    [
      normalizedQuery.thresholdRising,
      settings?.thresholdRising,
      process.env.ANALYTICS_THRESHOLD_RISING,
    ],
    200,
  )
  const thresholdSteady = resolveNumber(
    [
      normalizedQuery.thresholdSteady,
      settings?.thresholdSteady,
      process.env.ANALYTICS_THRESHOLD_STEADY,
    ],
    40,
  )
  const thresholdFalling = resolveNumber(
    [
      normalizedQuery.thresholdFalling,
      settings?.thresholdFalling,
      process.env.ANALYTICS_THRESHOLD_FALLING,
    ],
    10,
  )

  const start = page * perPage
  const end = start + perPage
  const topArticlesQ = `*[_type=="contentMetric" && contentType=="article" ${filter}] | order(views desc)[${start}...${end}]{contentSlug, views, clickThroughs, lastUpdated}`
  const topFaqsQ = `*[_type=="contentMetric" && contentType=="faq" ${filter}] | order(views desc)[${start}...${end}]{contentSlug, views, clickThroughs, lastUpdated}`
  const topProductsQ = `*[_type=="contentMetric" && contentType=="product" ${filter}] | order(clickThroughs desc)[${start}...${end}]{contentSlug, views, clickThroughs, lastUpdated}`
  const startHistoric = new Date(Date.now() - 1000 * 60 * 60 * 24 * windowDays).toISOString()
  const productsForDemandQ = `*[_type=="contentMetricDaily" && contentType=="product" ${filter} && date >= $startHistoric]{contentSlug, views, clickThroughs, date}`
  const storeQ = `*[_type=="contentMetricDaily" ${filter} && defined(storeSlug) && date >= $startHistoric]{storeSlug, date, views, clickThroughs}`

  const [topArticles, topFaqs, topProducts, productsForDemand, storeRows] = await Promise.all([
    fetchCMS(topArticlesQ, params),
    fetchCMS(topFaqsQ, params),
    fetchCMS(topProductsQ, params),
    fetchCMS(productsForDemandQ, {...params, startHistoric}),
    fetchCMS(storeQ, {...params, startHistoric}),
  ])

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

  const productDemand = Object.keys(bySlug).map((slug) => {
    const s = bySlug[slug]
    const demandScore =
      s.recentClicks * wRecentClicks +
      s.recentViews * wRecentViews +
      (s.clicks - s.recentClicks) * wHistoricClicks +
      (s.views - s.recentViews) * wHistoricViews
    let status = 'lowEngagement'
    if (demandScore > thresholdRising) status = 'risingDemand'
    else if (demandScore >= thresholdSteady) status = 'steady'
    else if (demandScore >= thresholdFalling) status = 'fallingDemand'
    return {slug, demandScore, status}
  })

  const seriesDates: string[] = []
  for (let i = windowDays - 1; i >= 0; i--) {
    const d = new Date()
    d.setUTCDate(d.getUTCDate() - i)
    seriesDates.push(d.toISOString().slice(0, 10))
  }

  const groupedSeries: Record<string, Record<string, {views: number; clickThroughs: number}>> = {}
  ;((productsForDemand as any[]) || []).forEach((row) => {
    const slug = row.contentSlug
    const date = String(row.date).slice(0, 10)
    if (!groupedSeries[slug]) groupedSeries[slug] = {}
    if (!groupedSeries[slug][date]) groupedSeries[slug][date] = {views: 0, clickThroughs: 0}
    groupedSeries[slug][date].views += Number(row.views || 0)
    groupedSeries[slug][date].clickThroughs += Number(row.clickThroughs || 0)
  })

  const productSeries: Array<{
    slug: string
    series: Array<{date: string; views: number; clickThroughs: number}>
  }> = []
  const slugsForSeries = ((topProducts as any[]) || []).map((p: any) => p.contentSlug)
  slugsForSeries.forEach((slug: string) => {
    const map = groupedSeries[slug] || {}
    const series = seriesDates.map((date) => ({
      date,
      views: map[date]?.views || 0,
      clickThroughs: map[date]?.clickThroughs || 0,
    }))
    productSeries.push({slug, series})
  })

  const storeMap: Record<string, {views: number; clickThroughs: number}> = {}
  ;((storeRows as any[]) || []).forEach((row: any) => {
    const slug = row.storeSlug || 'unknown'
    if (!storeMap[slug]) storeMap[slug] = {views: 0, clickThroughs: 0}
    storeMap[slug].views += Number(row.views || 0)
    storeMap[slug].clickThroughs += Number(row.clickThroughs || 0)
  })
  const storeEngagement = Object.keys(storeMap).map((k) => ({storeSlug: k, ...storeMap[k]}))

  const payload = {
    topArticles: Array.isArray(topArticles) ? topArticles : [],
    topFaqs: Array.isArray(topFaqs) ? topFaqs : [],
    topProducts: Array.isArray(topProducts) ? topProducts : [],
    storeEngagement,
    productDemand,
    productSeries,
  }

  const refreshedAt = new Date().toISOString()
  try {
    overviewCache.set(cacheKey, {ts: now, data: payload, refreshedAt})
  } catch (err) {
    logger.warn('analytics overview cache set failed', {
      error: err instanceof Error ? err.message : String(err),
    })
  }
  await writePersistentAnalyticsOverviewCache(cacheKey, payload, refreshedAt)
  return {payload, cacheMode: 'MISS', refreshedAt}
}

adminRouter.get('/analytics/overview', requireRole('ORG_ADMIN'), async (req, res) => {
  try {
    const admin = (req as any).admin
    const result = await computeAnalyticsOverview(admin, req.query)
    res.set('X-Analytics-Overview-Cache', result.cacheMode)
    return res.json(result.payload)
  } catch (err) {
    req.log.error('admin.analytics.overview_failed', err)
    res.status(500).json({error: 'FAILED'})
  }
})

adminRouter.get('/analytics/summary', requireRole('VIEWER'), async (req, res) => {
  try {
    const admin = (req as any).admin
    const summaryQuery = withoutCacheBust(normalizeQueryParams(req.query))
    const cacheKey = buildAnalyticsCacheKey(admin, summaryQuery)
    const ttlMs = OVERVIEW_CACHE_TTL
    const now = Date.now()
    let lastRefreshedAt: string | null = null
    let ageMs: number | null = null
    let source: 'NONE' | 'MEMORY' | 'MEMORY_STALE' | 'PERSISTED' = 'NONE'

    const cached = overviewCache.get(cacheKey)
    if (cached) {
      lastRefreshedAt = cached.refreshedAt || new Date(cached.ts).toISOString()
      ageMs = now - cached.ts
      source = ageMs < ttlMs ? 'MEMORY' : 'MEMORY_STALE'
    } else {
      const persisted = await readAnalyticsOverviewCacheDoc(cacheKey)
      if (persisted) {
        lastRefreshedAt = persisted.ts
        ageMs = now - Date.parse(persisted.ts)
        source = 'PERSISTED'
      }
    }

    const stale = !lastRefreshedAt || (ageMs !== null && ageMs > ttlMs)
    res.json({cacheKey, ttlMs, lastRefreshedAt, ageMs, stale, source})
  } catch (err) {
    req.log.error('admin.analytics.summary_failed', err)
    res.status(500).json({error: 'FAILED'})
  }
})

adminRouter.post('/analytics/summary', requireRole('ORG_ADMIN'), async (req, res) => {
  try {
    const admin = (req as any).admin
    const bodyQuery = normalizeQueryParams((req.body && req.body.query) || {})
    const initialQuery = withoutCacheBust(normalizeQueryParams(req.query))
    const mergedQuery = withoutCacheBust({...initialQuery, ...bodyQuery})
    const result = await computeAnalyticsOverview(admin, mergedQuery, {forceRefresh: true})
    res.json({
      ok: true,
      cacheMode: result.cacheMode,
      lastRefreshedAt: result.refreshedAt,
      preview: {
        topArticles: result.payload.topArticles.slice(0, 3),
        topProducts: result.payload.topProducts.slice(0, 3),
        storeEngagement: result.payload.storeEngagement.slice(0, 3),
      },
    })
  } catch (err) {
    req.log.error('admin.analytics.summary_refresh_failed', err)
    res.status(500).json({error: 'FAILED'})
  }
})

async function readPersistentAnalyticsOverviewCache(cacheKey: string, ttlMs: number) {
  const doc = await readAnalyticsOverviewCacheDoc(cacheKey)
  if (!doc) return null
  const age = Date.now() - Date.parse(doc.ts)
  if (Number.isFinite(age) && age < ttlMs) {
    return doc
  }
  return null
}

async function writePersistentAnalyticsOverviewCache(cacheKey: string, data: any, ts?: string) {
  try {
    const client = createWriteClient()
    const refreshedAt = ts || new Date().toISOString()
    await client.createOrReplace({
      _id: getAnalyticsCacheDocId(cacheKey),
      _type: 'analyticsOverviewCache',
      scopeKey: cacheKey,
      payload: JSON.stringify(data),
      ts: refreshedAt,
    })
  } catch (err) {
    logger.warn('analytics overview cache write failed', {
      error: err instanceof Error ? err.message : String(err),
    })
  }
}

function buildComplianceCacheKey(admin: any, types: string[], brandOverride?: string | null) {
  const normalizedTypes = [
    ...new Set((types || []).map((t) => String(t).trim()).filter(Boolean)),
  ].sort()
  return JSON.stringify({
    org: admin?.organizationSlug || 'global',
    brand: typeof brandOverride !== 'undefined' ? brandOverride || null : admin?.brandSlug || null,
    types: normalizedTypes,
  })
}

function invalidateComplianceCache(scope: {org?: string | null; brand?: string | null}) {
  const targetOrg = scope.org || 'global'
  const targetBrand = scope.brand || null
  for (const key of Array.from(complianceOverviewCache.keys())) {
    try {
      const parsed = JSON.parse(key)
      if (parsed.org === targetOrg && parsed.brand === targetBrand) {
        complianceOverviewCache.delete(key)
      }
    } catch (_err) {
      complianceOverviewCache.delete(key)
    }
  }
}

function inferExtension(filename?: string) {
  if (!filename) return ''
  const parts = filename.toLowerCase().split('.')
  return parts.length > 1 ? parts.pop() || '' : ''
}

function extractMimeFromDataUrl(data?: string) {
  if (typeof data !== 'string') return null
  const match = data.match(/^data:([^;]+);base64,/)
  return match ? match[1] : null
}

function isAllowedLogoType(filename: string, mime?: string | null) {
  const ext = inferExtension(filename)
  if (ext && ALLOWED_LOGO_EXTENSIONS.has(ext)) return true
  if (mime && ALLOWED_LOGO_MIME.has(mime.toLowerCase())) return true
  return false
}

function validateLogoUpload(buffer: Buffer, filename: string, mime?: string | null) {
  if (!buffer || !buffer.length) return {ok: false, status: 400, error: 'INVALID_FILE'}
  if (!isAllowedLogoType(filename, mime))
    return {ok: false, status: 400, error: 'UNSUPPORTED_FILE_TYPE'}
  if (buffer.length > MAX_LOGO_BYTES) return {ok: false, status: 413, error: 'FILE_TOO_LARGE'}
  return {ok: true as const}
}

// multer may not be installed in all environments (tests/mock). Require lazily.
let upload: any = null
try {
  const m = require('multer')
  upload = m({storage: m.memoryStorage(), limits: {fileSize: MAX_LOGO_BYTES}})
} catch {
  upload = null
}

// preview middleware consistent with content routes
adminRouter.use((req, _res, next) => {
  // Preview gating consistent with content routes; require matching PREVIEW_SECRET.
  const previewSecretEnv = process.env.PREVIEW_SECRET
  const previewSecretConfigured =
    typeof previewSecretEnv === 'string' && previewSecretEnv.length > 0
  if (!previewSecretConfigured) {
    ;(req as any).preview = false
    return next()
  }

  const previewQuery = req.query && req.query.preview === 'true'
  const previewHeader = String(req.header('X-Preview') || '').toLowerCase() === 'true'
  const previewRequested = !!(previewQuery || previewHeader)

  const querySecret = req.query && String((req.query as any).secret || '')
  const headerSecret = String(req.header('X-Preview-Secret') || '')
  const querySecretValid = previewQuery && querySecret === previewSecretEnv
  const headerSecretValid = previewHeader && headerSecret === previewSecretEnv
  const previewGranted = previewRequested && (querySecretValid || headerSecretValid)

  if (previewRequested && !previewGranted) {
    req.log.warn('admin.preview.secret_mismatch', {
      path: req.path,
      origin: req.headers.origin,
      admin: (req as any)?.admin?.email,
    })
  }

  ;(req as any).preview = previewGranted
  next()
})

// GET /products -> returns CMSProduct[]
adminRouter.get('/products', requireRole('EDITOR'), async (req, res) => {
  const preview = (req as any).preview ?? false
  const includeRecalled = String((req.query as any).includeRecalled || '').toLowerCase() === 'true'
  const admin = (req as any).admin
  const {filter, params} = buildScopeFilter(admin)
  const query = `*[_type == "product" ${filter}]{
    _id, name, "slug":slug.current, price, effects, productType->{title},
    "image": image{ "url": image.asset->url, "alt": image.alt },
    isRecalled, recallReason, "brand":brand->slug.current,
    "stores":stores[]->slug.current
  }`
  try {
    const items = await fetchCMS<any[]>(query, params, {preview})
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
    req.log.error('admin.products.fetch_failed', err)
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
    req.log.error('admin.products.recalled_count_failed', err)
    res.status(500).json({error: 'FAILED'})
  }
})

// PATCH /api/admin/products/:id/recall -> toggle recall status (EDITOR)
adminRouter.post('/products/:id/recall', requireRole('EDITOR'), async (req, res) => {
  try {
    const admin = (req as any).admin
    const {id} = z.object({id: z.string().min(1, 'MISSING_ID')}).parse(req.params || {})
    const body = z
      .object({
        isRecalled: z.boolean().optional(),
        recallReason: z.string().trim().max(500, 'recallReason too long').optional().nullable(),
        reason: z.string().trim().max(500).optional().nullable(),
        operatorReason: z.string().trim().max(500).optional().nullable(),
      })
      .parse(req.body || {})
    const {isRecalled, recallReason, reason, operatorReason} = body
    const client = createWriteClient()

    // Read previous state for audit (use fetchCMS so tests can mock it)
    const prev = await fetchCMS<any>(
      '*[_id == $id][0]{isRecalled, recallReason, "brand":brand->slug.current, "stores":stores[]->slug.current}',
      {id},
      {preview: false},
    )
    const brandSlug = prev?.brand || null
    const storeSlugs = Array.isArray(prev?.stores) ? prev.stores.filter(Boolean) : []
    const hasBrandAccess = !brandSlug || canAccessBrand(admin, brandSlug)
    const hasStoreAccess = storeSlugs.some((store: string) =>
      canAccessStore(admin, store, brandSlug),
    )
    if (!hasBrandAccess && !hasStoreAccess) {
      return res.status(403).json({error: 'FORBIDDEN'})
    }
    const previousState = {isRecalled: !!prev?.isRecalled, recallReason: prev?.recallReason || null}

    const patch = client.patch(id)
    if (typeof isRecalled !== 'undefined') patch.set({isRecalled: !!isRecalled})
    if (typeof recallReason !== 'undefined') patch.set({recallReason: recallReason || null})
    await patch.commit({returnDocuments: false})

    // Write an audit record for the recall change
    try {
      const auditAdmin = (req as any).admin || {}
      const currentState = {isRecalled: !!isRecalled, recallReason: recallReason || null}
      await client.create({
        _type: 'recallAudit',
        productId: id,
        changedBy: auditAdmin.email || auditAdmin.name || 'unknown',
        role: auditAdmin.role || 'unknown',
        previous: previousState,
        current: currentState,
        reason: reason || operatorReason || null,
        ts: new Date().toISOString(),
      })
    } catch (auditErr) {
      // Don't fail the main request if audit write fails; log and continue
      req.log.error('admin.products.recall_audit_failed', auditErr)
    }

    res.json({ok: true})
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({error: 'INVALID_RECALL_PAYLOAD', details: err.issues})
    }
    req.log.error('admin.products.recall_toggle_failed', err)
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
    req.log.error('admin.organizations.fetch_failed', err)
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
    req.log.error('admin.personalization.rules_fetch_failed', err)
    res.status(500).json({error: 'FAILED'})
  }
})

// GET/POST /api/admin/theme - read or update theme configs
adminRouter.get('/theme', requireRole('VIEWER'), async (req, res) => {
  try {
    const admin = (req as any).admin
    const {brand, store} = req.query as any
    if (!brand) return res.status(400).json({error: 'MISSING_BRAND'})
    const brandSlug = String(brand)
    const storeSlug = store ? String(store) : null
    if (!ensureBrandScope(res, admin, brandSlug)) return
    if (storeSlug && !ensureStoreScope(res, admin, storeSlug, brandSlug)) return
    const q = `*[_type=="themeConfig" && brand->slug.current==$brand ${store ? '&& store->slug.current==$store' : '&& !defined(store)'}][0]{"brand":brand->slug.current, primaryColor, secondaryColor, backgroundColor, textColor, "logoUrl":logo.asset->url, logoUrl, typography}`
    const item = await fetchCMS(q, {brand: brandSlug, store: storeSlug || undefined})
    if (!item) return res.status(404).json({error: 'NOT_FOUND'})
    res.json(item)
  } catch (err) {
    req.log.error('admin.theme.fetch_failed', err)
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
    const admin = (req as any).admin
    if (!ensureBrandScope(res, admin, schema.brand)) return
    if (schema.store && !ensureStoreScope(res, admin, schema.store, schema.brand)) return
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
    req.log.error('admin.theme.upsert_failed', err)
    res.status(500).json({error: 'FAILED'})
  }
})

// GET /api/admin/theme/configs - list all theme configs grouped by brand/store
adminRouter.get('/theme/configs', requireRole('VIEWER'), async (req, res) => {
  try {
    const admin = (req as any).admin
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

    if (brand && !ensureBrandScope(res, admin, brand)) return
    const brandScopeHint = brand || admin?.brandSlug || null
    if (store && !ensureStoreScope(res, admin, store, brandScopeHint)) return

    // Build where clause
    let where = ''
    const params: any = {}
    if (brand) {
      where += ' && brand->slug.current == $brand'
      params.brand = brand
    } else if (admin?.brandSlug) {
      where += ' && brand->slug.current == $brand'
      params.brand = admin.brandSlug
    }
    if (store) {
      where += ' && store->slug.current == $store'
      params.store = store
    } else if (admin?.storeSlug) {
      where += ' && store->slug.current == $store'
      params.store = admin.storeSlug
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
    req.log.error('admin.theme.configs_fetch_failed', e)
    res.status(500).json({error: 'FAILED'})
  }
})

// POST /api/admin/theme/config - create or update a themeConfig
adminRouter.post('/theme/config', requireRole('EDITOR'), async (req, res) => {
  try {
    const admin = (req as any).admin
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

    if (schema.brand && !ensureBrandScope(res, admin, schema.brand)) return
    if (schema.store && !ensureStoreScope(res, admin, schema.store, schema.brand || null)) return

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
    req.log.error('admin.theme.config_save_failed', e)
    res.status(500).json({error: 'FAILED'})
  }
})

// DELETE /api/admin/theme/config/:id
adminRouter.delete('/theme/config/:id', requireRole('EDITOR'), async (req, res) => {
  try {
    const admin = (req as any).admin
    const {id} = z.object({id: z.string().min(1)}).parse(req.params || {})
    const doc = (await fetchCMS(
      '*[_type=="themeConfig" && _id == $id][0]{"brand":brand->slug.current, "store":store->slug.current}',
      {id},
    )) as any
    if (!doc) return res.status(404).json({error: 'NOT_FOUND'})
    if (!ensureBrandScope(res, admin, doc?.brand || null)) return
    if (!ensureStoreScope(res, admin, doc?.store || null, doc?.brand || null)) return
    const client = createWriteClient()
    // @ts-ignore
    await client.delete(id)
    res.json({ok: true})
  } catch (e) {
    req.log.error('admin.theme.config_delete_failed', e)
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
    req.log.error('admin.theme.preview_failed', e)
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
    req.log.error('admin.brands.fetch_failed', err)
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
    req.log.error('admin.stores.fetch_failed', err)
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
    req.log.error('admin.articles.fetch_failed', err)
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
    req.log.error('admin.faqs.fetch_failed', err)
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
    req.log.error('admin.legal.fetch_failed', err)
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
    req.log.error('admin.analytics.metrics_fetch_failed', err)
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
    const cacheKey = buildAnalyticsCacheKey(admin, req.query)
    const cached = overviewCache.get(cacheKey)
    if (cached && Date.now() - cached.ts < OVERVIEW_CACHE_TTL) {
      // apply pagination to cached top lists if needed
      const out = {...cached.data}
      if (out.topProducts && perPage)
        out.topProducts = out.topProducts.slice(page * perPage, page * perPage + perPage)
      if (out.productSeries && perPage)
        out.productSeries = out.productSeries.slice(page * perPage, page * perPage + perPage)
      res.set('X-Analytics-Overview-Cache', 'HIT')
      return res.json(out)
    }

    const persisted = await readPersistentAnalyticsOverviewCache(cacheKey, OVERVIEW_CACHE_TTL)
    if (persisted) {
      overviewCache.set(cacheKey, {ts: Date.now(), data: persisted})
      res.set('X-Analytics-Overview-Cache', 'PERSISTED')
      return res.json(persisted)
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

    await writePersistentAnalyticsOverviewCache(cacheKey, responsePayload)
    res.set('X-Analytics-Overview-Cache', 'MISS')
    return res.json(responsePayload)
  } catch (err) {
    req.log.error('admin.analytics.overview_failed', err)
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
    const brandParam = typeof req.query.brand === 'string' ? req.query.brand.trim() : ''
    let targetBrand = admin?.brandSlug || null
    if (brandParam) {
      if (!ensureBrandScope(res, admin, brandParam)) return
      targetBrand = brandParam
    }
    const storeParam = typeof req.query.store === 'string' ? req.query.store.trim() : ''
    let storeFilter = storeParam || null
    if (storeFilter) {
      if (!ensureStoreScope(res, admin, storeFilter, targetBrand)) return
    } else if (admin?.storeSlug) {
      storeFilter = admin.storeSlug
    }
    const applyStoreFilter = (rows: any[]) =>
      storeFilter ? (rows || []).filter((row: any) => row.storeSlug === storeFilter) : rows

    // Prefer a pre-computed snapshot for the org (or global fallback)
    try {
      const snapshotId = targetBrand
        ? `complianceSnapshotLatest-brand-${targetBrand}`
        : `complianceSnapshotLatest-${admin?.organizationSlug || 'global'}`
      const snapshot = await fetchCMS('*[_type=="complianceSnapshot" && _id == $id][0]', {
        id: snapshotId,
      })
      if (snapshot && (snapshot as any).results) {
        const results = applyStoreFilter((snapshot as any).results)
        return res.set('X-Compliance-Cache', 'SNAPSHOT').json({
          results,
          snapshotTs: (snapshot as any).ts,
          snapshotId,
        })
      }
    } catch (_e) {
      // fall back to live compute
    }

    const cacheKey = buildComplianceCacheKey(admin, types, targetBrand)
    const cached = complianceOverviewCache.get(cacheKey)
    if (cached && Date.now() - cached.ts < COMPLIANCE_OVERVIEW_CACHE_TTL_MS) {
      res.set('X-Compliance-Cache', 'HIT')
      return res.json(applyStoreFilter(cached.data))
    }

    const rows = await computeCompliance(types, {
      org: admin?.organizationSlug,
      brand: targetBrand,
    })
    complianceOverviewCache.set(cacheKey, {ts: Date.now(), data: rows})
    res.set('X-Compliance-Cache', 'MISS')
    // backward-compatible response: return array for live compute
    return res.json(applyStoreFilter(rows))
  } catch (err) {
    req.log.error('admin.compliance.overview_failed', err)
    res.status(500).json({error: 'FAILED'})
  }
})

// POST /api/admin/compliance/snapshot - trigger manual snapshot for admin's scope
adminRouter.post('/compliance/snapshot', requireRole('ORG_ADMIN'), async (req, res) => {
  try {
    const payload = z
      .object({
        org: z.string().trim().min(1).optional(),
        brand: z.string().trim().min(1).optional(),
        types: z.array(z.enum(['terms', 'privacy', 'accessibility', 'ageGate'])).optional(),
      })
      .parse(req.body || {})
    const admin = (req as any).admin
    // determine target scope with RBAC enforcement
    // only allow org admins to snapshot their own org; OWNER can snapshot global or provide org param
    let targetOrg = admin.organizationSlug
    let targetBrand = admin.brandSlug
    if (admin.role === 'OWNER' && payload.org) {
      targetOrg = payload.org
    }
    if (payload.brand) {
      // only OWNER or BRAND_ADMIN for their brand may specify brand param
      if (admin.role !== 'OWNER' && admin.role !== 'BRAND_ADMIN') {
        return res.status(403).json({error: 'FORBIDDEN'})
      }
      // BRAND_ADMIN may only snapshot their own brand
      if (admin.role === 'BRAND_ADMIN' && payload.brand !== admin.brandSlug) {
        return res.status(403).json({error: 'FORBIDDEN'})
      }
      targetBrand = payload.brand
    }

    // run a one-off compute for the given scope and persist
    const types = payload.types || ['terms', 'privacy', 'accessibility', 'ageGate']
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
    req.log.info('admin.compliance.snapshot_run', {
      runBy,
      scope: targetBrand ? `brand:${targetBrand}` : `org:${targetOrg || 'global'}`,
      ts,
      id: historyId,
    })
    invalidateComplianceCache({org: targetOrg || 'global', brand: targetBrand || null})
    res.json({ok: true, id: historyId, ts, studioUrl})
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({error: 'INVALID_COMPLIANCE_REQUEST', details: err.issues})
    }
    req.log.error('admin.compliance.snapshot_failed', err)
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
    req.log.error('admin.compliance.history_failed', e)
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
    req.log.error('admin.analytics.settings_fetch_failed', err)
    res.status(500).json({error: 'FAILED'})
  }
})

adminRouter.post('/analytics/settings', requireRole('ORG_ADMIN'), async (req, res) => {
  try {
    const admin = (req as any).admin
    const org = admin?.organizationSlug || 'global'
    const parsed = analyticsSettingsSchema.parse(req.body || {})
    const {
      windowDays,
      recentDays,
      wRecentClicks,
      wRecentViews,
      wHistoricClicks,
      wHistoricViews,
      thresholdRising,
      thresholdSteady,
      thresholdFalling,
    } = parsed
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
    if (err instanceof z.ZodError) {
      return res.status(400).json({error: 'INVALID_SETTINGS', details: err.issues})
    }
    req.log.error('admin.analytics.settings_save_failed', err)
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
    req.log.error('admin.legal.current_fetch_failed', err)
    res.status(500).json({error: 'FAILED'})
  }
})

// POST /api/admin/upload-logo - accepts {filename, data} where data is a dataURL or base64 string
adminRouter.post('/upload-logo', requireRole('EDITOR'), async (req, res) => {
  try {
    const {filename, data, brand} = z
      .object({
        filename: z.string().trim().min(1),
        data: z.string().min(1),
        brand: z.string().trim().min(1).optional(),
      })
      .parse(req.body || {})
    const brandResult = resolveScopedBrand(req, brand)
    if (!brandResult.ok) return res.status(brandResult.status).json({error: brandResult.error})
    const scopedBrand = brandResult.brand
    req.log.info('admin.upload_logo', {brand: scopedBrand, admin: (req as any).admin?.email})
    const client = createWriteClient()
    // strip data URL prefix if present
    const mime = extractMimeFromDataUrl(typeof data === 'string' ? data : '')
    const base64 = typeof data === 'string' ? data.replace(/^data:.*;base64,/, '') : ''
    const buffer = Buffer.from(base64, 'base64')
    const validation = validateLogoUpload(buffer, filename, mime)
    if (!validation.ok) return res.status(validation.status).json({error: validation.error})
    // use Sanity assets.upload
    // @ts-ignore
    const uploaded = await client.assets.upload('image', buffer, {filename})
    // uploaded typically contains _id and url
    const url = (uploaded && (uploaded.url || (uploaded.asset && uploaded.asset.url))) || null
    const assetId = uploaded && (uploaded._id || (uploaded.asset && uploaded.asset._id))
    res.json({ok: true, url, assetId, uploaded})
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({error: 'INVALID_FILE_PAYLOAD', details: err.issues})
    }
    req.log.error('admin.theme.logo_upload_failed', err)
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
      const file = z
        .object({
          originalname: z.string().trim().min(1),
          buffer: z.instanceof(Buffer),
          mimetype: z.string().optional(),
        })
        .parse((req as any).file || null)
      const payloadBrand = (() => {
        const bodyBrand = (req as any).body?.brand
        if (typeof bodyBrand === 'string') return bodyBrand
        if (Array.isArray(bodyBrand) && bodyBrand.length) return bodyBrand[0]
        return undefined
      })()
      const brandResult = resolveScopedBrand(req, payloadBrand)
      if (!brandResult.ok) return res.status(brandResult.status).json({error: brandResult.error})
      const scopedBrand = brandResult.brand
      req.log.info('admin.upload_logo_multipart', {
        brand: scopedBrand,
        admin: (req as any).admin?.email,
      })
      const validation = validateLogoUpload(file.buffer, file.originalname || 'logo', file.mimetype)
      if (!validation.ok) return res.status(validation.status).json({error: validation.error})
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
      if (err instanceof z.ZodError) {
        return res.status(400).json({error: 'INVALID_FILE', details: err.issues})
      }
      req.log.error('admin.theme.logo_upload_multipart_failed', err)
      res.status(500).json({error: 'FAILED'})
    }
  },
)

// Lightweight banner data for the admin chrome (welcome, weather, ticker)
adminRouter.get('/banner', (req: any, res) => {
  const admin = req.admin || {}
  const fetchFn: any = (globalThis as any).fetch
  const weatherApiKey = process.env.OPENWEATHER_API_KEY || process.env.WEATHER_API_KEY
  const weatherCity = process.env.OPENWEATHER_CITY || 'Detroit,US'
  const weatherUnits = process.env.OPENWEATHER_UNITS || 'imperial'
  const weatherApiUrl =
    process.env.OPENWEATHER_API_URL ||
    `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(weatherCity)}&units=${encodeURIComponent(weatherUnits)}`
  const fallback = {
    adminName: admin.email || 'Nimbus Admin',
    weather: {tempF: 72, condition: 'Partly Cloudy', icon: '⛅️', mood: 'cloudy'},
    ticker: [
      {label: 'Active users', value: '1,204', delta: 12, direction: 'up'},
      {label: 'Conversion', value: '4.8%', delta: -3, direction: 'down'},
      {label: 'Top store', value: 'Detroit – 8 Mile', delta: 19, direction: 'up'},
    ],
    serverTime: new Date().toISOString(),
  }

  if (!weatherApiUrl || !weatherApiKey || !fetchFn) {
    return res.json(fallback)
  }

  function normalizeCondition(condition: string) {
    const text = (condition || '').toLowerCase()
    if (text.includes('rain')) return 'rain'
    if (text.includes('cloud')) return 'cloudy'
    if (text.includes('storm')) return 'storm'
    if (text.includes('snow')) return 'snow'
    return 'sunny'
  }

  ;(async () => {
    try {
      const url = `${weatherApiUrl}${weatherApiUrl.includes('?') ? '&' : '?'}appid=${encodeURIComponent(weatherApiKey)}`
      const response = await fetchFn(url)
      if (!response?.ok) return res.json(fallback)
      const json = await response.json()
      const tempF = Math.round(json?.main?.temp ?? 72)
      const condition = json?.weather?.[0]?.main || 'Clear'
      const mood = normalizeCondition(condition)
      const icon = mood === 'sunny' ? '☀️' : mood === 'rain' ? '🌧️' : mood === 'storm' ? '⛈️' : mood === 'snow' ? '❄️' : '⛅️'
      res.json({
        adminName: admin.email || 'Nimbus Admin',
        weather: {tempF, condition, icon, mood},
        ticker: fallback.ticker,
        serverTime: new Date().toISOString(),
      })
    } catch (err) {
      req.log.warn('banner.weather_fallback', err)
      res.json(fallback)
    }
  })()
})

// Dashboard layout preferences per admin
const layoutSchema = z.object({
  order: z.array(z.string()),
  hidden: z.array(z.string()),
  favorites: z.array(z.string()),
})

adminRouter.get('/preferences/dashboard', (req: any, res) => {
  const admin = req.admin || null
  const layout = getDashboardLayout(admin?.id)
  const defaults = getDefaults().defaultLayout
  res.json({layout, defaults})
})

adminRouter.post('/preferences/dashboard', (req: any, res) => {
  const admin = req.admin || null
  const parsed = layoutSchema.safeParse(req.body || {})
  if (!parsed.success) return res.status(400).json({error: 'INVALID_LAYOUT', details: parsed.error.issues})
  saveDashboardLayout(admin?.id, parsed.data)
  res.json({ok: true, layout: parsed.data})
})

// Notification preferences per admin
const notificationSchema = z.object({
  channels: z.object({sms: z.boolean(), email: z.boolean(), inApp: z.boolean()}),
  frequency: z.enum(['realtime', 'hourly', 'daily', 'weekly']),
  triggers: z.array(z.string()),
})

adminRouter.get('/preferences/notifications', (req: any, res) => {
  const admin = req.admin || null
  const prefs = getNotificationPreferences(admin?.id)
  const defaults = getDefaults().defaultNotifications
  res.json({preferences: prefs, defaults})
})

adminRouter.post('/preferences/notifications', (req: any, res) => {
  const admin = req.admin || null
  const parsed = notificationSchema.safeParse(req.body || {})
  if (!parsed.success)
    return res.status(400).json({error: 'INVALID_NOTIFICATION_PREFS', details: parsed.error.issues})
  saveNotificationPreferences(admin?.id, parsed.data)
  res.json({ok: true, preferences: parsed.data})
})

export default adminRouter
