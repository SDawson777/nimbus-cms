import React, {createContext, useContext, useEffect, useMemo, useState, useCallback} from 'react'
import {apiJson} from './api'
import {safeJson} from './safeJson'

const ROLE_ORDER = {
  OWNER: 6,
  ORG_ADMIN: 5,
  BRAND_ADMIN: 4,
  STORE_MANAGER: 3,
  EDITOR: 2,
  VIEWER: 1,
}

const LOCAL_ADMIN_KEY = 'nimbus_admin_local_admin'

const AdminContext = createContext({
  admin: null,
  loading: true,
  error: null,
  capabilities: {},
  refresh: () => Promise.resolve(),
  setLocalAdmin: () => {},
  signOut: () => {},
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

  const loadLocalAdmin = useCallback(() => {
    try {
      return JSON.parse(localStorage.getItem(LOCAL_ADMIN_KEY) || 'null')
    } catch (err) {
      return null
    }
  }, [])

  const persistLocalAdmin = useCallback((adminRecord) => {
    try {
      if (adminRecord) {
        localStorage.setItem(LOCAL_ADMIN_KEY, JSON.stringify(adminRecord))
      } else {
        localStorage.removeItem(LOCAL_ADMIN_KEY)
      }
    } catch (err) {
      // ignore storage failures in hardened environments
    }
  }, [])

  const loadAdmin = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const {ok, data, response} = await apiJson('/admin/me', {}, {})
      if (!ok) {
        if (response?.status === 401) {
          const localAdmin = loadLocalAdmin()
          setAdmin(localAdmin)
          setError(null)
        } else {
          const body = await safeJson(response, {})
          setError(body?.error || 'Unable to fetch admin metadata')
        }
        return
      }
      setAdmin(data?.admin || null)
    } catch (err) {
      const localAdmin = loadLocalAdmin()
      if (localAdmin) {
        setAdmin(localAdmin)
        setError(null)
      } else {
        setError('Network error while loading admin metadata')
        setAdmin(null)
      }
    } finally {
      setLoading(false)
    }
  }, [loadLocalAdmin])

  useEffect(() => {
    loadAdmin()
  }, [loadAdmin])

  const capabilities = useMemo(() => computeCapabilities(admin), [admin])

  const signOut = useCallback(() => {
    persistLocalAdmin(null)
    setAdmin(null)
  }, [persistLocalAdmin])

  const setLocalAdmin = useCallback(
    (adminRecord) => {
      persistLocalAdmin(adminRecord)
      setAdmin(adminRecord)
    },
    [persistLocalAdmin],
  )

  const value = useMemo(
    () => ({admin, loading, error, capabilities, refresh: loadAdmin, setLocalAdmin, signOut}),
    [admin, loading, error, capabilities, loadAdmin, setLocalAdmin, signOut],
  )

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
}

export function useAdmin() {
  return useContext(AdminContext)
}
