import {describe, it, expect, beforeEach, vi} from 'vitest'
import request from 'supertest'
import {withAdminCookies} from './helpers'

var fetchCMSMock: any
var createWriteClientMock: any
vi.mock('../server/src/lib/cms', () => {
  fetchCMSMock = vi.fn()
  createWriteClientMock = vi.fn(() => ({
    patch: (id: string) => ({set: () => ({commit: async () => ({ok: true})})}),
  }))
  return {fetchCMS: fetchCMSMock, createWriteClient: createWriteClientMock}
})

import app from '../server/src'

function appRequest() {
  return request(app) as any
}

beforeEach(() => {
  fetchCMSMock.mockReset()
  createWriteClientMock.mockReset()
  process.env.JWT_SECRET = 'dev-secret'
  // ensure patch() returns a chainable object with set() and commit()
  createWriteClientMock.mockImplementation(() => ({
    patch: (_id: string) => {
      const p: any = {
        set: (_obj: any) => p,
        commit: async () => ({ok: true}),
      }
      return p
    },
  }))
})

describe('product recall admin', () => {
  it('admin products excludes recalled by default', async () => {
    const items = [
      {_id: 'p1', name: 'Good', isRecalled: false},
      {_id: 'p2', name: 'Bad', isRecalled: true, recallReason: 'contamination'},
    ]
    fetchCMSMock.mockResolvedValueOnce(items)
    // craft an admin JWT to satisfy requireAdmin
    const jwt = require('jsonwebtoken')
    const token = jwt.sign(
      {id: 't', email: 'a@b', role: 'EDITOR', brandSlug: 'alpha'},
      process.env.JWT_SECRET || 'dev-secret',
    )
    const res = await appRequest().get('/api/admin/products').set('Cookie', `admin_token=${token}`)
    expect(res.status).toBe(200)
    expect(res.body.some((p: any) => p.isRecalled)).toBe(false)
  })

  it('includeRecalled=true returns recalled items', async () => {
    const items = [
      {_id: 'p1', name: 'Good', isRecalled: false},
      {_id: 'p2', name: 'Bad', isRecalled: true, recallReason: 'contamination'},
    ]
    fetchCMSMock.mockResolvedValueOnce(items)
    const jwt = require('jsonwebtoken')
    const token = jwt.sign(
      {id: 't', email: 'a@b', role: 'EDITOR', brandSlug: 'alpha'},
      process.env.JWT_SECRET || 'dev-secret',
    )
    const res = await appRequest()
      .get('/api/admin/products')
      .query({includeRecalled: 'true'})
      .set('Cookie', `admin_token=${token}`)
    expect(res.status).toBe(200)
    expect(res.body.some((p: any) => p.isRecalled)).toBe(true)
  })

  it('toggle recall via POST endpoint', async () => {
    // patch commit mocked in createWriteClientMock
    const jwt = require('jsonwebtoken')
    const token = jwt.sign(
      {id: 't', email: 'a@b', role: 'EDITOR', brandSlug: 'alpha'},
      process.env.JWT_SECRET || 'dev-secret',
    )
    const authed = withAdminCookies(appRequest(), token)
    const res = await authed.post('/api/admin/products/p2/recall').send({isRecalled: false})
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ok: true})
  })

  it('scopes product queries by brand slug', async () => {
    fetchCMSMock.mockResolvedValueOnce([])
    const jwt = require('jsonwebtoken')
    const token = jwt.sign(
      {id: 'scoped', email: 'viewer@brand.com', role: 'EDITOR', brandSlug: 'jars'},
      process.env.JWT_SECRET || 'dev-secret',
    )
    await appRequest().get('/api/admin/products').set('Cookie', `admin_token=${token}`)
    const [groq, params] = fetchCMSMock.mock.calls[0]
    expect(groq).toContain('references(*[_type=="brand" && slug.current==$brand]._id)')
    expect(params).toMatchObject({brand: 'jars'})
  })

  it('rejects recall when product brand is outside scope', async () => {
    const jwt = require('jsonwebtoken')
    const token = jwt.sign(
      {id: 'brand-a', email: 'editor@a.com', role: 'EDITOR', brandSlug: 'alpha'},
      process.env.JWT_SECRET || 'dev-secret',
    )
    fetchCMSMock.mockResolvedValueOnce({brand: 'beta', stores: []})
    const authed = withAdminCookies(appRequest(), token)
    const res = await authed.post('/api/admin/products/p2/recall').send({isRecalled: true})
    expect(res.status).toBe(403)
  })

  it('allows store managers to recall products stocked in their store', async () => {
    const jwt = require('jsonwebtoken')
    const token = jwt.sign(
      {
        id: 'store-1',
        email: 'store@example.com',
        role: 'STORE_MANAGER',
        storeSlug: 'store-a',
        brandSlug: 'alpha',
      },
      process.env.JWT_SECRET || 'dev-secret',
    )
    fetchCMSMock.mockResolvedValueOnce({brand: 'beta', stores: ['store-a']})
    const authed = withAdminCookies(appRequest(), token)
    const res = await authed.post('/api/admin/products/p3/recall').send({isRecalled: true})
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ok: true})
  })
})
