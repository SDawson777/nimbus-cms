import React from 'react'

type Props = React.InputHTMLAttributes<HTMLInputElement> & { label?: string, hint?: string, error?: string }
export default function Input({label, hint, error, ...props}:Props){
  return (
    <label style={{display:'grid', gap:6}}>
      {label && <span style={{fontSize:14, fontWeight:500}}>{label}</span>}
      <input {...props} style={{
        padding:'8px 12px',
        border:'1px solid #D1D5DB',
        borderRadius:6,
        fontSize:14,
        outline:'none'
      }} />
      {hint && <span style={{fontSize:12, color:'#6B7280'}}>{hint}</span>}
      {error && <span style={{fontSize:12, color:'#EF4444'}}>{error}</span>}
    </label>
  )
}
