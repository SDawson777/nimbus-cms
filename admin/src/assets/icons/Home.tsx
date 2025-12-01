import React from 'react'
export default function Home({size=20}:{size?:number}){
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11l9-8 9 8"/>
      <path d="M5 12v8h14v-8"/>
    </svg>
  )
}
