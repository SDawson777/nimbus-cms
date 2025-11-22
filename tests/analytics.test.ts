import {describe, it, expect, beforeEach, vi} from 'vitest'
import supertest from 'supertest'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import {withAdminCookies} from './helpers'

// mocks for sanity client used by POST /analytics/event
var createClientMock: any
var createIfNotExistsMock: any
var commitMock: any
vi.mock('@sanity/client', () => {
  createIfNotExistsMock = vi.fn()
  commitMock = vi.fn()
  createClientMock = vi.fn(() => ({
    createIfNotExists: createIfNotExistsMock,
    patch: (_id: string) => {
      // build a reusable patch object that supports chaining .set().inc().commit()
      const patchObj: any = {}
      patchObj.set = (_obj: any) => patchObj
      patchObj.inc = (_incObj: any) => patchObj
      patchObj.commit = commitMock
      return patchObj
    },
  }))
  return {createClient: createClientMock}
})

// mocks for fetchCMS used by admin endpoint
var fetchCMSMock: any
var createWriteClientMock: any
var createOrReplaceMock: any
vi.mock('../server/src/lib/cms', () => {
  fetchCMSMock = vi.fn()
  createOrReplaceMock = vi.fn()
  createWriteClientMock = vi.fn(() => ({
    createOrReplace: createOrReplaceMock,
  }))
  return {
    fetchCMS: fetchCMSMock,
    createWriteClient: createWriteClientMock,
  }
})

import app from '../server/src'

const ANALYTICS_KEY = process.env.ANALYTICS_INGEST_KEY || 'test-analytics-key'

function appRequest() {
  return supertest(app) as any
}

function signedAnalyticsRequest(body: Record<string, any>) {
  const payload = JSON.stringify(body)
  const signature = crypto.createHmac('sha256', ANALYTICS_KEY).update(payload).digest('hex')
  return appRequest()
    .post('/analytics/event')
    .set('Content-Type', 'application/json')
    .set('X-Analytics-Key', ANALYTICS_KEY)
    .set('X-Analytics-Signature', signature)
    .send(payload)
}

beforeEach(() => {
  createClientMock.mockClear()
  createIfNotExistsMock.mockReset()
  commitMock.mockReset()
  fetchCMSMock.mockReset()
  createWriteClientMock?.mockClear()
  createOrReplaceMock?.mockReset()
  process.env.JWT_SECRET = 'dev-secret'
})

describe('POST /analytics/event', () => {
  it('increments view counter and returns updated metric', async () => {
    const now = new Date().toISOString()
    const id = 'contentMetric-article-test-article'
    createIfNotExistsMock.mockResolvedValueOnce({_id: id})
    // aggregate metric createIfNotExists + daily createIfNotExists
    createIfNotExistsMock.mockResolvedValueOnce({_id: id})
    const dailyId = 'contentMetricDaily-article-test-article'
    createIfNotExistsMock.mockResolvedValueOnce({_id: dailyId})
    // two commits: aggregate patch.commit and daily patch.commit
    commitMock.mockResolvedValueOnce({
      _id: id,
      contentType: 'article',
      contentSlug: 'test-article',
      views: 1,
      clickThroughs: 0,
      lastUpdated: now,
    })
    commitMock.mockResolvedValueOnce({
      _id: dailyId,
      contentType: 'article',
      contentSlug: 'test-article',
      views: 1,
      clickThroughs: 0,
      lastUpdated: now,
    })

    const res = await signedAnalyticsRequest({
      type: 'view',
      contentType: 'article',
      contentSlug: 'test-article',
    })
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('ok', true)
    expect(res.body).toHaveProperty('metric')
    expect(res.body.metric).toHaveProperty('views', 1)
  })

  it('rejects requests with invalid signatures', async () => {
    const payload = {type: 'view', contentType: 'article', contentSlug: 'unsigned'}
    const res = await appRequest()
      .post('/analytics/event')
      .set('Content-Type', 'application/json')
      .set('X-Analytics-Key', ANALYTICS_KEY)
      .set('X-Analytics-Signature', 'not-valid')
      .send(JSON.stringify(payload))
    expect(res.status).toBe(401)
    expect(res.body).toHaveProperty('error', 'INVALID_ANALYTICS_SIGNATURE')
  })
})

describe('GET /api/admin/analytics/content-metrics', () => {
  it('returns metrics list for admin', async () => {
    const now = new Date().toISOString()
    const metrics = [
      {
        _id: 'm1',
        contentType: 'article',
        contentSlug: 'a',
        views: 10,
        clickThroughs: 2,
        lastUpdated: now,
      },
    ]
    fetchCMSMock.mockResolvedValueOnce(metrics)

    const token = jwt.sign(
      {id: 't', email: 'admin', role: 'VIEWER'},
      process.env.JWT_SECRET || 'dev-secret',
    )
    const res = await withAdminCookies(appRequest().get('/api/admin/analytics/content-metrics'), token)
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body[0]).toHaveProperty('contentSlug')
    expect(res.body[0]).toHaveProperty('views')
  })
})

describe('GET /api/admin/analytics/overview', () => {
  it('returns aggregated overview for org admin', async () => {
    const now = new Date().toISOString()
    const topArticles = [{contentSlug: 'a1', views: 50, clickThroughs: 5, lastUpdated: now}]
    const topFaqs = [{contentSlug: 'f1', views: 20, clickThroughs: 1, lastUpdated: now}]
    const topProducts = [{contentSlug: 'p1', views: 10, clickThroughs: 8, lastUpdated: now}]
    const productsForDemand = [
      {contentSlug: 'p1', views: 10, clickThroughs: 8, lastUpdated: now},
      {contentSlug: 'p2', views: 1, clickThroughs: 0, lastUpdated: now},
    ]
    const storeRows = [{storeSlug: 's1', views: 100, clickThroughs: 10}]

    // fetchCMS calls: persisted cache check, settings, and five data queries
    fetchCMSMock.mockResolvedValueOnce(null)
    fetchCMSMock.mockResolvedValueOnce(null)
    fetchCMSMock.mockResolvedValueOnce(topArticles)
    fetchCMSMock.mockResolvedValueOnce(topFaqs)
    fetchCMSMock.mockResolvedValueOnce(topProducts)
    fetchCMSMock.mockResolvedValueOnce(productsForDemand)
    fetchCMSMock.mockResolvedValueOnce(storeRows)

    const token = jwt.sign(
      {id: 't', email: 'admin', role: 'ORG_ADMIN'},
      process.env.JWT_SECRET || 'dev-secret',
    )
    const res = await withAdminCookies(appRequest().get('/api/admin/analytics/overview'), token)
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('topArticles')
    expect(res.body).toHaveProperty('topFaqs')
    expect(res.body).toHaveProperty('topProducts')
    expect(res.body).toHaveProperty('storeEngagement')
    expect(res.body).toHaveProperty('productDemand')
    expect(res.headers['x-analytics-overview-cache']).toBe('MISS')
    // productDemand should include p1 and p2 with statuses
    const pd = res.body.productDemand
    expect(pd.find((d: any) => d.slug === 'p1')).toBeTruthy()
    expect(pd.find((d: any) => d.slug === 'p2')).toBeTruthy()
  })

  it('falls back to persisted overview payload when live aggregation is unavailable', async () => {
    const persistedPayload = {
      topArticles: [{contentSlug: 'persisted-article', views: 5, clickThroughs: 1}],
      topFaqs: [],
      topProducts: [],
      storeEngagement: [],
      productDemand: [],
      productSeries: [],
    }
    fetchCMSMock.mockResolvedValueOnce({
      payload: JSON.stringify(persistedPayload),
      ts: new Date().toISOString(),
    })

    const token = jwt.sign(
      {id: 't', email: 'admin', role: 'ORG_ADMIN'},
      process.env.JWT_SECRET || 'dev-secret',
    )
    const res = await withAdminCookies(
      appRequest().get('/api/admin/analytics/overview').query({cacheBust: 'persisted'}),
      token,
    )
    expect(res.status).toBe(200)
    expect(res.headers['x-analytics-overview-cache']).toBe('PERSISTED')
    expect(res.body.topArticles[0].contentSlug).toBe('persisted-article')
    expect(fetchCMSMock).toHaveBeenCalledTimes(1)
  })
})

describe('Analytics summary endpoints', () => {
  it('returns metadata from persisted cache on GET /summary', async () => {
    const payload = {
      topArticles: [],
      topFaqs: [],
      topProducts: [],
      storeEngagement: [],
      productDemand: [],
      productSeries: [],
    }
    fetchCMSMock.mockResolvedValueOnce({payload: JSON.stringify(payload), ts: new Date().toISOString()})

    const token = jwt.sign(
      {id: 'viewer', email: 'viewer@example.com', role: 'VIEWER'},
      process.env.JWT_SECRET || 'dev-secret',
    )
    const res = await withAdminCookies(
      appRequest().get('/api/admin/analytics/summary').query({segment: 'summaryTest'}),
      token,
    )
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('lastRefreshedAt')
    expect(res.body).toHaveProperty('source', 'PERSISTED')
    expect(res.body).toHaveProperty('ttlMs')
  })

  it('forces a fresh aggregation on POST /summary', async () => {
    const now = new Date().toISOString()
    const topArticles = [{contentSlug: 'a1', views: 10, clickThroughs: 2, lastUpdated: now}]
  const topFaqs: any[] = []
    const topProducts = [{contentSlug: 'p1', views: 5, clickThroughs: 3, lastUpdated: now}]
    const productsForDemand = [{contentSlug: 'p1', views: 5, clickThroughs: 3, date: now}]
    const storeRows = [{storeSlug: 's1', views: 5, clickThroughs: 1}]

    // forceRefresh skips persisted cache, so order is: settings + 5 data queries
    fetchCMSMock.mockResolvedValueOnce(null)
    fetchCMSMock.mockResolvedValueOnce(topArticles)
    fetchCMSMock.mockResolvedValueOnce(topFaqs)
    fetchCMSMock.mockResolvedValueOnce(topProducts)
    fetchCMSMock.mockResolvedValueOnce(productsForDemand)
    fetchCMSMock.mockResolvedValueOnce(storeRows)

    const token = jwt.sign(
      {id: 'org', email: 'org-admin@example.com', role: 'ORG_ADMIN'},
      process.env.JWT_SECRET || 'dev-secret',
    )
    const res = await withAdminCookies(appRequest().post('/api/admin/analytics/summary'), token)
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('ok', true)
    expect(res.body).toHaveProperty('lastRefreshedAt')
    expect(res.body.preview.topArticles.length).toBe(1)
    expect(res.body.preview.topProducts.length).toBe(1)
  })
})
