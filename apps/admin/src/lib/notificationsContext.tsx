import React, {createContext, useContext, useEffect, useMemo, useState, useCallback, ReactNode} from "react"

export type AdminNotification = {
  id: string
  type: "info" | "success" | "warning" | "error"
  title: string
  message: string
  createdAt: string
  read?: boolean
}

type NotificationContextValue = {
  notifications: AdminNotification[]
  addNotification: (n: Omit<AdminNotification, "id" | "createdAt">) => void
  markAllRead: () => void
  clearAll: () => void
}

const NotificationContext = createContext<NotificationContextValue | null>(null)

const STORAGE_PREFIX = "NIMBUS_ADMIN_NOTIFICATIONS"

function storageKeyFor(adminKey?: string) {
  return adminKey ? `${STORAGE_PREFIX}:${adminKey}` : STORAGE_PREFIX
}

function loadFromStorage(key: string): AdminNotification[] {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch {
    return []
  }
}

function saveToStorage(key: string, list: AdminNotification[]) {
  try {
    localStorage.setItem(key, JSON.stringify(list))
  } catch {
    // ignore write failures
  }
}

export function NotificationProvider({children, storageKey}: {children: ReactNode; storageKey?: string}) {
  const [notifications, setNotifications] = useState<AdminNotification[]>(() => loadFromStorage(storageKeyFor(storageKey)))
  const key = useMemo(() => storageKeyFor(storageKey), [storageKey])

  useEffect(() => {
    setNotifications(loadFromStorage(key))
  }, [key])

  useEffect(() => {
    saveToStorage(key, notifications)
  }, [key, notifications])

  const addNotification: NotificationContextValue["addNotification"] = useCallback((n) => {
    const next: AdminNotification = {
      ...n,
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      createdAt: new Date().toISOString(),
      read: n.read ?? false,
    }
    setNotifications((prev) => [next, ...prev].slice(0, 100))
  }, [])

  const markAllRead = useCallback(
    () => setNotifications((prev) => prev.map((n) => ({...n, read: true}))),
    [],
  )

  const clearAll = useCallback(() => setNotifications([]), [])

  const value = useMemo(
    () => ({notifications, addNotification, markAllRead, clearAll}),
    [notifications, addNotification, markAllRead, clearAll],
  )

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}

export function useNotifications() {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error("useNotifications must be used within NotificationProvider")
  return ctx
}
