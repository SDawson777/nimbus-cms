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

describe('Channel filtering semantics (end-to-end)', () => {
  it('articles: returns docs that include channel or are global', async () => {
    // Simulate count() call and items call. When channel=mobile, both docs should be returned.
    const globalDoc = {id: 'g', title: 'Global', channels: undefined}
    const mobileDoc = {id: 'm', title: 'Mobile Only', channels: ['mobile']}

    // first call: count -> 2
    fetchCMSMock.mockResolvedValueOnce(2)
    // second call: items -> [globalDoc, mobileDoc]
    fetchCMSMock.mockResolvedValueOnce([globalDoc, mobileDoc])

    const res = await request(app)
      .get('/content/articles')
      .query({page: 1, limit: 10, channel: 'mobile'})
    expect(res.status).toBe(200)
    expect(res.body.items).toHaveLength(2)
    expect(res.body.items.map((i: any) => i.title)).toEqual(['Global', 'Mobile Only'])
  })

  it('articles: with channel that does not match returns only global docs', async () => {
    const globalDoc = {id: 'g', title: 'Global', channels: undefined}
    const mobileDoc = {id: 'm', title: 'Mobile Only', channels: ['mobile']}

    fetchCMSMock.mockResolvedValueOnce(1) // count
    fetchCMSMock.mockResolvedValueOnce([globalDoc])

    const res = await request(app)
      .get('/content/articles')
      .query({page: 1, limit: 10, channel: 'web'})
    expect(res.status).toBe(200)
    expect(res.body.items).toHaveLength(1)
    expect(res.body.items[0].title).toBe('Global')
  })

  it('faqs: items projection filtered by channel', async () => {
    const groups = [
      {
        title: 'Group A',
        slug: 'a',
        items: [
          {q: 'Q1', a: 'A1', channels: undefined},
          {q: 'Q2', a: 'A2', channels: ['mobile']},
        ],
      },
    ]
    fetchCMSMock.mockResolvedValueOnce(groups)
    const res = await request(app).get('/content/fa_q').query({channel: 'mobile'})
    expect(res.status).toBe(200)
    // flattened mobile should include both items
    expect(res.body.some((it: any) => it.question === 'Q1')).toBe(true)
    expect(res.body.some((it: any) => it.question === 'Q2')).toBe(true)
  })

  it('deals: includes docs matching channel or global', async () => {
    const items = [
      {title: 'Global Deal', slug: 'g', channels: undefined},
      {title: 'Mobile Deal', slug: 'm', channels: ['mobile']},
    ]
    fetchCMSMock.mockResolvedValueOnce(items)
    const res = await request(app)
      .get('/api/v1/content/deals')
      .query({limit: 10, channel: 'mobile'})
    expect(res.status).toBe(200)
    expect(res.body.length).toBe(2)
  })

  it('legal: channel filter applied', async () => {
    const doc = {title: 'Terms', version: '1', body: [], channels: ['mobile']}
    fetchCMSMock.mockResolvedValueOnce(doc)
    const res = await request(app).get('/content/legal').query({type: 'terms', channel: 'mobile'})
    expect(res.status).toBe(200)
    expect(res.body.title).toBe('Terms')
  })
})
