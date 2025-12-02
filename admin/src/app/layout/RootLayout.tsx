import React from 'react'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import './layout.css'

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <div className="layout-root">
      <Sidebar />
      <div className="layout-main">
        <Topbar />
        <div className="layout-content">{children}</div>
      </div>
    </div>
  )
}
