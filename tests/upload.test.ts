import {describe, it, expect, beforeEach, vi} from 'vitest'
import jwt from 'jsonwebtoken'
import request from 'supertest'
import {withAdminCookies} from './helpers'

const uploadMock = vi.fn()

vi.mock('../server/src/lib/cms', () => ({
  createWriteClient: vi.fn(() => ({assets: {upload: uploadMock}})),
  fetchCMS: vi.fn(),
}))

import app from '../server/src'

function appRequest() {
  return request(app) as any
}

beforeEach(() => {
  uploadMock.mockReset()
})

describe('POST /api/admin/upload-logo', () => {
  it('uploads base64 image and returns asset id and url', async () => {
    uploadMock.mockResolvedValueOnce({_id: 'asset-xyz', url: '/uploads/asset-xyz.png'})
    const token = jwt.sign(
      {id: 'u1', email: 'a@b.com', role: 'EDITOR', brandSlug: 'jars'},
      process.env.JWT_SECRET || 'dev-secret',
    )
    const res = await withAdminCookies(
      appRequest().post('/api/admin/upload-logo'),
      token,
    ).send({filename: 'logo.png', data: 'data:image/png;base64,AAAA', brand: 'jars'})

    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('assetId', 'asset-xyz')
    expect(res.body).toHaveProperty('url', '/uploads/asset-xyz.png')
  })

  it('rejects unsupported file types', async () => {
    const token = jwt.sign(
      {id: 'u1', email: 'a@b.com', role: 'EDITOR', brandSlug: 'jars'},
      process.env.JWT_SECRET || 'dev-secret',
    )
    const res = await withAdminCookies(
      appRequest().post('/api/admin/upload-logo'),
      token,
    ).send({
      filename: 'logo.exe',
      data: 'data:application/octet-stream;base64,AAAA',
      brand: 'jars',
    })

    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error', 'UNSUPPORTED_FILE_TYPE')
  })

  it('rejects files larger than limit', async () => {
    const token = jwt.sign(
      {id: 'u1', email: 'a@b.com', role: 'EDITOR', brandSlug: 'jars'},
      process.env.JWT_SECRET || 'dev-secret',
    )
    const oversized = Buffer.alloc(2 * 1024 * 1024 + 10)
    const payload = `data:image/png;base64,${oversized.toString('base64')}`
    const res = await withAdminCookies(
      appRequest().post('/api/admin/upload-logo'),
      token,
    ).send({filename: 'logo.png', data: payload, brand: 'jars'})

    expect(res.status).toBe(413)
    expect(res.body).toHaveProperty('error', 'FILE_TOO_LARGE')
  })

  it('rejects uploads without brand for scoped admins', async () => {
    const token = jwt.sign(
      {id: 'u2', email: 'b@c.com', role: 'EDITOR'},
      process.env.JWT_SECRET || 'dev-secret',
    )
    const res = await withAdminCookies(
      appRequest().post('/api/admin/upload-logo'),
      token,
    ).send({filename: 'logo.png', data: 'data:image/png;base64,AAAA'})

    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error', 'MISSING_BRAND')
  })

  it('rejects uploads targeting unauthorized brands', async () => {
    const token = jwt.sign(
      {id: 'u3', email: 'c@d.com', role: 'EDITOR', brandSlug: 'jars'},
      process.env.JWT_SECRET || 'dev-secret',
    )
    const res = await withAdminCookies(
      appRequest().post('/api/admin/upload-logo'),
      token,
    ).send({filename: 'logo.png', data: 'data:image/png;base64,AAAA', brand: 'other'})

    expect(res.status).toBe(403)
    expect(res.body).toHaveProperty('error', 'FORBIDDEN')
  })
})
