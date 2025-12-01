import React from 'react'

type Props = React.InputHTMLAttributes<HTMLInputElement> & { label?: string, hint?: string }
export default function Input({label, hint, ...props}:Props){
  return (
    <label style={{display:'grid', gap:6}}>
      {label && <span style={{fontSize:12, color:'var(--color-text-muted)'}}>{label}</span>}
      <input {...props} style={{
        padding:'8px 12px',
        border:'1px solid var(--color-border)',
        borderRadius:'var(--radius-md)',
        background:'var(--color-surface)',
        color:'var(--color-text)'
      }} />
      {hint && <span style={{fontSize:12, color:'var(--color-text-muted)'}}>{hint}</span>}
    </label>
  )
}
