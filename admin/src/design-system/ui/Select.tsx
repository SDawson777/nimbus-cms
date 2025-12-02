import React from 'react'

type Props = React.SelectHTMLAttributes<HTMLSelectElement> & {label?: string}
export default function Select({label, children, ...props}: Props) {
  return (
    <label style={{display: 'grid', gap: 6}}>
      {label && <span style={{fontSize: 12, color: 'var(--color-text-muted)'}}>{label}</span>}
      <select
        {...props}
        style={{
          padding: '8px 12px',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          background: 'var(--color-surface)',
          color: 'var(--color-text)',
        }}
      >
        {children}
      </select>
    </label>
  )
}
