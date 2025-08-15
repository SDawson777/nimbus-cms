import { describe, it, expect, beforeEach, vi } from 'vitest'

// mocks
var fetchMock: any
var createClientMock: any
vi.mock('@sanity/client', () => {
  fetchMock = vi.fn()
  createClientMock = vi.fn(() => ({ fetch: fetchMock }))
  return { createClient: createClientMock }
})

import { fetchCMS } from '../server/src/lib/cms'

beforeEach(() => {
  fetchMock.mockReset()
  createClientMock.mockClear()
  process.env.SANITY_PROJECT_ID = 'pid'
  process.env.SANITY_DATASET = 'ds'
  process.env.SANITY_API_VERSION = '2023-07-01'
  process.env.SANITY_API_TOKEN = 'api-token'
  process.env.SANITY_PREVIEW_TOKEN = 'preview-token'
})

describe('fetchCMS', () => {
  it('uses preview token when preview is true', async () => {
    fetchMock.mockResolvedValueOnce({})
    await fetchCMS('testQuery', {}, { preview: true })
    expect(createClientMock).toHaveBeenCalledWith(
      expect.objectContaining({ token: 'preview-token' })
    )
    expect(fetchMock).toHaveBeenCalledWith('testQuery', {})
  })

  it('imports fallback JSON when fetch fails', async () => {
    fetchMock.mockRejectedValueOnce(new Error('boom'))
    const fallbackUrl = new URL('./fixtures/fallback.json', import.meta.url)
    const data = await fetchCMS('q', {}, { fallbackPath: fallbackUrl.href })
    expect(data).toEqual({ message: 'fallback' })
  })
})
