import React, {useEffect, useState} from 'react'
import {apiFetch, apiJson} from '../lib/api'
import {safeJson} from '../lib/safeJson'

export default function AnalyticsSettings() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState({
    windowDays: 30,
    recentDays: 7,
    wRecentClicks: 2.5,
    wRecentViews: 0.2,
    wHistoricClicks: 1,
    wHistoricViews: 0.05,
    thresholdRising: 200,
    thresholdSteady: 40,
    thresholdFalling: 10,
  })

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const {ok, data} = await apiJson('/api/admin/analytics/settings', {}, {})
        if (!ok) throw new Error('failed')
        if (mounted && data) setSettings((s) => ({...s, ...data}))
      } catch (err) {
        // ignore, keep defaults
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => (mounted = false)
  }, [])

  function updateField(k, v) {
    setSettings((s) => ({...s, [k]: v}))
  }

  function validate(s) {
    const errors = {}
    if (!Number.isFinite(s.windowDays) || s.windowDays <= 0)
      errors.windowDays = 'Must be a positive number'
    if (!Number.isFinite(s.recentDays) || s.recentDays <= 0)
      errors.recentDays = 'Must be a positive number'
    if (s.recentDays > s.windowDays) errors.recentDays = 'Recent days cannot exceed window'
    if (!Number.isFinite(s.wRecentClicks)) errors.wRecentClicks = 'Must be a number'
    if (!Number.isFinite(s.wRecentViews)) errors.wRecentViews = 'Must be a number'
    if (!Number.isFinite(s.wHistoricClicks)) errors.wHistoricClicks = 'Must be a number'
    if (!Number.isFinite(s.wHistoricViews)) errors.wHistoricViews = 'Must be a number'
    if (!Number.isFinite(s.thresholdRising) || s.thresholdRising < 0)
      errors.thresholdRising = 'Must be >= 0'
    if (!Number.isFinite(s.thresholdSteady) || s.thresholdSteady < 0)
      errors.thresholdSteady = 'Must be >= 0'
    if (!Number.isFinite(s.thresholdFalling) || s.thresholdFalling < 0)
      errors.thresholdFalling = 'Must be >= 0'
    return errors
  }

  const errors = validate(settings)
  const isValid = Object.keys(errors).length === 0

  async function save() {
    setSaving(true)
    try {
      const res = await apiFetch('/api/admin/analytics/settings', {
        method: 'POST',
        body: JSON.stringify(settings),
      })
      if (!res.ok) throw new Error('save failed')
      const json = await safeJson(res, {settings})
      alert('Saved')
      setSettings((s) => ({...s, ...json.settings}))
    } catch (err) {
      alert('Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div>Loading analytics settings…</div>

  return (
    <div style={{padding: 20}}>
      <h2>Analytics Settings</h2>
      <div style={{maxWidth: 640}}>
        <label>
          Window days
          <input
            type="number"
            value={settings.windowDays}
            onChange={(e) => updateField('windowDays', Number(e.target.value))}
          />
          {errors.windowDays && <div style={{color: 'red'}}>{errors.windowDays}</div>}
        </label>
        <br />
        <label>
          Recent days
          <input
            type="number"
            value={settings.recentDays}
            onChange={(e) => updateField('recentDays', Number(e.target.value))}
          />
          {errors.recentDays && <div style={{color: 'red'}}>{errors.recentDays}</div>}
        </label>
        <hr />
        <label>
          Weight: recent clicks
          <input
            type="number"
            step="0.1"
            value={settings.wRecentClicks}
            onChange={(e) => updateField('wRecentClicks', Number(e.target.value))}
          />
        </label>
        <br />
        <label>
          Weight: recent views
          <input
            type="number"
            step="0.01"
            value={settings.wRecentViews}
            onChange={(e) => updateField('wRecentViews', Number(e.target.value))}
          />
        </label>
        <br />
        <label>
          Weight: historic clicks
          <input
            type="number"
            step="0.1"
            value={settings.wHistoricClicks}
            onChange={(e) => updateField('wHistoricClicks', Number(e.target.value))}
          />
        </label>
        <br />
        <label>
          Weight: historic views
          <input
            type="number"
            step="0.01"
            value={settings.wHistoricViews}
            onChange={(e) => updateField('wHistoricViews', Number(e.target.value))}
          />
        </label>
        <hr />
        <label>
          Threshold: rising
          <input
            type="number"
            value={settings.thresholdRising}
            onChange={(e) => updateField('thresholdRising', Number(e.target.value))}
          />
        </label>
        <br />
        <label>
          Threshold: steady
          <input
            type="number"
            value={settings.thresholdSteady}
            onChange={(e) => updateField('thresholdSteady', Number(e.target.value))}
          />
        </label>
        <br />
        <label>
          Threshold: falling
          <input
            type="number"
            value={settings.thresholdFalling}
            onChange={(e) => updateField('thresholdFalling', Number(e.target.value))}
          />
        </label>

        <div style={{marginTop: 16, display: 'flex', gap: 8}}>
          <button onClick={save} disabled={saving || !isValid}>
            {saving ? 'Saving…' : 'Save settings'}
          </button>
          <button
            onClick={() => {
              // reset to sensible defaults
              setSettings({
                windowDays: 30,
                recentDays: 7,
                wRecentClicks: 2.5,
                wRecentViews: 0.2,
                wHistoricClicks: 1,
                wHistoricViews: 0.05,
                thresholdRising: 200,
                thresholdSteady: 40,
                thresholdFalling: 10,
              })
            }}
          >
            Reset to defaults
          </button>
        </div>
      </div>
    </div>
  )
}
