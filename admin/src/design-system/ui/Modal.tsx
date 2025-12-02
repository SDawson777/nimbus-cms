import React from 'react'

type Props = {open: boolean; title?: string; onClose: () => void; children: React.ReactNode}
export default function Modal({open, title, onClose, children}: Props) {
  if (!open) return null
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.4)',
        display: 'grid',
        placeItems: 'center',
      }}
    >
      <div
        style={{
          width: 560,
          maxWidth: '90vw',
          background: 'var(--color-surface)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--elevation-md)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: 16,
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          <strong>{title}</strong>
          <button
            onClick={onClose}
            style={{border: 'none', background: 'transparent', cursor: 'pointer'}}
          >
            ✕
          </button>
        </div>
        <div style={{padding: 16}}>{children}</div>
      </div>
    </div>
  )
}
