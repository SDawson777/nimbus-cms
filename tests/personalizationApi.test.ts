import {describe, it, expect, vi, beforeEach} from 'vitest'
import request from 'supertest'

var fetchCMSMock: any
vi.mock('../server/src/lib/cms', () => {
  fetchCMSMock = vi.fn(async (q: string, params?: any) => {
    // For apply endpoint when slugs provided, return matching items
    if (q.includes('personalizationRule')) {
      return [
        {
          _id: 'r1',
          name: 'Prefer VGN',
          enabled: true,
          conditions: [{key: 'preference', operator: 'equals', value: 'vgn'}],
          actions: [{targetType: 'article', targetSlugOrKey: 'vgn-1', priorityBoost: 5}],
        },
      ]
    }
    if (q.includes('*[_type=="article"')) {
      return [
        {_id: 'a1', slug: {current: 'vgn-1'}, title: 'VGN Article', channel: 'mobile'},
        {_id: 'a2', slug: {current: 'other'}, title: 'Other', channel: 'mobile'},
      ]
    }
    return []
  })
  return {fetchCMS: fetchCMSMock}
})

import app from '../server/src'

describe('personalization API', () => {
  it('returns ordered items based on rules', async () => {
    const body = {context: {preference: 'vgn'}, contentType: 'article'}
    const res = await request(app).post('/personalization/apply').send(body)
    expect(res.status).toBe(200)
    expect(res.body.items).toBeTruthy()
    expect(res.body.items[0].slug).toBe('vgn-1')
  })
})
