import {describe, it, expect, beforeEach, vi} from 'vitest'
import request from 'supertest'
import jwt from 'jsonwebtoken'

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
vi.mock('../server/src/lib/cms', () => {
  fetchCMSMock = vi.fn()
  return {fetchCMS: fetchCMSMock}
})

import app from '../server/src'

beforeEach(() => {
  createClientMock.mockClear()
  createIfNotExistsMock.mockReset()
  commitMock.mockReset()
  fetchCMSMock.mockReset()
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

    const res = await request(app)
      .post('/analytics/event')
      .send({type: 'view', contentType: 'article', contentSlug: 'test-article'})
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('ok', true)
    expect(res.body).toHaveProperty('metric')
    expect(res.body.metric).toHaveProperty('views', 1)
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
    const res = await request(app)
      .get('/api/admin/analytics/content-metrics')
      .set('Cookie', `admin_token=${token}`)
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

    // fetchCMS is called 4 times + storeRows call = 5 sequential calls in our implementation
    fetchCMSMock.mockResolvedValueOnce(topArticles)
    fetchCMSMock.mockResolvedValueOnce(topFaqs)
    fetchCMSMock.mockResolvedValueOnce(topProducts)
    fetchCMSMock.mockResolvedValueOnce(productsForDemand)
    fetchCMSMock.mockResolvedValueOnce(storeRows)

    const token = jwt.sign(
      {id: 't', email: 'admin', role: 'ORG_ADMIN'},
      process.env.JWT_SECRET || 'dev-secret',
    )
    const res = await request(app)
      .get('/api/admin/analytics/overview')
      .set('Cookie', `admin_token=${token}`)
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('topArticles')
    expect(res.body).toHaveProperty('topFaqs')
    expect(res.body).toHaveProperty('topProducts')
    expect(res.body).toHaveProperty('storeEngagement')
    expect(res.body).toHaveProperty('productDemand')
    // productDemand should include p1 and p2 with statuses
    const pd = res.body.productDemand
    expect(pd.find((d: any) => d.slug === 'p1')).toBeTruthy()
    expect(pd.find((d: any) => d.slug === 'p2')).toBeTruthy()
  })
})
