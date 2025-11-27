import React from 'react'

type Props = { children: React.ReactNode, tone?: 'info'|'success'|'warn'|'error' }
export default function Badge({children, tone='info'}:Props){
  const colors = {
    info: {bg:'#DBEAFE',color:'#1E40AF'},
    success: {bg:'#D1FAE5',color:'#065F46'},
    warn: {bg:'#FEF3C7',color:'#92400E'},
    error: {bg:'#FEE2E2',color:'#991B1B'}
  }
  const c = colors[tone]
  return <span style={{display:'inline-block', padding:'2px 8px', borderRadius:12, background:c.bg, color:c.color, fontSize:12, fontWeight:500}}>{children}</span>
}
