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
import ThemePage from './pages/Theme'
import Personalization from './pages/Personalization'
import {AdminProvider} from './lib/adminContext'

function App() {
  return (
    <BrowserRouter>
      <div className="container" style={{minHeight: '100vh', paddingTop: 8}}>
        <div className="site-top site-header">
          <div className="brand">
            <div
              className="logo"
              style={{
                width: '140px',
                height: 'var(--logo-height)',
                background: 'linear-gradient(90deg, var(--accent), #3b82f6)',
              }}
            />
          </div>
          <nav className="nav" aria-label="Main navigation">
            <Link to="/dashboard" className="card">
              Dashboard
            </Link>
            <Link to="/analytics" className="card">
              Analytics
            </Link>
            <Link to="/analytics/settings" className="card">
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
            <Route path="/deals" element={React.createElement(require('./pages/Deals').default)} />
            <Route path="/legal" element={<Legal />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/analytics/settings" element={<AnalyticsSettings />} />
            <Route
              path="/compliance"
              element={React.createElement(require('./pages/Compliance').default)}
            />
            <Route path="/theme" element={<ThemePage />} />
            <Route path="/personalization" element={<Personalization />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

createRoot(document.getElementById('root')).render(
  <AdminProvider>
    <App />
  </AdminProvider>,
)
