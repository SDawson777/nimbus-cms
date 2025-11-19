import React, {useEffect, useState} from 'react'

export default function Analytics() {
  const [metrics, setMetrics] = useState([])

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/admin/analytics/content-metrics', {credentials: 'include'})
        if (res.ok) {
          const j = await res.json()
          setMetrics(j)
        }
      } catch (err) {
        console.error(err)
      }
    }
    load()
  }, [])

  return (
    <div style={{padding: 20}}>
      <h1>Analytics</h1>
      <h2>Top content by views</h2>
      <table style={{width: '100%', borderCollapse: 'collapse'}}>
        <thead>
          <tr>
            <th>Content</th>
            <th>Type</th>
            <th>Views</th>
            <th>Clicks</th>
            <th>Last Updated</th>
          </tr>
        </thead>
        <tbody>
          {metrics.map((m) => (
            <tr key={m._id}>
              <td>{m.contentSlug}</td>
              <td>{m.contentType}</td>
              <td>{m.views}</td>
              <td>{m.clickThroughs}</td>
              <td>{m.lastUpdated}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
