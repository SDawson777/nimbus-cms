import {describe, it, expect, beforeEach, vi} from 'vitest'
import request from 'supertest'

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

beforeEach(() => {
  fetchCMSMock.mockReset()
  createWriteClientMock.mockReset()
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
      {id: 't', email: 'a@b', role: 'EDITOR'},
      process.env.JWT_SECRET || 'dev-secret',
    )
    const res = await request(app).get('/api/admin/products').set('Cookie', `admin_token=${token}`)
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
      {id: 't', email: 'a@b', role: 'EDITOR'},
      process.env.JWT_SECRET || 'dev-secret',
    )
    const res = await request(app)
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
      {id: 't', email: 'a@b', role: 'EDITOR'},
      process.env.JWT_SECRET || 'dev-secret',
    )
    const res = await request(app)
      .post('/api/admin/products/p2/recall')
      .set('Cookie', `admin_token=${token}`)
      .send({isRecalled: false})
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ok: true})
  })
})
