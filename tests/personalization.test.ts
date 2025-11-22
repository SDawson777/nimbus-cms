import {describe, it, expect, vi, beforeEach} from 'vitest'
import fs from 'fs'
import path from 'path'
import {evaluatePersonalization, loadRules} from '../server/src/lib/personalization'

const fetchCMSMock = vi.hoisted(() => vi.fn())

vi.mock('../server/src/lib/cms', () => ({
  fetchCMS: fetchCMSMock,
}))

const fixturesDir = path.join(__dirname, 'fixtures')
const partialRulesFixture = JSON.parse(
  fs.readFileSync(path.join(fixturesDir, 'personalization-partial.json'), 'utf-8'),
)

beforeEach(() => {
  fetchCMSMock.mockReset()
})

describe('personalization lib', () => {
  it('applies boosts to matching candidates', async () => {
    fetchCMSMock.mockResolvedValueOnce([
      {
        _id: 'r1',
        name: 'Prefer Vegan Articles',
        enabled: true,
        conditions: [{key: 'preference', operator: 'equals', value: 'vegan'}],
        actions: [{targetType: 'article', targetSlugOrKey: 'vegan-guide', priorityBoost: 10}],
      },
    ])
    const user = {preference: 'vegan'}
    const candidates = [
      {id: 'a1', slug: 'vegan-guide', type: 'article', title: 'Vegan Guide', score: 0},
      {id: 'a2', slug: 'meat-guide', type: 'article', title: 'Meat Guide', score: 0},
    ]
    const out = await evaluatePersonalization(user, candidates)
    expect(out[0].slug).toBe('vegan-guide')
    expect(out[0].score).toBeGreaterThan(0)
  })

  it('ignores partially paused rules that lack valid actions', async () => {
    fetchCMSMock.mockResolvedValueOnce(partialRulesFixture.rules)
    const user = {diet: 'vegan', channel: 'mobile'}
    const candidates = [
      {id: 'a1', slug: 'vegan-guide', type: 'article', title: 'Vegan Guide', score: 0},
      {id: 'banner', slug: 'homepage-hero', type: 'banner', title: 'Hero Banner', score: 0},
    ]
    const out = await evaluatePersonalization(user, candidates)
    const vegan = out.find((c) => c.slug === 'vegan-guide')
    expect(vegan?.score).toBeGreaterThan(0)
    const banner = out.find((c) => c.slug === 'homepage-hero')
    expect(banner?.score).toBe(0)
  })

  it('applies channel-specific rule actions when channel matches', async () => {
    fetchCMSMock.mockResolvedValueOnce(partialRulesFixture.rules)
    const user = {channel: 'web'}
    const candidates = [
      {id: 'banner', slug: 'homepage-hero', type: 'banner', channel: 'web', score: 0},
      {id: 'article', slug: 'vegan-guide', type: 'article', score: 0},
    ]
    const out = await evaluatePersonalization(user, candidates)
    expect(out[0].slug).toBe('homepage-hero')
    expect(out[0].score).toBeGreaterThan(0)
  })
})
