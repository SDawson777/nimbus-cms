import {TrafficChart, SalesChart, EngagementChart} from '../components/Charts'
import Card from '../design-system/Card'
import Badge from '../design-system/Badge'
import React, {useEffect, useState} from 'react'
let ChartJS
let Line
try {
  // Optional runtime import so dev/test environments without deps don't crash
  ChartJS = require('chart.js')
  Line = require('react-chartjs-2').Line
} catch (e) {
  ChartJS = null
  Line = null
}

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const res = await fetch('/api/admin/analytics/overview', {credentials: 'include'})
        if (!res.ok) return
        const json = await res.json()
        if (mounted) setData(json)
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
  const [recalledCount, setRecalledCount] = (React.useState < number) | (null > null)

  React.useEffect(() => {
    let mounted = true
    async function loadRecalled() {
      try {
        // use lightweight cached endpoint that returns recalled product count
        const res = await fetch('/api/admin/products/recalled-count', {credentials: 'include'})
        if (!res.ok) return
        const json = await res.json()
        if (mounted) setRecalledCount(typeof json.count === 'number' ? json.count : 0)
      } catch (e) {
        // ignore
      }
    }
    loadRecalled()
    return () => {
      mounted = false
    }
  }, [])
  return (
    <div style={{padding: 20}}>
      <h1>Dashboard</h1>
      /* Metrics Overview */
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <Card style={{padding: 16}}>
          <div style={{fontSize: 12, color: '#6B7280', marginBottom: 4}}>Daily Active Users</div>
          <div style={{fontSize: 24, fontWeight: 600}}>1,245</div>
          <Badge tone="success">+12%</Badge>
        </Card>
        <Card style={{padding: 16}}>
          <div style={{fontSize: 12, color: '#6B7280', marginBottom: 4}}>Conversion Rate</div>
          <div style={{fontSize: 24, fontWeight: 600}}>3.2%</div>
          <Badge tone="success">+0.4%</Badge>
        </Card>
        <Card style={{padding: 16}}>
          <div style={{fontSize: 12, color: '#6B7280', marginBottom: 4}}>Avg. Order Value</div>
          <div style={{fontSize: 24, fontWeight: 600}}>$58.40</div>
          <Badge tone="warn">-2%</Badge>
        </Card>
        <Card style={{padding: 16}}>
          <div style={{fontSize: 12, color: '#6B7280', marginBottom: 4}}>Recalled Products</div>
          <div
            style={{
              fontSize: 24,
              fontWeight: 600,
              color: recalledCount && recalledCount > 0 ? '#EF4444' : '#10B981',
            }}
          >
            {recalledCount === null ? 'Loading...' : recalledCount}
          </div>
          {recalledCount !== null && (
            <Badge tone={recalledCount > 0 ? 'error' : 'success'}>
              {recalledCount === 0 ? 'All Clear' : 'Action Needed'}
            </Badge>
          )}
        </Card>
      </div>
      /* Recharts Visualizations */
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <TrafficChart />
        <SalesChart />
      </div>
      <div style={{marginBottom: 24}}>
        <EngagementChart />
      </div>
      <div style={{display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12}}>
        <div>
          <h2>Top Articles</h2>
          <table style={{width: '100%', borderCollapse: 'collapse'}}>
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

          <h2 style={{marginTop: 16}}>Top Products</h2>
          <table style={{width: '100%', borderCollapse: 'collapse'}}>
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
                  <td>
                    {(() => {
                      const ps = productSeries.find((s) => s.slug === p.contentSlug)
                      if (!ps) return null
                      const values = ps.series.map((s) => s.views || 0)
                      if (Line && ChartJS) {
                        const labels = ps.series.map((s) => s.date)
                        const data = {
                          labels,
                          datasets: [
                            {
                              data: values,
                              borderColor: '#1976d2',
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
                          <div style={{width: 100, height: 36}}>
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
                        <svg
                          width="100"
                          height="24"
                          viewBox="0 0 100 100"
                          preserveAspectRatio="none"
                        >
                          <polyline fill="none" stroke="#1976d2" strokeWidth="2" points={points} />
                        </svg>
                      )
                    })()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div>
          <h2>Stores by Engagement</h2>
          <ul>
            {stores.map((s) => (
              <li key={s.storeSlug}>
                {s.storeSlug}: {s.views} views, {s.clickThroughs} clicks
              </li>
            ))}
          </ul>

          <h2 style={{marginTop: 16}}>Product Demand Insights</h2>
          <table style={{width: '100%', borderCollapse: 'collapse'}}>
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
                  <td>{d.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
