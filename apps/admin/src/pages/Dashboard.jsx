import {TrafficChart, SalesChart, EngagementChart} from '../components/Charts'
import Badge from '../design-system/Badge'
import React, {useEffect, useState} from 'react'
// Use ESM imports so Vite can bundle Chart.js and react-chartjs-2 correctly.
import ChartJS from 'chart.js/auto'
import {Line} from 'react-chartjs-2'
import {safeJson} from '../lib/safeJson'

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  // Track number of recalled products; start at null until loaded.
  const [recalledCount, setRecalledCount] = useState(null)

  useEffect(() => {
    let mounted = true
    async function loadRecalled() {
      try {
        // use lightweight cached endpoint that returns recalled product count
        const res = await fetch('/api/admin/products/recalled-count', {credentials: 'include'})
        if (!res.ok) return
        const json = await safeJson(res)
        if (mounted && json) setRecalledCount(typeof json.count === 'number' ? json.count : 0)
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
        const res = await fetch('/api/admin/analytics/overview', {credentials: 'include'})
        if (!res.ok) return
        const json = await safeJson(res)
        if (mounted && json) setData(json)
      } catch (err) {
        console.error(err)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [])

  if (loading) return <div style={{padding: 20}}>Loading...</div>

  const topArticles = (data && data.topArticles) || []
  const topFaqs = (data && data.topFaqs) || []
  const topProducts = (data && data.topProducts) || []
  const productSeries = (data && data.productSeries) || []
  const stores = (data && data.storeEngagement) || []
  const demand = (data && data.productDemand) || []
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
