import React, {useEffect, useState} from 'react'
import {apiJson} from '../lib/api'

const CHANNELS = ['', 'mobile', 'web', 'kiosk', 'email', 'ads']

export default function Deals() {
  const [items, setItems] = useState([])
  const [channel, setChannel] = useState('')

  useEffect(() => {
    async function load() {
      try {
        // use Nimbus endpoint which lists active deals
        const q = channel
          ? `/api/v1/nimbus/content/deals?limit=50&channel=${encodeURIComponent(channel)}`
          : '/api/v1/nimbus/content/deals?limit=50'
        const {ok, data} = await apiJson(q, {}, [])
        if (ok) {
          setItems(Array.isArray(data) ? data : [])
        }
      } catch (err) {
        console.error(err)
      }
    }
    load()
  }, [channel])

  return (
    <div style={{padding: 20}}>
      <h1>Deals</h1>
      <div style={{marginBottom: 12}}>
        <label style={{marginRight: 8}}>Channel:</label>
        <select value={channel} onChange={(e) => setChannel(e.target.value)}>
          {CHANNELS.map((c) => (
            <option key={c} value={c}>
              {c === '' ? 'All' : c}
            </option>
          ))}
        </select>
      </div>

      <table style={{width: '100%', borderCollapse: 'collapse'}}>
        <thead>
          <tr>
            <th>Title</th>
            <th>Slug</th>
            <th>Priority</th>
            <th>Channels</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((d, i) => (
            <tr key={i}>
              <td>{d.title}</td>
              <td>{d.slug}</td>
              <td>{d.priority}</td>
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
