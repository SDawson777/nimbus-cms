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
    commitMock.mockResolvedValueOnce({
      _id: id,
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
