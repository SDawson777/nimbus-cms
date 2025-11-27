import React from 'react'
export default function Chart({size=20}:{size?:number}){
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 3v18h18M7 15l4-4 3 3 5-7"/>
    </svg>
  )
}
