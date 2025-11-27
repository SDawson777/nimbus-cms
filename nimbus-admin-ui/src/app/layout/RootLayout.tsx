import React from 'react'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

export default function RootLayout({children}:{children:React.ReactNode}){
  return (
    <div style={{display:'flex',minHeight:'100vh'}}>
      <Sidebar />
      <div style={{flex:1,display:'flex',flexDirection:'column'}}>
        <Topbar />
        <main style={{flex:1,background:'#F9FAFB'}}>{children}</main>
      </div>
    </div>
  )
}
