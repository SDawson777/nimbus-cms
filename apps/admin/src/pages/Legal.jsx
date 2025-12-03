import React, {useEffect, useState} from 'react'
import {apiJson} from '../lib/api'

export default function Legal() {
  const [items, setItems] = useState([])
  useEffect(() => {
    async function load() {
      try {
        const {ok, data} = await apiJson('/api/admin/legal', {}, [])
        if (ok) {
          setItems(Array.isArray(data) ? data : [])
        }
      } catch (err) {
        console.error(err)
      }
    }
    load()
  }, [])

  return (
    <div style={{padding: 20}}>
      <h1>Legal Documents</h1>
      <div className="card" style={{marginBottom: 16}}>
        <h3 style={{marginTop: 0}}>Data &amp; AI Usage</h3>
        <p style={{margin: '4px 0'}}>
          Nimbus surfaces optional AI assistance for admins. Inputs are limited to the prompts you
          provide, and no training or retention occurs server-side unless the API backend enables it via
          environment flags. Buyers should review their own data handling policies before enabling
          production AI endpoints.
        </p>
        <p style={{margin: '4px 0'}}>
          For privacy requests or data export, reach the team at <a href="mailto:privacy@nimbus.app">privacy@nimbus.app</a>.
        </p>
      </div>
      <table style={{width: '100%', borderCollapse: 'collapse'}}>
        <thead>
          <tr>
            <th>Title</th>
            <th>Type</th>
            <th>State</th>
            <th>Version</th>
            <th>Effective From</th>
            <th>Channels</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((d) => (
            <tr key={d._id}>
              <td>{d.title}</td>
              <td>{d.type}</td>
              <td>{d.stateCode || 'Global'}</td>
              <td>{d.version}</td>
              <td>{d.effectiveFrom}</td>
              <td>
                {Array.isArray(d.channels) && d.channels.length ? d.channels.join(', ') : 'Global'}
              </td>
              <td>
                <a href="/studio" target="_blank" rel="noreferrer">
                  Open in Studio
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
