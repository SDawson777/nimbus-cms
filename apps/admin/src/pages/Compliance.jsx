import React, {useEffect, useState} from 'react'

export default function Compliance() {
  const [rows, setRows] = useState(null)
  const [loading, setLoading] = useState(true)
  const [snapshotTs, setSnapshotTs] = useState(null)

  const [filterState, setFilterState] = useState('')
  const [brands, setBrands] = useState([])
  const [brandFilter, setBrandFilter] = useState('')
  const [history, setHistory] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [snapshotLoading, setSnapshotLoading] = useState(false)

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const res = await fetch('/api/admin/compliance/overview', {credentials: 'include'})
        if (!res.ok) return
        const json = await res.json()
        if (mounted) {
          // endpoint now returns { results, snapshotTs }
          if (json.results) {
            setRows(json.results)
            setSnapshotTs(json.snapshotTs || null)
          } else {
            setRows(json)
            setSnapshotTs(null)
          }
        }
      } catch (err) {
        console.error(err)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    // load brands for filter
    ;(async () => {
      try {
        const r = await fetch('/api/admin/brands', {credentials: 'include'})
        if (r.ok) setBrands(await r.json())
      } catch (e) {
        /* ignore */
      }
    })()
    // load history
    ;(async () => {
      try {
        const r = await fetch('/api/admin/compliance/history', {credentials: 'include'})
        if (r.ok) setHistory(await r.json())
      } catch (e) {
        /* ignore */
      }
    })()
    return () => (mounted = false)
  }, [])

  if (loading) return <div style={{padding: 20}}>Loading…</div>
  if (!rows) return <div style={{padding: 20}}>No data</div>

  const rowsFiltered = Array.isArray(rows)
    ? rows.filter((r) => (filterState ? r.stateCode === filterState : true))
    : []

  return (
    <div style={{padding: 20}}>
      <h1>Compliance Overview</h1>
      <div style={{marginBottom: 12, display: 'flex', gap: 12, alignItems: 'center'}}>
        <div>
          <strong>Last snapshot:</strong> {snapshotTs || 'Live (no snapshot)'}
        </div>
        <div>
          <label>
            Brand:
            <select value={brandFilter} onChange={(e) => setBrandFilter(e.target.value)}>
              <option value="">All</option>
              {brands.map((b) => (
                <option key={b.slug} value={b.slug}>
                  {b.slug}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div>
          <button
            onClick={async () => {
              if (
                !window.confirm(
                  'Run compliance snapshot now? This will write snapshot documents to Sanity.',
                )
              )
                return
              try {
                const r = await fetch('/api/admin/compliance/snapshot', {
                  method: 'POST',
                  credentials: 'include',
                  headers: {'Content-Type': 'application/json'},
                  body: JSON.stringify({brand: brandFilter || undefined}),
                })
                if (!r.ok) return alert('Snapshot failed')
                const j = await r.json()
                alert('Snapshot completed')
                setSnapshotTs(j.ts || new Date().toISOString())
                // refresh data and history
                const res = await fetch('/api/admin/compliance/overview', {credentials: 'include'})
                const json = await res.json()
                if (json.results) setRows(json.results)
                const h = await fetch('/api/admin/compliance/history', {credentials: 'include'})
                if (h.ok) setHistory(await h.json())
              } catch (e) {
                console.error(e)
                alert('Snapshot failed')
              }
            }}
          >
            Run snapshot
          </button>
        </div>
      </div>

      {showModal && (
        <div
          style={{
            position: 'fixed',
            left: 0,
            top: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{background: '#fff', padding: 20, borderRadius: 6, width: 520, maxWidth: '90%'}}
          >
            <h3>Run compliance snapshot</h3>
            <p>
              This will compute current compliance for the selected scope and write snapshot
              documents to Sanity. This operation is idempotent for the same timestamp but will
              create a history record.
            </p>
            <p>
              <strong>Brand:</strong> {brandFilter || 'All / Org'}
            </p>
            <div style={{display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 12}}>
              <button onClick={() => setShowModal(false)} disabled={snapshotLoading}>
                Cancel
              </button>
              <button
                onClick={async () => {
                  setSnapshotLoading(true)
                  try {
                    const r = await fetch('/api/admin/compliance/snapshot', {
                      method: 'POST',
                      credentials: 'include',
                      headers: {'Content-Type': 'application/json'},
                      body: JSON.stringify({brand: brandFilter || undefined}),
                    })
                    if (!r.ok) {
                      const txt = await r.text().catch(() => '')
                      alert('Snapshot failed: ' + txt)
                      return
                    }
                    const j = await r.json()
                    setShowModal(false)
                    setSnapshotTs(j.ts || new Date().toISOString())
                    // refresh data and history
                    const res = await fetch('/api/admin/compliance/overview', {
                      credentials: 'include',
                    })
                    const json = await res.json()
                    if (json.results) setRows(json.results)
                    const h = await fetch('/api/admin/compliance/history', {credentials: 'include'})
                    if (h.ok) setHistory(await h.json())
                    // small success action: open studio doc if available
                    if (j.studioUrl) window.open(j.studioUrl, '_blank')
                  } catch (e) {
                    console.error(e)
                    alert('Snapshot failed')
                  } finally {
                    setSnapshotLoading(false)
                  }
                }}
              >
                {snapshotLoading ? 'Running…' : 'Confirm and run'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{marginTop: 18, marginBottom: 18}}>
        <h3>Snapshot history</h3>
        {Array.isArray(history) && history.length ? (
          <table style={{width: '100%', borderCollapse: 'collapse'}}>
            <thead>
              <tr>
                <th>Time</th>
                <th>Scope</th>
                <th>Snapshot</th>
                <th>Run by</th>
                <th>Studio</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h) => (
                <tr key={h._id}>
                  <td>{h.ts}</td>
                  <td>{h.brandSlug ? `brand:${h.brandSlug}` : `org:${h.orgSlug}`}</td>
                  <td>{h._id}</td>
                  <td>{h.runBy || '—'}</td>
                  <td>
                    {h.studioUrl ? (
                      <a href={h.studioUrl} target="_blank" rel="noreferrer">
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
        ) : (
          <div>No snapshot history available</div>
        )}
      </div>

      <div style={{marginBottom: 12}}>
        <label>
          Filter by state:{' '}
          <input
            value={filterState}
            onChange={(e) => setFilterState(e.target.value)}
            placeholder="e.g. MI"
          />
        </label>
      </div>
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
          {rowsFiltered.map((r) => (
            <tr key={r.storeSlug}>
              <td>{r.storeSlug}</td>
              <td>{r.stateCode || 'GLOBAL'}</td>
              <td>
                <span
                  style={{
                    fontWeight: 700,
                    color:
                      r.complianceScore >= 80
                        ? '#0f0'
                        : r.complianceScore >= 50
                          ? '#ffb020'
                          : '#ff4d4f',
                  }}
                >
                  {r.complianceScore}%
                </span>
              </td>
              <td>{(r.missingTypes || []).join(', ') || '—'}</td>
              <td>
                {(r.currentLegalDocs || []).map((d) => `${d.type}@${d.version || ''}`).join(', ')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
