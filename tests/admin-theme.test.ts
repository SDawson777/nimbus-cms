import {describe, it, expect, beforeEach, vi} from 'vitest'
import jwt from 'jsonwebtoken'
import request from 'supertest'
import {withAdminCookies} from './helpers'

const cmsMocks = vi.hoisted(() => ({
  fetchCMSMock: vi.fn(),
  createWriteClientMock: vi.fn(),
  writeClientFetchMock: vi.fn(),
  createOrReplaceMock: vi.fn(),
  deleteMock: vi.fn(),
}))

vi.mock('../server/src/lib/cms', () => {
  cmsMocks.createWriteClientMock.mockImplementation(() => ({
    fetch: cmsMocks.writeClientFetchMock,
    createOrReplace: cmsMocks.createOrReplaceMock,
    delete: cmsMocks.deleteMock,
  }))
  return {
    fetchCMS: cmsMocks.fetchCMSMock,
    createWriteClient: cmsMocks.createWriteClientMock,
  }
})

const {
  fetchCMSMock,
  createWriteClientMock,
  writeClientFetchMock,
  createOrReplaceMock,
  deleteMock,
} = cmsMocks

import app from '../server/src'

function appRequest() {
  return request(app) as any
}

beforeEach(() => {
  fetchCMSMock.mockReset()
  writeClientFetchMock.mockReset()
  createOrReplaceMock.mockReset()
  deleteMock.mockReset()
  createWriteClientMock.mockClear()
  process.env.JWT_SECRET = 'dev-secret'
})

describe('GET /api/admin/theme RBAC', () => {
  it('rejects requests targeting other brands', async () => {
    const token = jwt.sign(
      {id: 'viewer-1', email: 'viewer@example.com', role: 'VIEWER', brandSlug: 'alpha'},
      process.env.JWT_SECRET!,
    )
    const authed = withAdminCookies(appRequest(), token)
    const res = await authed.get('/api/admin/theme').query({brand: 'beta'})
    expect(res.status).toBe(403)
    expect(fetchCMSMock).not.toHaveBeenCalled()
  })

  it('rejects store overrides outside a store manager scope', async () => {
    const token = jwt.sign(
      {
        id: 'store-1',
        email: 'manager@example.com',
        role: 'STORE_MANAGER',
        brandSlug: 'jars',
        storeSlug: 'store-a',
      },
      process.env.JWT_SECRET!,
    )
    const authed = withAdminCookies(appRequest(), token)
    const res = await authed.get('/api/admin/theme').query({brand: 'jars', store: 'store-b'})
    expect(res.status).toBe(403)
  })

  it('allows matching brand viewers to read theme configs', async () => {
    fetchCMSMock.mockResolvedValueOnce({brand: 'jars', primaryColor: '#fff'})
    const token = jwt.sign(
      {id: 'viewer-2', email: 'viewer@example.com', role: 'VIEWER', brandSlug: 'jars'},
      process.env.JWT_SECRET!,
    )
    const authed = withAdminCookies(appRequest(), token)
    const res = await authed.get('/api/admin/theme').query({brand: 'jars'})
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('brand', 'jars')
  })
})

describe('POST /api/admin/theme', () => {
  it('creates/updates theme for brand', async () => {
    writeClientFetchMock.mockResolvedValueOnce('brand-123')
    createOrReplaceMock.mockResolvedValueOnce({
      _id: 'themeConfig-jars',
      _type: 'themeConfig',
      brand: {_ref: 'brand-123'},
      primaryColor: '#ffffff',
    })

    const token = jwt.sign(
      {id: 'u1', email: 'a@b.com', role: 'EDITOR', brandSlug: 'jars'},
      process.env.JWT_SECRET!,
    )
    const authed = withAdminCookies(appRequest(), token)
    const res = await authed.post('/api/admin/theme').send({
      brand: 'jars',
      primaryColor: '#ffffff',
    })

    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('ok', true)
    const docArg = createOrReplaceMock.mock.calls[0][0]
    expect(docArg._id).toBe('themeConfig-jars')
    expect(docArg.primaryColor).toBe('#ffffff')
  })

  it('saves logo asset reference with alt text when provided', async () => {
    const assetId = 'asset-123'
    writeClientFetchMock.mockResolvedValueOnce('brand-123')
    createOrReplaceMock.mockResolvedValueOnce({_id: 'themeConfig-jars', _type: 'themeConfig'})

    const token = jwt.sign(
      {id: 'u1', email: 'a@b.com', role: 'EDITOR', brandSlug: 'jars'},
      process.env.JWT_SECRET!,
    )
    const authed = withAdminCookies(appRequest(), token)
    const res = await authed.post('/api/admin/theme').send({
      brand: 'jars',
      logoAssetId: assetId,
      logoAlt: 'Company logo',
    })

    expect(res.status).toBe(200)
    const docArg = createOrReplaceMock.mock.calls[0][0]
    expect(docArg.logo.asset._ref).toBe(assetId)
    expect(docArg.logo.alt).toBe('Company logo')
  })

  it('creates/updates theme for brand+store override', async () => {
    writeClientFetchMock.mockResolvedValueOnce('brand-123')
    writeClientFetchMock.mockResolvedValueOnce('store-456')
    createOrReplaceMock.mockResolvedValueOnce({
      _id: 'themeConfig-jars-store-downtown',
      _type: 'themeConfig',
      brand: {_ref: 'brand-123'},
      store: {_ref: 'store-456'},
    })

    const token = jwt.sign(
      {id: 'u1', email: 'a@b.com', role: 'EDITOR', brandSlug: 'jars'},
      process.env.JWT_SECRET!,
    )
    const authed = withAdminCookies(appRequest(), token)
    const res = await authed.post('/api/admin/theme').send({
      brand: 'jars',
      store: 'downtown',
      primaryColor: '#abcdef',
    })

    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('ok', true)
    const docArg = createOrReplaceMock.mock.calls.at(-1)![0]
    expect(docArg._id).toBe('themeConfig-jars-store-downtown')
    expect(docArg.store).toBeTruthy()
  })
})
