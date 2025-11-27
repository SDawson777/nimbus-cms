import React from 'react'

type Tab = { id: string, label: string }

type Props = {
  tabs: Tab[]
  activeId: string
  onChange: (id: string) => void
}

export default function Tabs({tabs, activeId, onChange}:Props){
  return (
    <div style={{display:'flex', gap:8, borderBottom:'1px solid #E5E7EB', marginBottom:16}}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => onChange(t.id)} style={{
          padding:'10px 16px',
          border:'none',
          background:'transparent',
          borderBottom: activeId===t.id ? '2px solid #3F7AFC' : '2px solid transparent',
          color: activeId===t.id ? '#3F7AFC' : '#6B7280',
          fontWeight: activeId===t.id ? 600 : 400,
          cursor:'pointer'
        }}>{t.label}</button>
      ))}
    </div>
  )
}
