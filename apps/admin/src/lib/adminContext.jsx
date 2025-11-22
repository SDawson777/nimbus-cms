import React, {createContext, useContext, useEffect, useMemo, useState, useCallback} from 'react'

const ROLE_ORDER = {
  OWNER: 6,
  ORG_ADMIN: 5,
  BRAND_ADMIN: 4,
  STORE_MANAGER: 3,
  EDITOR: 2,
  VIEWER: 1,
}

const AdminContext = createContext({
  admin: null,
  loading: true,
  error: null,
  capabilities: {},
  refresh: () => Promise.resolve(),
})

function roleAtLeast(adminRole, minRole) {
  const current = ROLE_ORDER[adminRole] || 0
  const required = ROLE_ORDER[minRole] || Number.MAX_SAFE_INTEGER
  return current >= required
}

function computeCapabilities(admin) {
  const role = admin?.role || 'VIEWER'
  const scopes = {
    organizationSlug: admin?.organizationSlug || null,
    brandSlug: admin?.brandSlug || null,
    storeSlug: admin?.storeSlug || null,
  }
  return {
    role,
    scopes,
    canViewAnalytics: roleAtLeast(role, 'VIEWER'),
    canRefreshAnalytics: roleAtLeast(role, 'ORG_ADMIN'),
    canManageAnalyticsSettings: roleAtLeast(role, 'ORG_ADMIN'),
    canViewCompliance: roleAtLeast(role, 'ORG_ADMIN'),
    canRunComplianceSnapshot: roleAtLeast(role, 'ORG_ADMIN'),
    canEditTheme: roleAtLeast(role, 'EDITOR'),
    canUploadThemeAssets: roleAtLeast(role, 'EDITOR'),
    canDeleteThemeConfig: roleAtLeast(role, 'EDITOR'),
    canManagePersonalization: roleAtLeast(role, 'EDITOR'),
    canViewPersonalization: roleAtLeast(role, 'VIEWER'),
  }
}

export function AdminProvider({children}) {
  const [admin, setAdmin] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadAdmin = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/admin/me', {credentials: 'include'})
      if (!res.ok) {
        if (res.status === 401) {
          setAdmin(null)
          setError(null)
        } else {
          const body = await res.json().catch(() => ({}))
          setError(body.error || 'Unable to fetch admin metadata')
        }
        return
      }
      const payload = await res.json().catch(() => ({}))
      setAdmin(payload?.admin || null)
    } catch (err) {
      setError('Network error while loading admin metadata')
      setAdmin(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAdmin()
  }, [loadAdmin])

  const capabilities = useMemo(() => computeCapabilities(admin), [admin])

  const value = useMemo(
    () => ({admin, loading, error, capabilities, refresh: loadAdmin}),
    [admin, loading, error, capabilities, loadAdmin],
  )

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
}

export function useAdmin() {
  return useContext(AdminContext)
}
