import React from 'react'
import {WorkspaceSelector} from '@/modules/tenants/TenantContext'
import {NIMBUS_API_URL} from '@/lib/api'

export default function Topbar(){
  return (
    <header style={{
      display:'flex',
      justifyContent:'space-between',
      alignItems:'center',
      padding:'12px 24px',
      borderBottom:'1px solid #E5E7EB',
      background:'white'
    }}>
      <div>
        <span style={{fontWeight:600,fontSize:16}}>Nimbus Admin</span>
      </div>
      <div style={{display:'flex',alignItems:'center',gap:16}}>
        <span style={{fontSize:12,color:'#6B7280'}}>
          API: {NIMBUS_API_URL || 'Not configured'}
        </span>
        <WorkspaceSelector />
      </div>
    </header>
  )
}
