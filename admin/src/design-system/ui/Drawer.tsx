import React from 'react'

type Props = { open: boolean, side?: 'left'|'right', onClose: ()=>void, children: React.ReactNode }
export default function Drawer({open, side='right', onClose, children}:Props){
  if(!open) return null
  const pos = side==='right' ? {right:0} : {left:0}
  return (
    <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.3)'}} onClick={onClose}>
      <div style={{position:'absolute', top:0, bottom:0, width:'min(420px, 90vw)', background:'var(--color-surface)', ...pos}} onClick={e=>e.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}
