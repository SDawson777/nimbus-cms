import React from 'react'

type Props = { open: boolean, title?: string, onClose: ()=>void, children: React.ReactNode }
export default function Modal({open, title, onClose, children}:Props){
  if(!open) return null
  return (
    <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'grid', placeItems:'center', zIndex:1000}} onClick={onClose}>
      <div style={{width:560, maxWidth:'90vw', background:'white', borderRadius:8, boxShadow:'0 20px 25px -5px rgba(0,0,0,0.1)'}} onClick={e=>e.stopPropagation()}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:16, borderBottom:'1px solid #E5E7EB'}}>
          <strong style={{fontSize:18}}>{title}</strong>
          <button onClick={onClose} style={{border:'none', background:'transparent', fontSize:24, cursor:'pointer', lineHeight:1}}>×</button>
        </div>
        <div style={{padding:16}}>{children}</div>
      </div>
    </div>
  )
}
