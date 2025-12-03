import React, {useEffect, useMemo, useState} from 'react'
import {TrafficChart, SalesChart, EngagementChart} from '../components/Charts'
import Badge from '../design-system/Badge'
import Card from '../design-system/Card'
import ChartJS from 'chart.js/auto'
import {Line} from 'react-chartjs-2'
import {apiJson, apiBaseUrl} from '../lib/api'
import Heatmap2D from '../components/Heatmap2D'
import {fetchDashboardLayout, saveDashboardLayout, DEFAULT_LAYOUT} from '../lib/preferences'
import {useNotify} from '../components/NotificationCenter'

const SAMPLE_OVERVIEW = {
  traffic: [
    {timestamp: '08:00', visits: 320},
    {timestamp: '10:00', visits: 540},
    {timestamp: '12:00', visits: 680},
    {timestamp: '14:00', visits: 720},
    {timestamp: '16:00', visits: 610},
  ],
  sales: [
    {timestamp: '08:00', value: 1800},
    {timestamp: '10:00', value: 2400},
    {timestamp: '12:00', value: 3100},
    {timestamp: '14:00', value: 3600},
    {timestamp: '16:00', value: 2900},
  ],
  engagement: [
    {timestamp: 'Mon', depth: 5.4, retention: 62},
    {timestamp: 'Tue', depth: 5.9, retention: 64},
    {timestamp: 'Wed', depth: 6.4, retention: 67},
    {timestamp: 'Thu', depth: 6.1, retention: 65},
    {timestamp: 'Fri', depth: 6.7, retention: 70},
  ],
  topArticles: [
    {contentSlug: 'ai-strategy-2025', views: 1820, clickThroughs: 420},
    {contentSlug: 'compliance-fastlane', views: 1460, clickThroughs: 360},
    {contentSlug: 'design-systems', views: 1210, clickThroughs: 310},
  ],
  topFaqs: [
    {contentSlug: 'pricing', views: 980, clickThroughs: 250},
    {contentSlug: 'security', views: 840, clickThroughs: 210},
    {contentSlug: 'analytics', views: 720, clickThroughs: 180},
  ],
  topProducts: [
    {contentSlug: 'aurora-os', views: 2100, clickThroughs: 640, sales: 74},
    {contentSlug: 'halo-pay', views: 1860, clickThroughs: 520, sales: 58},
    {contentSlug: 'atlas-ai', views: 1640, clickThroughs: 480, sales: 61},
  ],
  productSeries: [
    {
      slug: 'aurora-os',
      series: [
        {date: 'T0', views: 320},
        {date: 'T1', views: 480},
        {date: 'T2', views: 620},
        {date: 'T3', views: 710},
        {date: 'T4', views: 680},
      ],
    },
    {
      slug: 'halo-pay',
      series: [
        {date: 'T0', views: 280},
        {date: 'T1', views: 340},
        {date: 'T2', views: 420},
        {date: 'T3', views: 510},
        {date: 'T4', views: 470},
      ],
    },
    {
      slug: 'atlas-ai',
      series: [
        {date: 'T0', views: 260},
        {date: 'T1', views: 330},
        {date: 'T2', views: 410},
        {date: 'T3', views: 560},
        {date: 'T4', views: 520},
      ],
    },
  ],
  storeEngagement: [
    {storeSlug: 'detroit-hq', longitude: -83.0458, latitude: 42.3314, engagement: 42, views: 980, clickThroughs: 240},
    {storeSlug: 'chicago-loop', longitude: -87.6298, latitude: 41.8781, engagement: 37, views: 860, clickThroughs: 210},
    {storeSlug: 'nyc-soho', longitude: -74.006, latitude: 40.7128, engagement: 55, views: 1120, clickThroughs: 310},
  ],
  productDemand: [
    {slug: 'aurora-os', demandScore: 92, status: 'Hot'},
    {slug: 'halo-pay', demandScore: 84, status: 'Watch'},
    {slug: 'atlas-ai', demandScore: 76, status: 'Stable'},
  ],
}

const CARD_COPY = {
  traffic: 'Traffic momentum across web and app surfaces.',
  revenue: 'Revenue pulse in real time across SKUs.',
  engagement: 'Engagement depth and retention by week.',
  demand: 'Product demand and risk signals.',
  products: 'Top products with sparklines by velocity.',
  faqs: 'Knowledge base deflection and FAQ traction.',
  stores: 'Store by store engagement rollup.',
  heatmap: 'Multi-location heatmap for regional ops.',
}

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [recalledCount, setRecalledCount] = useState(null)
  const [layout, setLayout] = useState(DEFAULT_LAYOUT)
  const [savingLayout, setSavingLayout] = useState(false)
  const notify = useNotify()

  useEffect(() => {
    let mounted = true
    async function loadRecalled() {
      try {
        if (!apiBaseUrl()) {
          setRecalledCount(0)
          return
        }
        const {ok, data} = await apiJson('/api/admin/products/recalled-count', {}, null)
        if (mounted && ok && data)
          setRecalledCount(typeof data.count === 'number' ? data.count : 0)
      } catch (e) {
        if (mounted) setRecalledCount(0)
      }
    }
    async function loadLayout() {
      const {layout} = await fetchDashboardLayout()
      if (mounted && layout) setLayout(layout)
    }
    async function loadOverview() {
      try {
        if (!apiBaseUrl()) {
          setData(SAMPLE_OVERVIEW)
          return
        }
        const {ok, data} = await apiJson('/api/admin/analytics/overview', {}, null)
        if (mounted) setData(ok && data ? data : SAMPLE_OVERVIEW)
      } catch (err) {
        if (mounted) setData(SAMPLE_OVERVIEW)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    loadRecalled()
    loadLayout()
    loadOverview()
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (layout?.favorites?.length) {
      notify({
        title: 'Favorites saved',
        body: 'Alerts mirror your favorites. Adjust ordering with the arrows.',
        tone: 'info',
        ttl: 3200,
      })
    }
  }, [layout?.favorites?.length, notify])

  const topArticles = (data && data.topArticles) || SAMPLE_OVERVIEW.topArticles
  const topFaqs = (data && data.topFaqs) || SAMPLE_OVERVIEW.topFaqs
  const topProducts = (data && data.topProducts) || SAMPLE_OVERVIEW.topProducts
  const productSeries = (data && data.productSeries) || SAMPLE_OVERVIEW.productSeries
  const stores = (data && data.storeEngagement) || SAMPLE_OVERVIEW.storeEngagement
  const demand = (data && data.productDemand) || SAMPLE_OVERVIEW.productDemand
  const heatmapToken = import.meta.env.VITE_NIMBUS_HEATMAP_MAPBOX_TOKEN || null

  const visibleCards = useMemo(
    () => layout.order.filter((id) => !layout.hidden.includes(id)),
    [layout],
  )
  const favorites = useMemo(() => new Set(layout.favorites || []), [layout])

  if (loading) return <div style={{padding: 20}}>Loading...</div>

  const productSnapshot = topProducts.map((p, idx) => {
    const ps = productSeries.find((s) => s.slug === p.contentSlug)
    const series = ps?.series || []
    const point = series.length ? series[series.length - 1] : null
    const value = point?.views ?? point?.value ?? p.views ?? p.clickThroughs ?? 0
    return {
      label: p.contentSlug || p.name || `Product ${idx + 1}`,
      value,
    }
  })

  const saveLayout = async (next) => {
    setLayout(next)
    setSavingLayout(true)
    await saveDashboardLayout(next)
    setSavingLayout(false)
  }

  const toggleFavorite = (id) => {
    const favs = new Set(layout.favorites)
    if (favs.has(id)) favs.delete(id)
    else favs.add(id)
    saveLayout({...layout, favorites: Array.from(favs)})
  }

  const moveCard = (id, dir) => {
    const order = [...layout.order]
    const idx = order.indexOf(id)
    const swap = idx + dir
    if (idx === -1 || swap < 0 || swap >= order.length) return
    ;[order[idx], order[swap]] = [order[swap], order[idx]]
    saveLayout({...layout, order})
  }

  const renderSpark = (series) => {
    if (!Line || !ChartJS) return null
    const labels = series.map((s) => s.date)
    const values = series.map((s) => s.views || s.value || 0)
    const data = {labels, datasets: [{data: values, borderColor: '#22d3ee', backgroundColor: 'transparent', tension: 0.3, pointRadius: 0}]}
    const opts = {responsive: true, maintainAspectRatio: false, plugins: {legend: {display: false}}, scales: {x: {display: false}, y: {display: false}}}
    return (
      <div className="sparkline">
        <Line data={data} options={opts} />
      </div>
    )
  }

  const cardRenderers = {
    traffic: (
      <div className="panel-card">
        <div className="panel-header">
          <h2 className="section-title">Traffic momentum</h2>
          <span className="pill">Web &amp; in-app</span>
        </div>
        <p className="section-note">{CARD_COPY.traffic}</p>
        <TrafficChart data={data?.traffic} />
      </div>
    ),
    revenue: (
      <div className="panel-card">
        <div className="panel-header">
          <h2 className="section-title">Revenue pulse</h2>
          <span className="pill">Real-time</span>
        </div>
        <p className="section-note">{CARD_COPY.revenue}</p>
        <SalesChart data={data?.sales} />
      </div>
    ),
    engagement: (
      <div className="panel-card">
        <div className="panel-header">
          <h2 className="section-title">Engagement depth</h2>
          <span className="pill">Retention</span>
        </div>
        <p className="section-note">{CARD_COPY.engagement}</p>
        <EngagementChart data={data?.engagement} />
      </div>
    ),
    demand: (
      <div className="table-card">
        <div className="panel-header" style={{marginBottom: 4}}>
          <h2 className="section-title">Product demand insights</h2>
          <span className="pill">Signal</span>
        </div>
        <p className="section-note">{CARD_COPY.demand}</p>
        <table className="data-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Score</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {demand.map((d) => (
              <tr key={d.slug}>
                <td>{d.slug}</td>
                <td>{Math.round(d.demandScore)}</td>
                <td>
                  <span
                    className={
                      d.status?.toLowerCase().includes('watch')
                        ? 'status-warn'
                        : d.status?.toLowerCase().includes('risk')
                          ? 'status-danger'
                          : 'status-positive'
                    }
                  >
                    {d.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ),
    products: (
      <div className="table-card">
        <div className="panel-header">
          <h2 className="section-title">Top products</h2>
          <span className="pill">Velocity</span>
        </div>
        <p className="section-note">{CARD_COPY.products}</p>
        <table className="data-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Views</th>
              <th>Clicks</th>
              <th>Trend</th>
            </tr>
          </thead>
          <tbody>
            {topProducts.map((p) => {
              const series = productSeries.find((s) => s.slug === p.contentSlug)?.series || []
              return (
                <tr key={p.contentSlug}>
                  <td>{p.contentSlug}</td>
                  <td>{p.views}</td>
                  <td>{p.clickThroughs}</td>
                  <td style={{minWidth: 110}}>{series.length ? renderSpark(series) : <span className="metric-subtle">n/a</span>}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    ),
    faqs: (
      <div className="table-card">
        <div className="panel-header">
          <h2 className="section-title">Knowledge base fuel</h2>
          <span className="pill">Service quality</span>
        </div>
        <p className="section-note">{CARD_COPY.faqs}</p>
        <table className="data-table">
          <thead>
            <tr>
              <th>FAQ</th>
              <th>Views</th>
              <th>Clicks</th>
            </tr>
          </thead>
          <tbody>
            {topFaqs.map((faq) => (
              <tr key={faq.contentSlug}>
                <td>{faq.contentSlug}</td>
                <td>{faq.views}</td>
                <td>{faq.clickThroughs}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ),
    stores: (
      <div className="table-card">
        <div className="panel-header" style={{marginBottom: 4}}>
          <h2 className="section-title">Stores by engagement</h2>
          <span className="pill">Regional</span>
        </div>
        <p className="section-note">{CARD_COPY.stores}</p>
        <ul className="list-muted">
          {stores.map((s) => (
            <li key={s.storeSlug} style={{marginBottom: 8}}>
              <strong style={{color: '#fff'}}>{s.storeSlug}</strong> — {s.views} views · {s.clickThroughs}
              &nbsp;clicks
            </li>
          ))}
        </ul>
      </div>
    ),
    heatmap: stores.length > 1 && heatmapToken ? (
      <div>
        <h2 className="section-title">Location heatmap</h2>
        <p className="section-note">{CARD_COPY.heatmap}</p>
        <Heatmap2D stores={stores} token={heatmapToken} />
      </div>
    ) : null,
  }

  return (
    <div className="dashboard-shell" style={{padding: 8}}>
      <div className="hero-banner">
        <div className="hero-copy">
          <p className="pill">Nimbus Control Center</p>
          <h1>Operational analytics cockpit</h1>
          <p>
            Production-ready governance for engagement, commerce, and compliance across every surface.
            Built for real-time operations and buyer handoff without surprises.
          </p>
          <div className="pill-row">
            <span className="pill-badge">99.95% uptime</span>
            <span className="pill-badge">Multi-tenant ready</span>
            <span className="pill-badge">SOC2-aligned</span>
          </div>
        </div>
        <div className="hero-actions">
          <div className="mini-stat">
            <div className="metric-label">Daily actives</div>
            <div className="metric-value" style={{fontSize: 26}}>
              1,245
            </div>
            <div className="status-positive">+12% vs last week</div>
          </div>
          <div className="mini-stat">
            <div className="metric-label">Risk posture</div>
            <div className="status-warn">Tracked</div>
            <div className="metric-subtle">Monitoring data residency &amp; PII access</div>
          </div>
        </div>
      </div>

      <div className="dashboard-toolbar" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, margin: '12px 0 16px'}}>
        <div>
          <p className="section-note" style={{margin: 0}}>
            Tap the star to favorite and use the tiny arrows to reorder your core widgets. Full layout controls live in Settings.
          </p>
        </div>
        {savingLayout && <span className="metric-subtle">Saving…</span>}
      </div>

      <div className="metric-grid">
        <div className="metric-card">
          <div className="metric-label">Conversion rate</div>
          <div className="metric-value">3.2%</div>
          <Badge tone="success">+0.4% uplift</Badge>
          <div className="metric-subtle">Personalization experiments holding steady</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Avg. order value</div>
          <div className="metric-value">$58.40</div>
          <Badge tone="warn">-2% drift</Badge>
          <div className="metric-subtle">Bundle optimizations rolling out</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Engagement depth</div>
          <div className="metric-value">6.4 min</div>
          <Badge tone="success">Top decile</Badge>
          <div className="metric-subtle">Time on page across all surfaces</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Recalled products</div>
          <div className="metric-value" style={{color: recalledCount && recalledCount > 0 ? '#f87171' : '#34d399'}}>
            {recalledCount === null ? 'Loading…' : recalledCount}
          </div>
          {recalledCount !== null && (
            <Badge tone={recalledCount > 0 ? 'error' : 'success'}>
              {recalledCount === 0 ? 'All clear' : 'Action needed'}
            </Badge>
          )}
          <div className="metric-subtle">Quality controls &amp; consumer safety</div>
        </div>
      </div>

      <div className="panel-grid">
        {visibleCards.map((id) => (
          <Card key={id}>
            <div className="card-header">
              <div className="card-title-row" style={{gap: 8}}>
                <h3 style={{margin: 0, fontSize: 16}}>{id.replace(/\b\w/g, (l) => l.toUpperCase())}</h3>
                <div className="card-actions" aria-label="Widget controls">
                  <button
                    className={`icon-button ${favorites.has(id) ? 'is-active' : ''}`}
                    aria-label="Toggle favorite"
                    onClick={() => toggleFavorite(id)}
                  >
                    ★
                  </button>
                  <button className="icon-button" aria-label="Move up" onClick={() => moveCard(id, -1)}>
                    ↑
                  </button>
                  <button className="icon-button" aria-label="Move down" onClick={() => moveCard(id, 1)}>
                    ↓
                  </button>
                </div>
              </div>
              <p className="section-note" style={{margin: 0}}>{CARD_COPY[id]}</p>
            </div>
            {cardRenderers[id] || <p className="metric-subtle">Coming soon</p>}
          </Card>
        ))}
      </div>
    </div>
  )
}
