import {describe, it, expect, vi, beforeEach} from 'vitest'
import {evaluatePersonalization, loadRules} from '../server/src/lib/personalization'

vi.mock('../server/src/lib/cms', () => ({
  fetchCMS: vi.fn(async (q: string) => {
    // return one simple rule for testing
    return [
      {
        _id: 'r1',
        name: 'Prefer Vegan Articles',
        enabled: true,
        conditions: [{key: 'preference', operator: 'equals', value: 'vegan'}],
        actions: [{targetType: 'article', targetSlugOrKey: 'vegan-guide', priorityBoost: 10}],
      },
    ]
  }),
}))

describe('personalization lib', () => {
  it('applies boosts to matching candidates', async () => {
    const user = {preference: 'vegan'}
    const candidates = [
      {id: 'a1', slug: 'vegan-guide', type: 'article', title: 'Vegan Guide', score: 0},
      {id: 'a2', slug: 'meat-guide', type: 'article', title: 'Meat Guide', score: 0},
    ]
    const out = await evaluatePersonalization(user, candidates)
    expect(out[0].slug).toBe('vegan-guide')
    expect(out[0].score).toBeGreaterThan(0)
  })
})
