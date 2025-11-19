import {describe, it, expect, beforeEach, vi} from 'vitest'
import jwt from 'jsonwebtoken'
import request from 'supertest'

const uploadMock = vi.fn()

vi.mock('../server/src/lib/cms', () => ({
  createWriteClient: vi.fn(() => ({assets: {upload: uploadMock}})),
  fetchCMS: vi.fn(),
}))

import app from '../server/src'

beforeEach(() => {
  uploadMock.mockReset()
})

describe('POST /api/admin/upload-logo', () => {
  it('uploads base64 image and returns asset id and url', async () => {
    uploadMock.mockResolvedValueOnce({_id: 'asset-xyz', url: '/uploads/asset-xyz.png'})
    const token = jwt.sign(
      {id: 'u1', email: 'a@b.com', role: 'EDITOR'},
      process.env.JWT_SECRET || 'dev-secret',
    )
    const res = await request(app)
      .post('/api/admin/upload-logo')
      .set('Cookie', `admin_token=${token}`)
      .send({filename: 'logo.png', data: 'data:image/png;base64,AAAA'})

    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('assetId', 'asset-xyz')
    expect(res.body).toHaveProperty('url', '/uploads/asset-xyz.png')
  })
})
