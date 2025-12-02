import React, {useState} from 'react'

type Item = {id: string; label: string}

type Props = {items: Item[]; onSelect: (id: string) => void; buttonLabel?: string}
export default function Dropdown({items, onSelect, buttonLabel = 'Menu'}: Props) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{position: 'relative', display: 'inline-block'}}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          padding: '6px 10px',
          border: '1px solid var(--color-border)',
          background: 'var(--color-surface)',
          borderRadius: 'var(--radius-md)',
        }}
      >
        {buttonLabel}
      </button>
      {open && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--elevation-sm)',
          }}
        >
          {items.map((i) => (
            <button
              key={i.id}
              onClick={() => {
                onSelect(i.id)
                setOpen(false)
              }}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '8px 12px',
                border: 'none',
                background: 'transparent',
              }}
            >
              {i.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
