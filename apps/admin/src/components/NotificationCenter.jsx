import React, {createContext, useContext, useMemo, useState, useEffect} from 'react'
import {AnimatePresence, motion} from 'framer-motion'
import {useAdmin} from '../lib/adminContext'
import {NotificationProvider as NotificationStoreProvider, useNotifications} from '../lib/notificationsContext'

const ToastContext = createContext({notify: () => {}})

function NotificationPortal({children}) {
  const {notifications, addNotification, markAllRead, clearAll} = useNotifications()
  const [toasts, setToasts] = useState([])
  const [open, setOpen] = useState(false)

  const notify = useMemo(
    () => (toast) => {
      const id = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`
      const tone = toast.tone || 'info'
      const payload = {
        id,
        title: toast.title || 'Alert',
        body: toast.body || '',
        tone,
        ttl: toast.ttl || 4500,
      }

      const normalizedType = ['success', 'warning', 'error'].includes(tone) ? tone : 'info'

      addNotification({
        type: normalizedType,
        title: payload.title,
        message: payload.body,
        read: false,
      })

      setToasts((prev) => [...prev, payload])
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, payload.ttl)
    },
    [addNotification],
  )

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications])

  useEffect(() => {
    if (open && unreadCount) {
      markAllRead()
    }
  }, [open, unreadCount, markAllRead])

  const value = useMemo(() => ({notify}), [notify])

  return (
    <ToastContext.Provider value={value}>
      {children}

      <button
        className="notification-toggle"
        aria-label="Open notification center"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        type="button"
      >
        <span aria-hidden="true">🔔</span>
        <span className="notification-toggle__label">Notifications</span>
        {unreadCount > 0 && <span className="notification-toggle__badge">{unreadCount}</span>}
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            className="notification-center"
            initial={{opacity: 0, y: 12}}
            animate={{opacity: 1, y: 0}}
            exit={{opacity: 0, y: 10}}
            transition={{duration: 0.2}}
            role="region"
            aria-label="Notification center"
          >
            <div className="notification-center__header">
              <div>
                <div className="notification-center__title">Notification Center</div>
                <div className="notification-center__subtitle">Persistent alerts and activity</div>
              </div>
              <div className="notification-center__actions">
                <button type="button" onClick={markAllRead} disabled={!notifications.length}>
                  Mark read
                </button>
                <button type="button" onClick={clearAll} disabled={!notifications.length}>
                  Clear
                </button>
              </div>
            </div>

            <div className="notification-center__list">
              {notifications.length === 0 && <div className="notification-empty">You're all caught up.</div>}
              {notifications.map((note) => (
                <div
                  key={note.id}
                  className={`notification-card ${note.read ? 'is-read' : 'is-unread'}`}
                  role="article"
                >
                  <div className="notification-card__row">
                    <div className="notification-pill" data-tone={note.type}>
                      {note.type === 'warning' ? 'Warning' : note.type.charAt(0).toUpperCase() + note.type.slice(1)}
                    </div>
                    <div className="notification-timestamp">
                      {new Date(note.createdAt).toLocaleString(undefined, {
                        hour: '2-digit',
                        minute: '2-digit',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>
                  </div>
                  <div className="notification-card__title">{note.title}</div>
                  {note.message && <div className="notification-card__body">{note.message}</div>}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="toast-stack" aria-live="polite" aria-atomic="true">
        <AnimatePresence initial={false}>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              className={`toast toast-${toast.tone}`}
              initial={{opacity: 0, y: 12}}
              animate={{opacity: 1, y: 0}}
              exit={{opacity: 0, y: 12}}
              transition={{duration: 0.2}}
              role="status"
            >
              <div className="toast-header">
                <strong>{toast.title}</strong>
                <button aria-label="Dismiss" onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}>
                  ×
                </button>
              </div>
              {toast.body && <p className="toast-body">{toast.body}</p>}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function NotificationProvider({children}) {
  const {admin} = useAdmin()
  const storageKey = admin?.email || admin?.id || admin?.name || 'guest'

  return (
    <NotificationStoreProvider storageKey={storageKey}>
      <NotificationPortal>{children}</NotificationPortal>
    </NotificationStoreProvider>
  )
}

export function useNotify() {
  return useContext(ToastContext).notify
}
