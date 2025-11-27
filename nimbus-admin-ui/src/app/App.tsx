import React from 'react'
import {BrowserRouter} from 'react-router-dom'
import {TenantProvider} from '@/modules/tenants/TenantContext'
import RootLayout from './layout/RootLayout'
import RoutesView from './routes'

export default function App() {
  return (
    <TenantProvider>
      <BrowserRouter>
        <RootLayout>
          <RoutesView />
        </RootLayout>
      </BrowserRouter>
    </TenantProvider>
  )
}
