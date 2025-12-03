import React from 'react'
import {createRoot} from 'react-dom/client'
import {BrowserRouter, Routes, Route, Navigate, Link} from 'react-router-dom'
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
import {AiChatWidget} from './components/AiChatWidget'
import Deals from './pages/Deals'
import Compliance from './pages/Compliance'

function App() {
  return (
    <BrowserRouter>
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
          <div style={{display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'flex-end'}}>
            <WorkspaceSelector />
          </div>
          <nav className="nav" aria-label="Main navigation">
            <Link to="/dashboard" className="card">
              Dashboard
            </Link>
            <Link to="/analytics" className="card">
              Analytics
            </Link>
            <Link to="/settings" className="card">
              Settings
            </Link>
            <Link to="/compliance" className="card">
              Compliance
            </Link>
            <Link to="/products" className="card">
              Products
            </Link>
            <Link to="/articles" className="card">
              Articles
            </Link>
            <Link to="/faqs" className="card">
              FAQs
            </Link>
            <Link to="/deals" className="card">
              Deals
            </Link>
            <Link to="/legal" className="card">
              Legal
            </Link>
            <Link to="/theme" className="card">
              Theme
            </Link>
            <Link to="/personalization" className="card">
              Personalization
            </Link>
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
    </BrowserRouter>
  )
}

createRoot(document.getElementById('root')).render(
  <AdminProvider>
    <TenantProvider>
      <App />
    </TenantProvider>
  </AdminProvider>,
)
