import React from 'react'
export default function Card({children}:{children:React.ReactNode}){
  return (
    <div style={{padding:24, borderRadius:8, boxShadow:'0 1px 2px rgba(0,0,0,0.06)', background:'#fff'}}>
      {children}
    </div>
  )
}
