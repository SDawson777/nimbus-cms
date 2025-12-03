import React, {useEffect, useState} from 'react'
import {apiJson} from '../lib/api'

const CHANNELS = ['', 'mobile', 'web', 'kiosk', 'email', 'ads']

export default function Faqs() {
  const [groups, setGroups] = useState([])
  const [channel, setChannel] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const q = channel
          ? `/api/admin/faqs?channel=${encodeURIComponent(channel)}`
          : '/api/admin/faqs'
        const {ok, data} = await apiJson(q, {}, [])
        if (ok) {
          setGroups(Array.isArray(data) ? data : [])
        }
      } catch (err) {
        console.error(err)
      }
    }
    load()
  }, [channel])

  return (
    <div style={{padding: 20}}>
      <h1>FAQ Groups</h1>
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
            <th>Group</th>
            <th>Items</th>
            <th>Channels</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {groups.map((g) => {
            // derive channels from items if present
            const itemChannels = new Set()
            ;(g.items || []).forEach((it) => {
              if (Array.isArray(it.channels) && it.channels.length) {
                it.channels.forEach((c) => itemChannels.add(c))
              } else {
                itemChannels.add('Global')
              }
            })
            const channelsDisplay = Array.from(itemChannels).join(', ')
            return (
              <tr key={g._id}>
                <td>{g.title}</td>
                <td>{(g.items || []).length}</td>
                <td>{channelsDisplay}</td>
                <td>
                  <a href="/studio" target="_blank" rel="noreferrer">
                    Open in Studio
                  </a>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
