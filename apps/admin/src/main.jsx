import React, {useMemo} from 'react'
import {createRoot} from 'react-dom/client'
import {BrowserRouter, Routes, Route, Navigate, Link, useLocation} from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import Articles from './pages/Articles'
import Faqs from './pages/Faqs'
import Legal from './pages/Legal'
import Analytics from './pages/Analytics'
import AnalyticsSettings from './pages/AnalyticsSettings'
import Settings from './pages/Settings'
import ThemePage from './pages/Theme'
import Personalization from './pages/Personalization'
import {AdminProvider} from './lib/adminContext'
import {TenantProvider, WorkspaceSelector} from './lib/tenantContext'
import {DatasetProvider, DatasetSelector} from './lib/datasetContext'
import {AiChatWidget} from './components/AiChatWidget'
import Deals from './pages/Deals'
import Compliance from './pages/Compliance'

function AppShell() {
  const {pathname} = useLocation()
  const navItems = useMemo(
    () => [
      {path: '/dashboard', label: 'Dashboard'},
      {path: '/analytics', label: 'Analytics'},
      {path: '/settings', label: 'Settings'},
      {path: '/compliance', label: 'Compliance'},
      {path: '/products', label: 'Products'},
      {path: '/articles', label: 'Articles'},
      {path: '/faqs', label: 'FAQs'},
      {path: '/deals', label: 'Deals'},
      {path: '/legal', label: 'Legal'},
      {path: '/theme', label: 'Theme'},
      {path: '/personalization', label: 'Personalization'},
    ],
    [],
  )
  return (
    <div className="container" style={{minHeight: '100vh', paddingTop: 8}}>
      <div className="site-top site-header">
          <div className="brand">
            <div
              className="logo"
              style={{
                width: '160px',
                height: 'var(--logo-height)',
                background: 'var(--accent)',
                borderRadius: '999px',
                boxShadow: '0 0 40px rgba(124, 58, 237, 0.45)',
              }}
            />
          </div>
          <div style={{display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'flex-end'}}>
            <DatasetSelector />
            <WorkspaceSelector />
          </div>
          <nav className="nav" aria-label="Main navigation">
            {navItems.map((item) => {
              const active = pathname.startsWith(item.path)
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`card nav-link ${active ? 'active' : ''}`}
                  aria-current={active ? 'page' : undefined}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>
        <main style={{flex: 1}}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/products" element={<Products />} />
            <Route path="/articles" element={<Articles />} />
            <Route path="/faqs" element={<Faqs />} />
            {/* Use statically imported components for Deals and Compliance to avoid require() */}
            <Route path="/deals" element={<Deals />} />
            <Route path="/compliance" element={<Compliance />} />
            <Route path="/legal" element={<Legal />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/analytics/settings" element={<AnalyticsSettings />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/theme" element={<ThemePage />} />
            <Route path="/personalization" element={<Personalization />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
        <AiChatWidget />
      </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  )
}

createRoot(document.getElementById('root')).render(
  <AdminProvider>
    <TenantProvider>
      <DatasetProvider>
        <App />
      </DatasetProvider>
    </TenantProvider>
  </AdminProvider>,
);
