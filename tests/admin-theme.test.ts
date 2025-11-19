import {describe, it, expect, beforeEach, vi} from 'vitest'
import jwt from 'jsonwebtoken'
import request from 'supertest'

const createOrReplaceMock = vi.fn()
const fetchMock = vi.fn()

vi.mock('../server/src/lib/cms', () => ({
  createWriteClient: vi.fn(() => ({fetch: fetchMock, createOrReplace: createOrReplaceMock})),
  fetchCMS: vi.fn(),
}))

import app from '../server/src'

beforeEach(() => {
  fetchMock.mockReset()
  createOrReplaceMock.mockReset()
})

describe('POST /api/admin/theme', () => {
  it('creates/updates theme for brand', async () => {
    // brand id resolution
    fetchMock.mockResolvedValueOnce('brand-123')
    // createOrReplace returns created doc
    createOrReplaceMock.mockResolvedValueOnce({
      _id: 'themeConfig-jars',
      _type: 'themeConfig',
      brand: {_ref: 'brand-123'},
      primaryColor: '#ffffff',
    })

    const token = jwt.sign(
      {id: 'u1', email: 'a@b.com', role: 'EDITOR'},
      process.env.JWT_SECRET || 'dev-secret',
    )
    const res = await request(app)
      .post('/api/admin/theme')
      .set('Cookie', `admin_token=${token}`)
      .send({brand: 'jars', primaryColor: '#ffffff'})

    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('ok', true)
    expect(createOrReplaceMock).toHaveBeenCalled()
    const docArg = createOrReplaceMock.mock.calls[0][0]
    expect(docArg._id).toBe('themeConfig-jars')
    expect(docArg.primaryColor).toBe('#ffffff')
  })

  it('saves logo asset reference with alt text when provided', async () => {
    const assetId = 'asset-123'
    // mock brand id resolution
    // use the top-level mocks provided to vi.mock above
    fetchMock.mockResolvedValueOnce('brand-123')
    createOrReplaceMock.mockResolvedValueOnce({_id: 'themeConfig-jars', _type: 'themeConfig'})

    const token = jwt.sign(
      {id: 'u1', email: 'a@b.com', role: 'EDITOR'},
      process.env.JWT_SECRET || 'dev-secret',
    )
    const res = await request(app)
      .post('/api/admin/theme')
      .set('Cookie', `admin_token=${token}`)
      .send({brand: 'jars', logoAssetId: assetId, logoAlt: 'Company logo'})

    expect(res.status).toBe(200)
    const docArg = createOrReplaceMock.mock.calls[0][0]
    expect(docArg.logo).toBeTruthy()
    expect(docArg.logo.asset._ref).toBe(assetId)
    expect(docArg.logo.alt).toBe('Company logo')
  })
  it('creates/updates theme for brand+store override', async () => {
    // brand id resolution then store id
    fetchMock.mockResolvedValueOnce('brand-123')
    fetchMock.mockResolvedValueOnce('store-456')
    createOrReplaceMock.mockResolvedValueOnce({
      _id: 'themeConfig-jars-store-downtown',
      _type: 'themeConfig',
      brand: {_ref: 'brand-123'},
      store: {_ref: 'store-456'},
    })

    const token = jwt.sign(
      {id: 'u1', email: 'a@b.com', role: 'EDITOR'},
      process.env.JWT_SECRET || 'dev-secret',
    )
    const res = await request(app)
      .post('/api/admin/theme')
      .set('Cookie', `admin_token=${token}`)
      .send({brand: 'jars', store: 'downtown', primaryColor: '#abcdef'})

    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('ok', true)
    expect(createOrReplaceMock).toHaveBeenCalled()
    const docArg = createOrReplaceMock.mock.calls[createOrReplaceMock.mock.calls.length - 1][0]
    expect(docArg._id).toBe('themeConfig-jars-store-downtown')
    expect(docArg.store).toBeTruthy()
  })
})
