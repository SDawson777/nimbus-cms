import React, {useEffect, useState} from 'react'
import {safeJson} from '../lib/safeJson'

export default function Legal() {
  const [items, setItems] = useState([])
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/admin/legal', {credentials: 'include'})
        if (res.ok) {
          const j = await safeJson(res, [])
          setItems(Array.isArray(j) ? j : [])
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
