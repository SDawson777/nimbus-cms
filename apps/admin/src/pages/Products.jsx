import React, {useEffect, useState} from 'react'
import {apiJson} from '../lib/api'

export default function Products() {
  const [items, setItems] = useState([])
  const [showRecalled, setShowRecalled] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const q = showRecalled ? '/api/admin/products?includeRecalled=true' : '/api/admin/products'
        const {data, ok} = await apiJson(q, {}, [])
        if (ok) {
          setItems(Array.isArray(data) ? data : [])
        }
      } catch (err) {
        console.error(err)
      }
    }
    load()
  }, [showRecalled])

  return (
    <div style={{padding: 20}}>
      <h1>Products</h1>
      <div style={{marginBottom: 12}}>
        <label style={{marginRight: 8}}>Show recalled:</label>
        <input
          type="checkbox"
          checked={showRecalled}
          onChange={(e) => setShowRecalled(e.target.checked)}
        />
      </div>
      <table style={{width: '100%', borderCollapse: 'collapse'}}>
        <thead>
          <tr>
            <th>Id</th>
            <th>Name</th>
            <th>Slug</th>
            <th>Price</th>
            <th>Type</th>
            <th>Recalled</th>
          </tr>
        </thead>
        <tbody>
          {items.map((p) => (
            <tr key={p.__id}>
              <td>{p.__id}</td>
              <td>{p.name}</td>
              <td>{p.slug}</td>
              <td>{p.price}</td>
              <td>{p.type}</td>
              <td>{p.isRecalled ? 'Yes' : 'No'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
