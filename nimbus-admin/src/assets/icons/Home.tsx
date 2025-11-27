import React from 'react'
export default function Home({size=20}:{size?:number}){
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 11l9-8 9 8M5 12v8h14v-8"/>
    </svg>
  )
}
