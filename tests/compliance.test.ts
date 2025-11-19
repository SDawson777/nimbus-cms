import {describe, it, expect, beforeEach, vi} from 'vitest'

var fetchCMSMock: any
vi.mock('../server/src/lib/cms', () => {
  fetchCMSMock = vi.fn()
  return {fetchCMS: fetchCMSMock}
})

import {computeCompliance} from '../server/src/lib/compliance'

beforeEach(() => {
  fetchCMSMock.mockReset()
})

describe('computeCompliance', () => {
  it('computes compliance score and missing types per store', async () => {
    // two stores
    const stores = [
      {_id: 's1', slug: 'store-a', stateCode: 'MI', title: 'Store A'},
      {_id: 's2', slug: 'store-b', stateCode: 'AZ', title: 'Store B'},
    ]
    // legal docs: MI has terms+privacy, global has accessibility
    const legalDocs = [
      {
        _id: 'l1',
        type: 'terms',
        stateCode: 'MI',
        version: '1',
        effectiveFrom: new Date().toISOString(),
      },
      {
        _id: 'l2',
        type: 'privacy',
        stateCode: 'MI',
        version: '1',
        effectiveFrom: new Date().toISOString(),
      },
      {
        _id: 'l3',
        type: 'accessibility',
        stateCode: null,
        version: '1',
        effectiveFrom: new Date().toISOString(),
      },
    ]

    // fetchCMS will be called first for stores, then for legal docs
    fetchCMSMock.mockResolvedValueOnce(stores)
    fetchCMSMock.mockResolvedValueOnce(legalDocs)

    const rows = await computeCompliance(['terms', 'privacy', 'accessibility'])
    expect(rows).toBeInstanceOf(Array)
    const a = rows.find((r: any) => r.storeSlug === 'store-a')
    const b = rows.find((r: any) => r.storeSlug === 'store-b')
    // store-a MI has terms+privacy+accessibility -> full score
    expect(a.complianceScore).toBe(100)
    expect(a.missingTypes.length).toBe(0)
    // store-b AZ should only get accessibility (global) -> missing terms/privacy
    expect(b.complianceScore).toBe(Math.round((1 / 3) * 100))
    expect(b.missingTypes).toContain('terms')
    expect(b.missingTypes).toContain('privacy')
  })

  it('handles no stores gracefully', async () => {
    // no stores
    fetchCMSMock.mockResolvedValueOnce([])
    fetchCMSMock.mockResolvedValueOnce([])
    const rows = await computeCompliance(['terms'])
    expect(Array.isArray(rows)).toBe(true)
    expect(rows.length).toBe(0)
  })

  it('handles no legal docs (all missing)', async () => {
    const stores = [{_id: 's1', slug: 'store-a', stateCode: 'MI'}]
    fetchCMSMock.mockResolvedValueOnce(stores)
    fetchCMSMock.mockResolvedValueOnce([])
    const rows = await computeCompliance(['terms', 'privacy'])
    expect(rows[0].complianceScore).toBe(0)
    expect(rows[0].missingTypes).toContain('terms')
    expect(rows[0].missingTypes).toContain('privacy')
  })

  it('handles malformed/non-numeric versions by falling back to effectiveFrom', async () => {
    const stores = [{_id: 's1', slug: 'store-a', stateCode: 'MI'}]
    const now = new Date().toISOString()
    const legalDocs = [
      {_id: 'l1', type: 'terms', stateCode: 'MI', version: 'v1', effectiveFrom: now},
      {
        _id: 'l2',
        type: 'terms',
        stateCode: 'MI',
        version: 'v2',
        effectiveFrom: new Date(Date.now() + 1000).toISOString(),
      },
    ]
    fetchCMSMock.mockResolvedValueOnce(stores)
    fetchCMSMock.mockResolvedValueOnce(legalDocs)
    const rows = await computeCompliance(['terms'])
    // picking the one with later effectiveFrom
    expect(rows[0].complianceScore).toBe(100)
    expect(rows[0].currentLegalDocs[0].version).toBe('v2')
  })
})
