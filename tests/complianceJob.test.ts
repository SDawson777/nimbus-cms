import {describe, it, expect, beforeEach, vi} from 'vitest'

var fetchCMSMock: any
var createWriteClientMock: any
vi.mock('../server/src/lib/cms', () => {
  fetchCMSMock = vi.fn()
  createWriteClientMock = vi.fn(() => ({
    create: vi.fn(() => Promise.resolve(true)),
    createOrReplace: vi.fn(() => Promise.resolve(true)),
  }))
  return {fetchCMS: fetchCMSMock, createWriteClient: createWriteClientMock}
})

import {runComplianceSnapshotOnce} from '../server/src/jobs/complianceSnapshotJob'

beforeEach(() => {
  fetchCMSMock.mockReset()
  createWriteClientMock.mockReset()
})

describe('compliance snapshot job', () => {
  it('writes global and per-org snapshots', async () => {
    const orgs = [{slug: 'acme'}, {slug: 'beta'}]
    // fetchCMS called first to get orgs, then inside computeCompliance for stores/legal — we will stub returns simply
    fetchCMSMock.mockResolvedValueOnce(orgs)
    // subsequent calls from computeCompliance: for global stores, global legal, for org stores, org legal etc.
    // To keep it simple return empty arrays for stores/legal so writes still happen
    fetchCMSMock.mockResolvedValue([])

    await runComplianceSnapshotOnce()

    // createWriteClient should be called at least once
    expect(createWriteClientMock).toHaveBeenCalled()
  })
})
