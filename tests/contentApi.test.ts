import {describe,it,expect,beforeEach,vi} from 'vitest'
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

describe('GET /api/v1/content/legal', () => {
  it('returns latest legal doc', async () => {
    const doc = {title: 'Terms', version: '1', updatedAt: '2024', body: []}
    fetchCMSMock.mockResolvedValueOnce(doc)
    const res = await request(app).get('/api/v1/content/legal').query({type: 'terms'})
    expect(res.status).toBe(200)
    expect(res.body).toEqual(doc)
  })

  it('validates query params', async () => {
    const res = await request(app).get('/api/v1/content/legal')
    expect(res.status).toBe(500)
  })
})

describe('GET /api/v1/content/faqs', () => {
  it('returns faq groups', async () => {
    const faqs = [{title: 't', slug: 't', items: [{q: 'q', a: 'a'}]}]
    fetchCMSMock.mockResolvedValueOnce(faqs)
    const res = await request(app).get('/api/v1/content/faqs')
    expect(res.status).toBe(200)
    expect(res.body).toEqual(faqs)
  })

  it('handles cms errors', async () => {
    fetchCMSMock.mockRejectedValueOnce(new Error('boom'))
    const res = await request(app).get('/api/v1/content/faqs')
    expect(res.status).toBe(500)
  })
})

describe('GET /api/v1/content/articles', () => {
  it('lists articles', async () => {
    const items = [
      {
        id: '1',
        title: 'A',
        slug: 'a',
        excerpt: 'ex',
        body: [],
        cover: {src: '', alt: ''},
        tags: [],
        author: 'auth',
        publishedAt: '2024',
        featured: false
      }
    ]
    fetchCMSMock.mockResolvedValueOnce(1)
    fetchCMSMock.mockResolvedValueOnce(items)
    const res = await request(app)
      .get('/api/v1/content/articles')
      .query({page: 1, limit: 10})
    expect(res.status).toBe(200)
    expect(res.body).toEqual({items, page: 1, limit: 10, total: 1, totalPages: 1})
  })

  it('returns single article', async () => {
    const item = {
      id: '1',
      title: 'A',
      slug: 'a',
      excerpt: 'ex',
      body: [],
      cover: {src: '', alt: ''},
      tags: [],
      author: 'auth',
      publishedAt: '2024',
      featured: false
    }
    fetchCMSMock.mockResolvedValueOnce(item)
    const res = await request(app).get('/api/v1/content/articles/a')
    expect(res.status).toBe(200)
    expect(res.body).toEqual(item)
  })

  it('404 when article missing', async () => {
    fetchCMSMock.mockResolvedValueOnce(null)
    const res = await request(app).get('/api/v1/content/articles/missing')
    expect(res.status).toBe(404)
    expect(res.body).toEqual({error: 'NOT_FOUND'})
  })

  it('validates query params', async () => {
    const res = await request(app).get('/api/v1/content/articles').query({limit: 100})
    expect(res.status).toBe(500)
  })
})

describe('GET /api/v1/content/filters', () => {
  it('returns filters and categories', async () => {
    const categories = [{name: 'c', slug: 'c', iconRef: 'i', weight: 1}]
    const filters = [
      {
        name: 'f',
        slug: 'f',
        type: 'select',
        options: [{label: 'L', value: 'v'}]
      }
    ]
    fetchCMSMock.mockResolvedValueOnce(categories)
    fetchCMSMock.mockResolvedValueOnce(filters)
    const res = await request(app).get('/api/v1/content/filters')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({categories, filters})
  })

  it('handles cms errors', async () => {
    fetchCMSMock.mockRejectedValueOnce(new Error('fail'))
    const res = await request(app).get('/api/v1/content/filters')
    expect(res.status).toBe(500)
  })
})

describe('GET /api/v1/content/deals', () => {
  it('returns deals', async () => {
    const items = [
      {
        title: 'Deal',
        slug: 'deal',
        badge: '',
        ctaText: 'Buy',
        ctaLink: '/',
        image: {src: '', alt: ''},
        priority: 1,
        startAt: '2023',
        endAt: '2024',
        stores: ['s1']
      }
    ]
    fetchCMSMock.mockResolvedValueOnce(items)
    const res = await request(app).get('/api/v1/content/deals').query({limit: 1})
    expect(res.status).toBe(200)
    expect(res.body).toEqual(items)
  })

  it('validates query params', async () => {
    const res = await request(app).get('/api/v1/content/deals').query({limit: 0})
    expect(res.status).toBe(500)
  })
})

describe('GET /api/v1/content/copy', () => {
  it('returns app copy', async () => {
    const items = [{key: 'hello', text: 'world'}]
    fetchCMSMock.mockResolvedValueOnce(items)
    const res = await request(app)
      .get('/api/v1/content/copy')
      .query({context: 'onboarding'})
    expect(res.status).toBe(200)
    expect(res.body).toEqual(items)
  })

  it('requires context', async () => {
    const res = await request(app).get('/api/v1/content/copy')
    expect(res.status).toBe(500)
  })
})
