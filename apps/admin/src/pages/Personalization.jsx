import React, {useCallback, useEffect, useMemo, useState} from 'react'
import {useAdmin} from '../lib/adminContext'
import {apiFetch, apiJson} from '../lib/api'
import {safeJson} from '../lib/safeJson'

export default function Personalization() {
  const {capabilities} = useAdmin()
  const [rules, setRules] = useState([])
  const [rulesLoading, setRulesLoading] = useState(true)
  const [rulesError, setRulesError] = useState(null)
  const [simCtx, setSimCtx] = useState({
    preference: '',
    location: '',
    timeOfDay: '',
    lastPurchaseDaysAgo: '',
  })
  const [result, setResult] = useState(null)
  const [simulateError, setSimulateError] = useState(null)
  const [simulateLoading, setSimulateLoading] = useState(false)

  const canManage = !!capabilities?.canManagePersonalization
  const canView = !!capabilities?.canViewPersonalization

  const loadRules = useCallback(async () => {
    setRulesLoading(true)
    setRulesError(null)
    try {
      const {ok, data, response} = await apiJson('/api/admin/personalization/rules', {}, [])
      if (!ok) {
        const text = await response.text().catch(() => '')
        throw new Error(text || 'Failed to load rules')
      }
      setRules(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('load rules failed', err)
      setRules([])
      setRulesError(err?.message || 'Failed to load rules')
    } finally {
      setRulesLoading(false)
    }
  }, [])

  useEffect(() => {
    loadRules()
  }, [loadRules])

  const hasRules = useMemo(() => Array.isArray(rules) && rules.length > 0, [rules])

  async function simulate() {
    setSimulateError(null)
    setResult(null)
    setSimulateLoading(true)
    try {
      const body = {
        context: {...simCtx, lastPurchaseDaysAgo: Number(simCtx.lastPurchaseDaysAgo || 0)},
        contentType: 'article',
      }
      const res = await apiFetch('/personalization/apply', {
        method: 'POST',
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const text = await res.text().catch(() => '')
        throw new Error(text || 'Simulation failed')
      }
      const j = await safeJson(res, {})
      setResult(j)
    } catch (err) {
      console.error('simulate failed', err)
      setSimulateError(err?.message || 'Simulation failed')
    } finally {
      setSimulateLoading(false)
    }
  }

  const studioBaseUrl = (import.meta.env.VITE_STUDIO_URL || '/studio').replace(/\/$/, '')
  const previewSecret = import.meta.env.VITE_PREVIEW_SECRET
  const studioPreviewSuffix = previewSecret ? `?secret=${encodeURIComponent(previewSecret)}` : ''

  return (
    <div style={{padding: 20}}>
      <h1>Personalization Rules</h1>
      {!canView && (
        <div style={{padding: 12, background: '#fee2e2', color: '#b91c1c', marginTop: 12}}>
          You do not have permission to view personalization rules. Contact an Org or Brand Admin.
        </div>
      )}

      {canView && (
        <div style={{display: 'flex', gap: 20, marginTop: 16, flexWrap: 'wrap'}}>
          <div style={{flex: 1, minWidth: 320}}>
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
              <h2 style={{margin: 0}}>Rules</h2>
              <button type="button" onClick={loadRules} disabled={rulesLoading}>
                {rulesLoading ? 'Refreshing…' : 'Reload'}
              </button>
            </div>
            {rulesError && (
              <div style={{marginTop: 8, padding: 10, background: '#fee2e2', color: '#b91c1c'}}>
                Failed to load rules: {rulesError}
              </div>
            )}
            {!rulesError && !hasRules && !rulesLoading && (
              <div style={{marginTop: 8}}>No rules configured for this scope.</div>
            )}
            {rulesLoading && <div style={{marginTop: 8}}>Loading rules…</div>}
            {hasRules && (
              <ul style={{marginTop: 12}}>
                {rules.map((r) => (
                  <li key={r._id} style={{marginBottom: 12}}>
                    <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
                      <strong>{r.name}</strong>
                      {!r.enabled && (
                        <span
                          style={{
                            fontSize: 12,
                            color: '#b45309',
                            background: '#fef3c7',
                            padding: '0 6px',
                            borderRadius: 999,
                          }}
                        >
                          Disabled
                        </span>
                      )}
                    </div>
                    {r.description && <small style={{display: 'block'}}>{r.description}</small>}
                    <div style={{marginTop: 4}}>
                      <strong>Conditions:</strong>{' '}
                      {(r.conditions || [])
                        .map((c) => `${c.key} ${c.operator} ${c.value}`)
                        .join('; ') || '—'}
                    </div>
                    <div>
                      <strong>Actions:</strong>{' '}
                      {(r.actions || [])
                        .map(
                          (a) =>
                            `${a.targetType}:${a.targetSlugOrKey} (+${a.priorityBoost || 0})${a.channel ? ' @' + a.channel : ''}`,
                        )
                        .join('; ') || '—'}
                    </div>
                    <div>
                      <a
                        href={`${studioBaseUrl}/desk/personalizationRule;${r._id}${studioPreviewSuffix}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open in Studio
                      </a>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div style={{width: 360, flex: '0 0 auto'}}>
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
              <h2 style={{margin: 0}}>Simulator</h2>
              {!canManage && (
                <span style={{fontSize: 12, color: '#b91c1c'}}>
                  Editor role required to simulate
                </span>
              )}
            </div>
            {['preference', 'location', 'timeOfDay', 'lastPurchaseDaysAgo'].map((field) => (
              <label key={field} style={{display: 'block', marginTop: 8}}>
                {field === 'lastPurchaseDaysAgo'
                  ? 'Last purchase days ago'
                  : field.charAt(0).toUpperCase() + field.slice(1)}
                <br />
                <input
                  value={simCtx[field]}
                  onChange={(e) => setSimCtx({...simCtx, [field]: e.target.value})}
                  disabled={!canManage}
                  style={{width: '100%'}}
                />
              </label>
            ))}
            <div style={{marginTop: 8}}>
              <button onClick={simulate} disabled={!canManage || simulateLoading}>
                {simulateLoading ? 'Running…' : 'Simulate'}
              </button>
            </div>
            {simulateError && <div style={{marginTop: 8, color: '#b91c1c'}}>{simulateError}</div>}
            <div style={{marginTop: 16}}>
              <h3>Result</h3>
              <pre style={{whiteSpace: 'pre-wrap'}}>
                {result ? JSON.stringify(result, null, 2) : 'Run simulation'}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
