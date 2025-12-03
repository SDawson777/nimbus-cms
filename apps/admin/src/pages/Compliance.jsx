import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {useAdmin} from '../lib/adminContext'
import {apiFetch, apiJson} from '../lib/api'

function formatSnapshotLabel(ts) {
  if (!ts) return 'Live (no snapshot)'
  const date = new Date(ts)
  if (Number.isNaN(date.getTime())) return ts
  return date.toLocaleString()
}

export default function Compliance() {
  const {capabilities} = useAdmin()
  const scopedBrand = capabilities?.scopes?.brandSlug || ''

  const [rows, setRows] = useState([])
  const [snapshotTs, setSnapshotTs] = useState(null)
  const [overviewLoading, setOverviewLoading] = useState(true)
  const [overviewError, setOverviewError] = useState(null)

  const [filterState, setFilterState] = useState('')
  const [brands, setBrands] = useState([])
  const [brandsLoading, setBrandsLoading] = useState(true)
  const [brandsError, setBrandsError] = useState(null)
  const [brandFilter, setBrandFilter] = useState(scopedBrand)

  const [history, setHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [historyError, setHistoryError] = useState(null)

  const [showModal, setShowModal] = useState(false)
  const [snapshotLoading, setSnapshotLoading] = useState(false)

  const isMounted = useRef(true)
  useEffect(
    () => () => {
      isMounted.current = false
    },
    [],
  )

  useEffect(() => {
    if (!brandFilter && scopedBrand) setBrandFilter(scopedBrand)
  }, [brandFilter, scopedBrand])

  const normalizedBrandFilter = (brandFilter || '').trim()
  const normalizedStateFilter = filterState.trim().toUpperCase()
  const orgLabel = capabilities?.scopes?.organizationSlug || 'global'
  const canRunSnapshot = !!capabilities?.canRunComplianceSnapshot
  const brandLocked = Boolean(scopedBrand)

  const loadOverview = useCallback(async () => {
    setOverviewLoading(true)
    setOverviewError(null)
    try {
      const qs = new URLSearchParams()
      if (normalizedBrandFilter) qs.set('brand', normalizedBrandFilter)
      const url = `/api/admin/compliance/overview${qs.toString() ? `?${qs}` : ''}`
      const {ok, data, response} = await apiJson(url, {}, {})
      if (!ok) {
        const text = await response.text().catch(() => '')
        throw new Error(text || 'Failed to load compliance overview')
      }
      const resultRows = Array.isArray(data) ? data : data?.results || []
      if (!isMounted.current) return
      setRows(resultRows)
      setSnapshotTs(data?.snapshotTs || null)
    } catch (err) {
      console.error(err)
      if (!isMounted.current) return
      setOverviewError(err?.message || 'Failed to load compliance overview')
      setRows([])
      setSnapshotTs(null)
    } finally {
      if (isMounted.current) setOverviewLoading(false)
    }
  }, [normalizedBrandFilter])

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true)
    setHistoryError(null)
    try {
      const qs = new URLSearchParams()
      if (normalizedBrandFilter) qs.set('brand', normalizedBrandFilter)
      const url = `/api/admin/compliance/history${qs.toString() ? `?${qs}` : ''}`
      const {ok, data, response} = await apiJson(url, {}, [])
      if (!ok) {
        const text = await response.text().catch(() => '')
        throw new Error(text || 'Failed to load history')
      }
      if (!isMounted.current) return
      setHistory(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error(err)
      if (!isMounted.current) return
      setHistoryError(err?.message || 'Failed to load history')
      setHistory([])
    } finally {
      if (isMounted.current) setHistoryLoading(false)
    }
  }, [normalizedBrandFilter])

  const loadBrands = useCallback(async () => {
    setBrandsLoading(true)
    setBrandsError(null)
    try {
      const {ok, data, response} = await apiJson('/api/admin/brands', {}, [])
      if (!ok) {
        const text = await response.text().catch(() => '')
        throw new Error(text || 'Failed to load brands')
      }
      if (!isMounted.current) return
      setBrands(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error(err)
      if (!isMounted.current) return
      setBrandsError(err?.message || 'Failed to load brands')
    } finally {
      if (isMounted.current) setBrandsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadOverview()
  }, [loadOverview])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  useEffect(() => {
    loadBrands()
  }, [loadBrands])

  const stateOptions = useMemo(() => {
    const values = new Set(['GLOBAL'])
    rows.forEach((row) => values.add((row.stateCode || 'GLOBAL').toUpperCase()))
    return Array.from(values).sort()
  }, [rows])

  const rowsFiltered = useMemo(() => {
    if (!normalizedStateFilter) return rows
    return rows.filter((row) => {
      const state = (row.stateCode || 'GLOBAL').toUpperCase()
      return state === normalizedStateFilter
    })
  }, [rows, normalizedStateFilter])

  const totalStores = rows.length
  const displayedStores = rowsFiltered.length

  const brandOptions = useMemo(() => {
    const map = new Map()
    if (scopedBrand) map.set(scopedBrand, scopedBrand)
    brands.forEach((brand) => {
      if (!brand?.slug) return
      const label = brand.name ? `${brand.name} (${brand.slug})` : brand.slug
      map.set(brand.slug, label)
    })
    return Array.from(map.entries()).map(([slug, label]) => ({slug, label}))
  }, [brands, scopedBrand])

  const handleSnapshot = useCallback(async () => {
    if (!canRunSnapshot) return
    setSnapshotLoading(true)
    try {
      const res = await apiFetch('/api/admin/compliance/snapshot', {
        method: 'POST',
        body: JSON.stringify({brand: normalizedBrandFilter || undefined}),
      })
      if (!res.ok) {
        const text = await res.text().catch(() => '')
        throw new Error(text || 'Snapshot failed')
      }
      const data = await safeJson(res, {})
      if (data?.ts) setSnapshotTs(data.ts)
      if (data?.studioUrl) window.open(data.studioUrl, '_blank')
      await Promise.all([loadOverview(), loadHistory()])
      setShowModal(false)
    } catch (err) {
      console.error(err)
      alert(err?.message || 'Snapshot failed')
    } finally {
      setSnapshotLoading(false)
    }
  }, [canRunSnapshot, normalizedBrandFilter, loadOverview, loadHistory])

  return (
    <div style={{padding: 20}}>
      <h1>Compliance Overview</h1>

      <div
        style={{
          marginTop: 16,
          marginBottom: 24,
          display: 'grid',
          gap: 16,
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        }}
      >
        <div style={{border: '1px solid #e5e7eb', borderRadius: 8, padding: 16}}>
          <div style={{fontSize: 12, textTransform: 'uppercase', color: '#6b7280'}}>
            Last snapshot
          </div>
          <strong>{formatSnapshotLabel(snapshotTs)}</strong>
          {overviewLoading && <div style={{fontSize: 12, color: '#6b7280'}}>Refreshing…</div>}
        </div>

        <div style={{border: '1px solid #e5e7eb', borderRadius: 8, padding: 16}}>
          <label style={{fontSize: 12, textTransform: 'uppercase', color: '#6b7280'}}>
            Brand scope
          </label>
          <select
            value={normalizedBrandFilter}
            onChange={(e) => setBrandFilter(e.target.value)}
            disabled={brandLocked || brandsLoading}
            style={{marginTop: 4, width: '100%'}}
          >
            <option value="">All brands (org: {orgLabel})</option>
            {brandOptions.map((option) => (
              <option key={option.slug} value={option.slug}>
                {option.label}
              </option>
            ))}
          </select>
          {brandLocked && (
            <div style={{fontSize: 12, color: '#6b7280', marginTop: 4}}>
              Scope locked to brand {scopedBrand}
            </div>
          )}
          {brandsLoading && <div style={{fontSize: 12}}>Loading brands…</div>}
          {brandsError && (
            <div style={{fontSize: 12, color: '#b91c1c'}}>
              Failed to load brands: {brandsError}{' '}
              <button type="button" onClick={loadBrands} style={{fontSize: 12}}>
                Retry
              </button>
            </div>
          )}
        </div>

        <div style={{border: '1px solid #e5e7eb', borderRadius: 8, padding: 16}}>
          <label style={{fontSize: 12, textTransform: 'uppercase', color: '#6b7280'}}>
            State filter
          </label>
          <div style={{display: 'flex', gap: 8, marginTop: 4}}>
            <input
              list="compliance-state-options"
              value={filterState}
              onChange={(e) => setFilterState(e.target.value.toUpperCase())}
              placeholder="All states"
              style={{flex: 1}}
            />
            {filterState && (
              <button type="button" onClick={() => setFilterState('')}>
                Clear
              </button>
            )}
          </div>
          <datalist id="compliance-state-options">
            {stateOptions.map((state) => (
              <option value={state} key={state} />
            ))}
          </datalist>
          <div style={{fontSize: 12, color: '#6b7280', marginTop: 6}}>
            Showing {displayedStores} of {totalStores} stores
          </div>
        </div>

        <div style={{border: '1px solid #e5e7eb', borderRadius: 8, padding: 16}}>
          <div style={{fontSize: 12, textTransform: 'uppercase', color: '#6b7280'}}>Snapshots</div>
          <button
            style={{marginTop: 8}}
            onClick={() => setShowModal(true)}
            disabled={!canRunSnapshot}
            title={canRunSnapshot ? 'Run compliance snapshot' : 'Org Admin role required'}
          >
            Run snapshot
          </button>
          {!canRunSnapshot && (
            <div style={{fontSize: 12, color: '#b91c1c', marginTop: 4}}>
              Org Admin role required to run snapshots
            </div>
          )}
        </div>
      </div>

      <section style={{marginBottom: 32}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <h2 style={{margin: 0}}>Per-store compliance</h2>
          <button type="button" onClick={loadOverview} disabled={overviewLoading}>
            {overviewLoading ? 'Refreshing…' : 'Reload overview'}
          </button>
        </div>
        {overviewError && (
          <div style={{marginTop: 12, padding: 12, background: '#fee2e2', color: '#b91c1c'}}>
            Failed to load overview: {overviewError}{' '}
            <button type="button" onClick={loadOverview} style={{fontSize: 12}}>
              Retry
            </button>
          </div>
        )}
        {!overviewError && displayedStores === 0 && !overviewLoading ? (
          <div style={{marginTop: 16}}>No stores match the current filters.</div>
        ) : (
          <div style={{overflowX: 'auto', marginTop: 16}}>
            <table style={{width: '100%', borderCollapse: 'collapse'}}>
              <thead>
                <tr>
                  <th>Store</th>
                  <th>State</th>
                  <th>Compliance</th>
                  <th>Missing</th>
                  <th>Current Docs</th>
                </tr>
              </thead>
              <tbody>
                {rowsFiltered.map((row) => (
                  <tr key={row.storeSlug}>
                    <td>{row.storeSlug}</td>
                    <td>{row.stateCode || 'GLOBAL'}</td>
                    <td>
                      <span
                        style={{
                          fontWeight: 700,
                          color:
                            row.complianceScore >= 80
                              ? '#16a34a'
                              : row.complianceScore >= 50
                                ? '#f97316'
                                : '#ef4444',
                        }}
                      >
                        {row.complianceScore}%
                      </span>
                    </td>
                    <td>{(row.missingTypes || []).join(', ') || '—'}</td>
                    <td>
                      {(row.currentLegalDocs || [])
                        .map((doc) => `${doc.type}@${doc.version || ''}`)
                        .join(', ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section style={{marginBottom: 32}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <h3 style={{margin: 0}}>Snapshot history</h3>
          <button type="button" onClick={loadHistory} disabled={historyLoading}>
            {historyLoading ? 'Refreshing…' : 'Reload history'}
          </button>
        </div>
        {historyError && (
          <div style={{marginTop: 12, padding: 12, background: '#fee2e2', color: '#b91c1c'}}>
            Failed to load history: {historyError}{' '}
            <button type="button" onClick={loadHistory} style={{fontSize: 12}}>
              Retry
            </button>
          </div>
        )}
        {!historyError && history.length === 0 && !historyLoading ? (
          <div style={{marginTop: 12}}>No snapshot history available for this scope.</div>
        ) : (
          <div style={{overflowX: 'auto', marginTop: 12}}>
            <table style={{width: '100%', borderCollapse: 'collapse'}}>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Scope</th>
                  <th>Snapshot</th>
                  <th>Run by</th>
                  <th>Studio</th>
                </tr>
              </thead>
              <tbody>
                {history.map((entry) => (
                  <tr key={entry._id}>
                    <td>{entry.ts}</td>
                    <td>{entry.brandSlug ? `brand:${entry.brandSlug}` : `org:${entry.orgSlug}`}</td>
                    <td>{entry._id}</td>
                    <td>{entry.runBy || '—'}</td>
                    <td>
                      {entry.studioUrl ? (
                        <a href={entry.studioUrl} target="_blank" rel="noreferrer">
                          Open
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {showModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 20,
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            style={{background: '#fff', padding: 24, borderRadius: 8, width: 520, maxWidth: '90%'}}
          >
            <h3>Run compliance snapshot</h3>
            <p>
              This will compute current compliance for the selected scope and persist a snapshot in
              Sanity. The target scope is{' '}
              <strong>
                {normalizedBrandFilter ? `brand:${normalizedBrandFilter}` : `org:${orgLabel}`}
              </strong>
              .
            </p>
            {!canRunSnapshot && (
              <div style={{marginBottom: 12, color: '#b91c1c'}}>
                You need Org Admin permissions to run a snapshot.
              </div>
            )}
            <div style={{display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24}}>
              <button type="button" onClick={() => setShowModal(false)} disabled={snapshotLoading}>
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSnapshot}
                disabled={!canRunSnapshot || snapshotLoading}
              >
                {snapshotLoading ? 'Running…' : 'Confirm and run'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
