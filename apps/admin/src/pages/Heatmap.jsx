import React, { useEffect, useState } from 'react'
import Card from '../design-system/Card'
import Heatmap from '../components/Heatmap'
import { apiJson, apiBaseUrl } from '../lib/api'

const SAMPLE_STORES = [
  { storeSlug: 'detroit-hq', longitude: -83.0458, latitude: 42.3314, engagement: 42, views: 980, clickThroughs: 240 },
  { storeSlug: 'chicago-loop', longitude: -87.6298, latitude: 41.8781, engagement: 37, views: 860, clickThroughs: 210 },
  { storeSlug: 'nyc-soho', longitude: -74.006, latitude: 40.7128, engagement: 55, views: 1120, clickThroughs: 310 },
]

export default function HeatmapPage() {
  const [stores, setStores] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        if (apiBaseUrl()) {
          const { ok, data } = await apiJson('/api/admin/analytics/overview')
          if (mounted && ok && data?.storeEngagement) {
            setStores(Array.isArray(data.storeEngagement) ? data.storeEngagement : [])
            return
          }
        }
        if (mounted) setStores(SAMPLE_STORES)
      } catch (e) {
        if (mounted) setStores(SAMPLE_STORES)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [])

  const mapToken = import.meta.env.VITE_NIMBUS_HEATMAP_MAPBOX_TOKEN || ''
  const canRender = mapToken && stores.length > 1

  return (
    <div className="page-shell" style={{padding: 16}}>
      <div className="page-header">
        <div>
          <p className="eyebrow">Locations</p>
          <h1>Heatmap</h1>
          <p className="subdued">Track multi-store engagement across the map. Token-gated for secure previews.</p>
        </div>
      </div>

      <Card>
        {!mapToken && <p className="metric-subtle">Add VITE_NIMBUS_HEATMAP_MAPBOX_TOKEN to enable the heatmap.</p>}
        {mapToken && stores.length <= 1 && (
          <p className="metric-subtle">Heatmap activates automatically when you have 2 or more locations.</p>
        )}
        {canRender && <Heatmap stores={stores} token={mapToken} />}
        {loading && <p className="metric-subtle">Loading stores…</p>}
      </Card>
    </div>
  )
}
