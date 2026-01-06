import React, { useMemo, useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Articles from "./pages/Articles";
import Faqs from "./pages/Faqs";
import Legal from "./pages/Legal";
import Analytics from "./pages/Analytics";
import AnalyticsSettings from "./pages/AnalyticsSettings";
import Settings from "./pages/Settings";
import ThemePage from "./pages/Theme";
import Personalization from "./pages/Personalization";
import { AdminProvider, useAdmin } from "./lib/adminContext";
import { TenantProvider, WorkspaceSelector } from "./lib/tenantContext";
import { DatasetProvider, DatasetSelector } from "./lib/datasetContext";
import { AiChatWidget } from "./components/AiChatWidget";
import Deals from "./pages/Deals";
import Compliance from "./pages/Compliance";
import Admins from "./pages/Admins";
import ErrorBoundary from "./components/ErrorBoundary";
import { t } from "./lib/i18n";
import AppFooter from "./components/AppFooter";
import WelcomeBar from "./components/WelcomeBar";
import { NotificationProvider } from "./components/NotificationCenter";
import HeatmapPage from "./pages/Heatmap";
import UndoPage from "./pages/Undo";
import { AnimatePresence, motion } from "framer-motion";
import { initSentry } from "./lib/sentryInit";

function AppShell() {
  const { admin, loading, signOut } = useAdminGuard();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [navOpen, setNavOpen] = useState(false);
  const navRef = useRef(null);
  const navItems = useMemo(
    () => [
      { path: "/dashboard", label: "Dashboard" },
      { path: "/admins", label: "Admins" },
      { path: "/analytics", label: "Analytics" },
      { path: "/settings", label: "Settings" },
      { path: "/compliance", label: "Compliance" },
      { path: "/products", label: "Products" },
      { path: "/articles", label: "Articles" },
      { path: "/faqs", label: "FAQs" },
      { path: "/deals", label: "Deals" },
      { path: "/legal", label: "Legal" },
      { path: "/theme", label: "Theme" },
      { path: "/personalization", label: "Personalization" },
      { path: "/heatmap", label: "Heatmap" },
      { path: "/undo", label: "Undo" },
    ],
    [],
  );

  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    function onClick(e) {
      if (!navRef.current) return;
      if (!navRef.current.contains(e.target)) {
        setNavOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const isLogin = pathname === "/login";

  const handleLogout = () => {
    signOut();
    navigate("/login", { replace: true });
  };

  return (
    <div className="container" style={{ minHeight: "100vh", paddingTop: 8 }}>
      <div className="site-top site-header">
        <div className="brand">
          <div
            className="logo"
            style={{
              width: "140px",
              height: "var(--logo-height)",
              background: "linear-gradient(90deg, var(--accent), #3b82f6)",
              borderRadius: "0.5rem",
            }}
            aria-hidden="true"
          />
          <Link to="/" className="suite-title">
            {t('suite_title')}
          </Link>
        </div>
        {!isLogin && (
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
              <div
                className={`nav-menu__panel ${navOpen ? "is-open" : ""}`}
                role="menu"
              >
                <div className="nav-menu__grid">
                  {navItems.map((item) => {
                    const active = pathname.startsWith(item.path);
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`nav-menu__item ${active ? "is-active" : ""}`}
                        aria-current={active ? "page" : undefined}
                        role="menuitem"
                      >
                        <span className="nav-menu__label">{item.label}</span>
                        <span className="nav-menu__hint">Navigate</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
            {admin && (
              <button
                className="ghost"
                onClick={handleLogout}
                aria-label="Log out"
              >
                Log out
              </button>
            )}
          </div>
        )}
      </div>
      {!isLogin && admin && (
        <div className="banner-shell" aria-live="polite">
          <WelcomeBar />
          {process.env.NODE_ENV !== "production" && (
            <button
              style={{ marginLeft: 16, background: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5', borderRadius: 4, padding: '4px 12px', cursor: 'pointer' }}
              onClick={() => { throw new Error('Nimbus Admin test error'); }}
              title="Trigger a test error (dev only)"
              data-testid="debug-trigger-error"
            >
              Trigger Test Error
            </button>
          )}
        </div>
      )}
      <main style={{ flex: 1 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            style={{ height: "100%" }}
          >
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute
                    admin={admin}
                    loading={loading}
                    element={<Dashboard />}
                  />
                }
              />
              <Route
                path="/products"
                element={
                  <ProtectedRoute
                    admin={admin}
                    loading={loading}
                    element={<Products />}
                  />
                }
              />
              <Route
                path="/admins"
                element={
                  <ProtectedRoute admin={admin} loading={loading} element={<Admins />} />
                }
              />
              <Route
                path="/articles"
                element={
                  <ProtectedRoute
                    admin={admin}
                    loading={loading}
                    element={<Articles />}
                  />
                }
              />
              <Route
                path="/faqs"
                element={
                  <ProtectedRoute
                    admin={admin}
                    loading={loading}
                    element={<Faqs />}
                  />
                }
              />
              {/* Use statically imported components for Deals and Compliance to avoid require() */}
              <Route
                path="/deals"
                element={
                  <ProtectedRoute
                    admin={admin}
                    loading={loading}
                    element={<Deals />}
                  />
                }
              />
              <Route
                path="/compliance"
                element={
                  <ProtectedRoute
                    admin={admin}
                    loading={loading}
                    element={<Compliance />}
                  />
                }
              />
              <Route
                path="/legal"
                element={
                  <ProtectedRoute
                    admin={admin}
                    loading={loading}
                    element={<Legal />}
                  />
                }
              />
              <Route
                path="/analytics"
                element={
                  <ProtectedRoute
                    admin={admin}
                    loading={loading}
                    element={<Analytics />}
                  />
                }
              />
              <Route
                path="/heatmap"
                element={
                  <ProtectedRoute
                    admin={admin}
                    loading={loading}
                    element={<HeatmapPage />}
                  />
                }
              />
              <Route
                path="/undo"
                element={
                  <ProtectedRoute
                    admin={admin}
                    loading={loading}
                    element={<UndoPage />}
                  />
                }
              />
              <Route
                path="/analytics/settings"
                element={
                  <ProtectedRoute
                    admin={admin}
                    loading={loading}
                    element={<AnalyticsSettings />}
                  />
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute
                    admin={admin}
                    loading={loading}
                    element={<Settings />}
                  />
                }
              />
              <Route
                path="/theme"
                element={
                  <ProtectedRoute
                    admin={admin}
                    loading={loading}
                    element={<ThemePage />}
                  />
                }
              />
              <Route
                path="/personalization"
                element={
                  <ProtectedRoute
                    admin={admin}
                    loading={loading}
                    element={<Personalization />}
                  />
                }
              />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </main>
      <AiChatWidget />
      <AppFooter />
    </div>
  );
}

function useAdminGuard() {
  const { admin, loading, signOut } = useAdmin();
  return { admin, loading, signOut };
}

function ProtectedRoute({ element, admin, loading }) {
  const location = useLocation();
  if (loading) {
    return (
      <div className="card" style={{ margin: "2rem auto", maxWidth: 520 }}>
        {t('loading')}
      </div>
    );
  }
  if (!admin) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return element;
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </ErrorBoundary>
  );
}

// Initialize Sentry if configured (optional)
initSentry();

createRoot(document.getElementById("root")).render(
  <AdminProvider>
    <TenantProvider>
      <DatasetProvider>
        <NotificationProvider>
          <App />
        </NotificationProvider>
      </DatasetProvider>
    </TenantProvider>
  </AdminProvider>,
);
