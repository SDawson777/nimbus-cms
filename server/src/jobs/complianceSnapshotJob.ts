import {createWriteClient, fetchCMS} from '../lib/cms'
import {computeCompliance} from '../lib/compliance'

export async function runComplianceSnapshotOnce() {
  // Fetch organizations and brands to snapshot per-org/brand plus a global snapshot
  const orgs = (await fetchCMS('*[_type=="organization"]{slug}', {})) as Array<{slug?: string}>
  const brands = (await fetchCMS('*[_type=="brand"]{slug}', {})) as Array<{slug?: string}>
  const client = createWriteClient()

  const nowTs = new Date().toISOString()

  // global snapshot (history + latest pointer)
  const globalResults = await computeCompliance()
  const globalDocHistory = {
    _id: `complianceSnapshot-global-${nowTs}`,
    _type: 'complianceSnapshot',
    orgSlug: 'global',
    ts: nowTs,
    results: globalResults,
  }
  await client.create(globalDocHistory).catch(() => client.createOrReplace(globalDocHistory))
  const globalLatest = {
    _id: `complianceSnapshotLatest-global`,
    _type: 'complianceSnapshot',
    orgSlug: 'global',
    ts: nowTs,
    results: globalResults,
  }
  await client.createOrReplace(globalLatest)

  // update central monitor doc
  try {
    const monitorId = 'complianceMonitor'
    const monitorDoc: any = {
      _id: monitorId,
      _type: 'complianceMonitor',
      lastRuns: [{scope: 'global', snapshotId: globalLatest._id, ts: nowTs}],
    }
    await client.createOrReplace(monitorDoc)
  } catch (e) {
    // ignore monitor failures
  }

  // per-organization snapshots
  for (const o of orgs || []) {
    const orgSlug = o.slug
    if (!orgSlug) continue
    const results = await computeCompliance(['terms', 'privacy', 'accessibility', 'ageGate'], {
      org: orgSlug,
    })
    const historyDoc = {
      _id: `complianceSnapshot-${orgSlug}-${nowTs}`,
      _type: 'complianceSnapshot',
      orgSlug,
      ts: nowTs,
      results,
    }
    await client.create(historyDoc).catch(() => client.createOrReplace(historyDoc))
    const latestDoc = {
      _id: `complianceSnapshotLatest-${orgSlug}`,
      _type: 'complianceSnapshot',
      orgSlug,
      ts: nowTs,
      results,
    }
    await client.createOrReplace(latestDoc)
    // update monitor for org
    try {
      const monitorId = 'complianceMonitor'
      const monitorDoc: any = {
        _id: monitorId,
        _type: 'complianceMonitor',
        lastRuns: [{scope: `org:${orgSlug}`, snapshotId: latestDoc._id, ts: nowTs}],
      }
      await client.createOrReplace(monitorDoc)
    } catch (e) {
      // ignore
    }
  }

  // per-brand snapshots
  for (const b of brands || []) {
    const brandSlug = b.slug
    if (!brandSlug) continue
    const results = await computeCompliance(['terms', 'privacy', 'accessibility', 'ageGate'], {
      brand: brandSlug,
    })
    const historyDoc = {
      _id: `complianceSnapshot-brand-${brandSlug}-${nowTs}`,
      _type: 'complianceSnapshot',
      orgSlug: 'global',
      brandSlug,
      ts: nowTs,
      results,
    }
    await client.create(historyDoc).catch(() => client.createOrReplace(historyDoc))
    const latestDoc = {
      _id: `complianceSnapshotLatest-brand-${brandSlug}`,
      _type: 'complianceSnapshot',
      orgSlug: 'global',
      brandSlug,
      ts: nowTs,
      results,
    }
    await client.createOrReplace(latestDoc)
    // update monitor for brand
    try {
      const monitorId = 'complianceMonitor'
      const monitorDoc: any = {
        _id: monitorId,
        _type: 'complianceMonitor',
        lastRuns: [{scope: `brand:${brandSlug}`, snapshotId: latestDoc._id, ts: nowTs, brandSlug}],
      }
      await client.createOrReplace(monitorDoc)
    } catch (e) {
      // ignore
    }
  }
}

export function startComplianceScheduler(intervalMs?: number) {
  const ms = intervalMs || Number(process.env.COMPLIANCE_SNAPSHOT_INTERVAL_MS || 1000 * 60 * 60)
  // fire and schedule
  runComplianceSnapshotOnce().catch((e) => console.error('initial compliance snapshot failed', e))
  const id = setInterval(
    () => runComplianceSnapshotOnce().catch((e) => console.error('compliance snapshot failed', e)),
    ms,
  )
  return () => clearInterval(id)
}

export default {runComplianceSnapshotOnce, startComplianceScheduler}
