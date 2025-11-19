import {describe, it, expect, beforeEach, vi} from 'vitest'
import request from 'supertest'

var fetchCMSMock: any
vi.mock('../server/src/lib/cms', () => {
  fetchCMSMock = vi.fn()
  return {fetchCMS: fetchCMSMock}
})

import app from '../server/src'

beforeEach(() => {
  fetchCMSMock.mockReset()
})

describe('GET /content/theme', () => {
  it('returns 404 when no brand and no global theme exists', async () => {
    // no global theme -> should 404
    fetchCMSMock.mockResolvedValueOnce(null)
    const res = await request(app).get('/content/theme')
    expect(res.status).toBe(404)
  })

  it('returns global theme when no brand provided and global exists', async () => {
    const global = {
      primaryColor: '#111',
      secondaryColor: '#222',
      backgroundColor: '#333',
      textColor: '#444',
      logoUrl: '/g.png',
    }
    fetchCMSMock.mockResolvedValueOnce(global)
    const res = await request(app).get('/content/theme')
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('primaryColor', '#111')
  })

  it('returns theme when brand provided', async () => {
    const theme = {
      brand: 'jars',
      primaryColor: '#fff',
      secondaryColor: '#000',
      backgroundColor: '#eee',
      textColor: '#222',
      logoUrl: '/img.png',
    }
    fetchCMSMock.mockResolvedValueOnce(theme)
    const res = await request(app).get('/content/theme').query({brand: 'jars'})
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('brand', 'jars')
    expect(res.body).toHaveProperty('primaryColor')
  })

  it('prefers store override when brand+store provided', async () => {
    const storeTheme = {brand: 'jars', store: 'downtown', primaryColor: '#000'}
    fetchCMSMock.mockResolvedValueOnce(storeTheme)
    const res = await request(app).get('/content/theme').query({brand: 'jars', store: 'downtown'})
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('store', 'downtown')
    expect(res.body.primaryColor).toBe('#000')
  })
})
