import {TrafficChart, SalesChart, EngagementChart} from '../components/Charts'
import Badge from '../design-system/Badge'
import Card from '../design-system/Card'
import React, {useEffect, useState} from 'react'
// Use ESM imports so Vite can bundle Chart.js and react-chartjs-2 correctly.
import ChartJS from 'chart.js/auto'
import {Line} from 'react-chartjs-2'
import ThreeBarChart from '../components/ThreeBarChart'
import NetworkGraph3D from '../components/NetworkGraph3D'
import GeoMap3D from '../components/GeoMap3D'
import TimeSlider from '../components/TimeSlider'
import {apiJson, apiBaseUrl} from '../lib/api'

const SAMPLE_OVERVIEW = {
  traffic: [],
  sales: [],
  engagement: [],
  topArticles: [],
  topFaqs: [],
  topProducts: [],
  productSeries: [],
  storeEngagement: [],
  productDemand: [],
}

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  // Track number of recalled products; start at null until loaded.
  const [recalledCount, setRecalledCount] = useState(null)
  // Controls for 3D/4D mode and time slider.
  const allow3D = import.meta.env.VITE_ENABLE_3D_ANALYTICS === 'true'
  const [is3DView, setIs3DView] = useState(false)
  const [timeIndex, setTimeIndex] = useState(0)

  useEffect(() => {
    let mounted = true
    async function loadRecalled() {
      try {
        // use lightweight cached endpoint that returns recalled product count
        const {ok, data} = await apiJson('/api/admin/products/recalled-count', {}, null)
        if (mounted && ok && data)
          setRecalledCount(typeof data.count === 'number' ? data.count : 0)
      } catch (e) {
        // ignore
      }
    }
    loadRecalled()
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        if (!apiBaseUrl()) {
          setData(SAMPLE_OVERVIEW)
          return
        }
        const {ok, data} = await apiJson('/api/admin/analytics/overview', {}, null)
        if (mounted && ok && data) {
          setData(data)
        } else if (mounted) {
          setData(SAMPLE_OVERVIEW)
        }
      } catch (err) {
        console.error(err)
        if (mounted) setData(SAMPLE_OVERVIEW)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    const maxLen = (data?.productSeries || []).reduce(
      (max, series) => Math.max(max, (series.series || []).length),
      0,
    )
    setTimeIndex((idx) => Math.min(idx, Math.max(0, maxLen - 1)))
  }, [data])

  if (loading) return <div style={{padding: 20}}>Loading...</div>

  const topArticles = (data && data.topArticles) || []
  const topFaqs = (data && data.topFaqs) || []
  const topProducts = (data && data.topProducts) || []
  const productSeries = (data && data.productSeries) || []
  const stores = (data && data.storeEngagement) || []
  const demand = (data && data.productDemand) || []
  const maxSeriesLength = productSeries.reduce(
    (max, series) => Math.max(max, (series.series || []).length),
    0,
  )
  const maxTimeIndex = Math.max(0, maxSeriesLength - 1)
  const productSnapshot = topProducts.map((p, idx) => {
    const ps = productSeries.find((s) => s.slug === p.contentSlug)
    const series = ps?.series || []
    const safeIdx = Math.min(timeIndex, Math.max(series.length - 1, 0))
    const point = series.length ? series[safeIdx] : null
    const value = point?.views ?? point?.value ?? p.views ?? p.clickThroughs ?? 0
    return {
      label: p.contentSlug || p.name || `Product ${idx + 1}`,
      value,
    }
  })
  return (
    <div className="dashboard-shell" style={{padding: 8}}>
      <div className="hero-banner">
        <div className="hero-copy">
          <p className="pill">Nimbus Control Center</p>
          <h1>Executive experience oversight</h1>
          <p>
            A crisp, enterprise-ready cockpit for engagement, commerce, and compliance intelligence
            across every property.
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

      <div
        className="dashboard-toolbar"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          margin: '12px 0 16px',
        }}
      >
        <div>
          <p className="section-note" style={{margin: 0}}>
            Toggle immersive 3D/4D analytics for investor demos and CX reviews.
          </p>
          {is3DView && (
            <p className="metric-subtle" style={{margin: 0}}>
              Scrub through time to replay engagement waves across your surfaces.
            </p>
          )}
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
          {allow3D && is3DView && (
            <TimeSlider
              min={0}
              max={maxTimeIndex}
              value={timeIndex}
              onChange={setTimeIndex}
            />
          )}
          {allow3D ? (
            <button
              onClick={() => setIs3DView((v) => !v)}
              style={{
                background: is3DView
                  ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)'
                  : 'rgba(255,255,255,0.08)',
                color: is3DView ? '#fff' : '#e5e7eb',
                padding: '0.6rem 1.2rem',
                borderRadius: '0.9rem',
                border: '1px solid rgba(255,255,255,0.25)',
                cursor: 'pointer',
                boxShadow: is3DView ? '0 12px 30px rgba(59,130,246,0.35)' : 'none',
              }}
            >
              {is3DView ? 'Switch to 2D' : 'Enter 3D/4D mode'}
            </button>
          ) : (
            <span style={{color: '#94a3b8', fontSize: 13}}>
              Toggle 3D mode by setting VITE_ENABLE_3D_ANALYTICS=true in your environment.
            </span>
          )}
        </div>
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
          <div
            className="metric-value"
            style={{color: recalledCount && recalledCount > 0 ? '#f87171' : '#34d399'}}
          >
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

      {allow3D && is3DView ? (
        <div
          className="charts-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 16,
          }}
        >
          <Card>
            <h2 style={{fontSize: '1.25rem', marginBottom: 8}}>Top Products (3D)</h2>
            <ThreeBarChart data={productSnapshot} />
          </Card>

          <Card>
            <h2 style={{fontSize: '1.25rem', marginBottom: 8}}>Article Relationships (3D)</h2>
            <NetworkGraph3D
              graphData={{
                nodes: topArticles.map((a, i) => ({
                  id: i + 1,
                  name: a.title || a.contentSlug,
                  group: 1,
                })),
                links: topArticles.slice(1).map((_, i) => ({
                  source: 1,
                  target: i + 2,
                })),
              }}
            />
          </Card>

          <Card>
            <h2 style={{fontSize: '1.25rem', marginBottom: 8}}>Store Engagement Map</h2>
            <GeoMap3D
              data={stores.map((s) => ({
                coordinates: [s.longitude ?? 0, s.latitude ?? 0],
                value: s.engagement ?? s.views ?? 0,
              }))}
            />
          </Card>
        </div>
      ) : (
        <div className="panel-grid">
          <div className="panel-card">
            <div className="panel-header">
              <h2 className="section-title">Traffic momentum</h2>
              <span className="pill">Web &amp; in-app</span>
            </div>
            <TrafficChart />
          </div>
          <div className="panel-card">
            <div className="panel-header">
              <h2 className="section-title">Revenue pulse</h2>
              <span className="pill">Real-time</span>
            </div>
            <SalesChart />
          </div>
          <div className="panel-card" style={{gridColumn: '1 / -1'}}>
            <div className="panel-header">
              <h2 className="section-title">Engagement &amp; retention</h2>
              <span className="pill">Cohorts</span>
            </div>
            <EngagementChart />
          </div>
        </div>
      )}

      <div className="grid-split">
        <div className="table-card">
          <div className="panel-header" style={{marginBottom: 4}}>
            <h2 className="section-title">Top performing content</h2>
            <span className="pill">Stories · Guides · FAQs</span>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Article</th>
                <th>Views</th>
                <th>Clicks</th>
              </tr>
            </thead>
            <tbody>
              {topArticles.map((a) => (
                <tr key={a.contentSlug}>
                  <td>{a.contentSlug}</td>
                  <td>{a.views}</td>
                  <td>{a.clickThroughs}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h2 className="section-title" style={{marginTop: 18}}>Top products</h2>
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
              {topProducts.map((p) => (
                <tr key={p.contentSlug}>
                  <td>{p.contentSlug}</td>
                  <td>{p.views}</td>
                  <td>{p.clickThroughs}</td>
                  <td style={{minWidth: 110}}>
                    {(() => {
                      const ps = productSeries.find((s) => s.slug === p.contentSlug)
                      if (!ps) return <span className="metric-subtle">n/a</span>
                      const values = ps.series.map((s) => s.views || 0)
                      if (Line && ChartJS) {
                        const labels = ps.series.map((s) => s.date)
                        const data = {
                          labels,
                          datasets: [
                            {
                              data: values,
                              borderColor: '#22d3ee',
                              backgroundColor: 'transparent',
                              tension: 0.3,
                              pointRadius: 0,
                            },
                          ],
                        }
                        const opts = {
                          responsive: true,
                          maintainAspectRatio: false,
                          elements: {line: {borderWidth: 2}},
                          plugins: {legend: {display: false}, tooltip: {enabled: true}},
                          scales: {x: {display: false}, y: {display: false}},
                        }
                        return (
                          <div className="sparkline">
                            <Line data={data} options={opts} />
                          </div>
                        )
                      }
                      const max = Math.max(...values, 1)
                      const points = values
                        .map((v, i) => {
                          const x = (i / Math.max(values.length - 1, 1)) * 100
                          const y = 100 - (v / max) * 100
                          return `${x},${y}`
                        })
                        .join(' ')
                      return (
                        <svg className="sparkline" viewBox="0 0 100 100" preserveAspectRatio="none">
                          <polyline fill="none" stroke="#22d3ee" strokeWidth="2" points={points} />
                        </svg>
                      )
                    })()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="table-card">
          <div className="panel-header" style={{marginBottom: 4}}>
            <h2 className="section-title">Stores by engagement</h2>
            <span className="pill">Regional detail</span>
          </div>
          <ul className="list-muted">
            {stores.map((s) => (
              <li key={s.storeSlug} style={{marginBottom: 8}}>
                <strong style={{color: '#fff'}}>{s.storeSlug}</strong> — {s.views} views · {s.clickThroughs}
                &nbsp;clicks
              </li>
            ))}
          </ul>

          <h2 className="section-title" style={{marginTop: 18}}>Product demand insights</h2>
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
      </div>

      <div className="panel-card">
        <div className="panel-header">
          <h2 className="section-title">Knowledge base fuel</h2>
          <span className="pill">Service quality</span>
        </div>
        <div className="pill-row" style={{marginBottom: 8}}>
          <span className="pill-badge">FAQs resolved {topFaqs.length}</span>
          <span className="pill-badge">Fresh updates weekly</span>
          <span className="pill-badge">Chatbot deflection live</span>
        </div>
        <p className="section-note">Top FAQs by volume</p>
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
    </div>
  )
}
