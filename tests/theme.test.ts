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
  it('requires brand query param', async () => {
    const res = await request(app).get('/content/theme')
    expect(res.status).toBe(400)
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
})
