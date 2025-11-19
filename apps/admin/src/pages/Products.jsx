import React, {useEffect, useState} from 'react'

export default function Products() {
  const [items, setItems] = useState([])
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/admin/products', {credentials: 'include'})
        if (res.ok) {
          const j = await res.json()
          setItems(j)
        }
      } catch (err) {
        console.error(err)
      }
    }
    load()
  }, [])

  return (
    <div style={{padding: 20}}>
      <h1>Products</h1>
      <table style={{width: '100%', borderCollapse: 'collapse'}}>
        <thead>
          <tr>
            <th>Id</th>
            <th>Name</th>
            <th>Slug</th>
            <th>Price</th>
            <th>Type</th>
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
