import React from 'react'
import {NIMBUS_API_URL} from './config/api'

function Section({title}: {title: string}) {
  return (
    <div style={{padding: 16}}>
      <h2 style={{margin: 0}}>{title}</h2>
      <p style={{color: '#555'}}>Coming soon…</p>
    </div>
  )
}

export default function App() {
  return (
    <div style={{display: 'flex', minHeight: '100vh', fontFamily: 'system-ui, -apple-system'}}>
      <aside
        style={{
          width: 240,
          background: '#0f172a',
          color: '#fff',
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        <div style={{fontWeight: 700, fontSize: 18}}>Nimbus Admin</div>
        <nav style={{display: 'grid', gap: 6}}>
          <a href="#content" style={{color: '#fff', textDecoration: 'none'}}>Content</a>
          <a href="#deals" style={{color: '#fff', textDecoration: 'none'}}>Deals</a>
          <a href="#legal" style={{color: '#fff', textDecoration: 'none'}}>Legal</a>
          <a href="#tenants" style={{color: '#fff', textDecoration: 'none'}}>Tenants</a>
          <a href="#settings" style={{color: '#fff', textDecoration: 'none'}}>Settings</a>
        </nav>
        <div style={{marginTop: 'auto', fontSize: 12, opacity: 0.8}}>
          API: {NIMBUS_API_URL || 'VITE_NIMBUS_API_URL not set'}
        </div>
      </aside>
      <main style={{flex: 1}}>
        <header
          style={{
            padding: 16,
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <h1 style={{margin: 0}}>Dashboard</h1>
          <div style={{fontSize: 12, color: '#666'}}>Nimbus CMS</div>
        </header>
        <section id="content"><Section title="Content" /></section>
        <section id="deals"><Section title="Deals" /></section>
        <section id="legal"><Section title="Legal" /></section>
        <section id="tenants"><Section title="Tenants" /></section>
        <section id="settings"><Section title="Settings" /></section>
      </main>
    </div>
  )
}
