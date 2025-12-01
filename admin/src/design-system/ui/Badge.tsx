import React from 'react'

type Props = { children: React.ReactNode, tone?: 'info'|'success'|'warn'|'error' }
export default function Badge({children, tone='info'}:Props){
  const bg = tone==='success' ? 'var(--color-success)' : tone==='warn' ? 'var(--color-warn)' : tone==='error' ? 'var(--color-error)' : 'var(--color-muted)'
  return <span style={{display:'inline-block', padding:'2px 8px', borderRadius:999, background:bg, color:'white', fontSize:12}}>{children}</span>
}
