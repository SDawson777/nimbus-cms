import React from 'react'

type Props = React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }
export default function Select({label, children, ...props}:Props){
  return (
    <label style={{display:'grid', gap:6}}>
      {label && <span style={{fontSize:14, fontWeight:500}}>{label}</span>}
      <select {...props} style={{
        padding:'8px 12px',
        border:'1px solid #D1D5DB',
        borderRadius:6,
        fontSize:14,
        background:'white'
      }}>
        {children}
      </select>
    </label>
  )
}
