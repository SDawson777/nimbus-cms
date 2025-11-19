import {describe, it, expect, beforeEach, vi} from 'vitest'
import request from 'supertest'
import jwt from 'jsonwebtoken'

var fetchCMSMock: any
vi.mock('../server/src/lib/cms', () => {
  fetchCMSMock = vi.fn()
  return {fetchCMS: fetchCMSMock}
})

import app from '../server/src'

beforeEach(() => {
  fetchCMSMock.mockReset()
  process.env.JWT_SECRET = 'dev-secret'
})

describe('GET /api/admin/compliance/overview', () => {
  it('returns per-store compliance for admin', async () => {
    const stores = [
      {_id: 's1', slug: 'store-a', stateCode: 'MI'},
      {_id: 's2', slug: 'store-b', stateCode: 'AZ'},
    ]
    const legalDocs = [
      {
        _id: 'l1',
        type: 'terms',
        stateCode: 'MI',
        version: '1',
        effectiveFrom: new Date().toISOString(),
      },
      {
        _id: 'l2',
        type: 'privacy',
        stateCode: null,
        version: '2',
        effectiveFrom: new Date().toISOString(),
      },
    ]
    // endpoint prefers snapshot fetch first; return null snapshot then provide stores and legalDocs
    fetchCMSMock.mockResolvedValueOnce(null) // snapshot not found
    fetchCMSMock.mockResolvedValueOnce(stores)
    fetchCMSMock.mockResolvedValueOnce(legalDocs)

    const token = jwt.sign({id: 't', email: 'a', role: 'ORG_ADMIN'}, process.env.JWT_SECRET)
    const res = await request(app)
      .get('/api/admin/compliance/overview')
      .set('Cookie', `admin_token=${token}`)
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body.length).toBe(2)
    const a = res.body.find((r: any) => r.storeSlug === 'store-a')
    expect(a).toHaveProperty('complianceScore')
    expect(a).toHaveProperty('missingTypes')
  })
})
