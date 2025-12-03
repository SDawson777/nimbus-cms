import React, {useMemo, useState, useEffect, useRef} from 'react'
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
import {AdminProvider, useAdmin} from './lib/adminContext'
import {TenantProvider, WorkspaceSelector} from './lib/tenantContext'
import {DatasetProvider, DatasetSelector} from './lib/datasetContext'
import {AiChatWidget} from './components/AiChatWidget'
import Deals from './pages/Deals'
import Compliance from './pages/Compliance'

function AppShell() {
  const {admin, loading} = useAdminGuard()
  const {pathname} = useLocation()
  const [navOpen, setNavOpen] = useState(false)
  const navRef = useRef(null)
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

  useEffect(() => {
    setNavOpen(false)
  }, [pathname])

  useEffect(() => {
    function onClick(e) {
      if (!navRef.current) return
      if (!navRef.current.contains(e.target)) {
        setNavOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

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
          <div className="brand-meta">
            <p className="brand-kicker">Nimbus CMS Suite</p>
            <p className="brand-sub">Enterprise control | real-time content | AI concierge</p>
          </div>
        </div>
        <div className="header-actions">
          <DatasetSelector />
          <WorkspaceSelector />
          <div className="nav-menu" ref={navRef}>
            <button
              className="nav-menu__trigger"
              aria-haspopup="true"
              aria-expanded={navOpen}
              onClick={() => setNavOpen((v) => !v)}
            >
              Suite Map
              <span aria-hidden="true">⌄</span>
            </button>
            <div className={`nav-menu__panel ${navOpen ? 'is-open' : ''}`} role="menu">
              <div className="nav-menu__grid">
                {navItems.map((item) => {
                  const active = pathname.startsWith(item.path)
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`nav-menu__item ${active ? 'is-active' : ''}`}
                      aria-current={active ? 'page' : undefined}
                      role="menuitem"
                    >
                      <span className="nav-menu__label">{item.label}</span>
                      <span className="nav-menu__hint">Navigate</span>
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
        <main style={{flex: 1}}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/dashboard"
              element={<ProtectedRoute admin={admin} loading={loading} element={<Dashboard />} />}
            />
            <Route
              path="/products"
              element={<ProtectedRoute admin={admin} loading={loading} element={<Products />} />}
            />
            <Route
              path="/articles"
              element={<ProtectedRoute admin={admin} loading={loading} element={<Articles />} />}
            />
            <Route
              path="/faqs"
              element={<ProtectedRoute admin={admin} loading={loading} element={<Faqs />} />}
            />
            {/* Use statically imported components for Deals and Compliance to avoid require() */}
            <Route
              path="/deals"
              element={<ProtectedRoute admin={admin} loading={loading} element={<Deals />} />}
            />
            <Route
              path="/compliance"
              element={<ProtectedRoute admin={admin} loading={loading} element={<Compliance />} />}
            />
            <Route
              path="/legal"
              element={<ProtectedRoute admin={admin} loading={loading} element={<Legal />} />}
            />
            <Route
              path="/analytics"
              element={<ProtectedRoute admin={admin} loading={loading} element={<Analytics />} />}
            />
            <Route
              path="/analytics/settings"
              element={
                <ProtectedRoute admin={admin} loading={loading} element={<AnalyticsSettings />} />
              }
            />
            <Route
              path="/settings"
              element={<ProtectedRoute admin={admin} loading={loading} element={<Settings />} />}
            />
            <Route
              path="/theme"
              element={<ProtectedRoute admin={admin} loading={loading} element={<ThemePage />} />}
            />
            <Route
              path="/personalization"
              element={
                <ProtectedRoute admin={admin} loading={loading} element={<Personalization />} />
              }
            />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
        <AiChatWidget />
      </div>
  )
}

function useAdminGuard() {
  const {admin, loading} = useAdmin()
  return {admin, loading}
}

function ProtectedRoute({element, admin, loading}) {
  const location = useLocation()
  if (loading) {
    return <div className="card" style={{margin: '2rem auto', maxWidth: 520}}>Loading…</div>
  }
  if (!admin) {
    return <Navigate to="/login" replace state={{from: location.pathname}} />
  }
  return element
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
