import React from 'react'

export default function Dashboard() {
  return (
    <div style={{padding: 20}}>
      <h1>Dashboard</h1>
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12}}>
        <div style={{padding: 12, border: '1px solid #ddd'}}>Articles</div>
        <div style={{padding: 12, border: '1px solid #ddd'}}>FAQs</div>
        <div style={{padding: 12, border: '1px solid #ddd'}}>Legal</div>
      </div>
    </div>
  )
}
