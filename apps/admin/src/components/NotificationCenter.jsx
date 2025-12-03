import React, {createContext, useContext, useMemo, useState} from 'react'
import {AnimatePresence, motion} from 'framer-motion'

const NotificationContext = createContext({notify: () => {}})

export function NotificationProvider({children}) {
  const [toasts, setToasts] = useState([])

  const notify = (toast) => {
    const id = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`
    const payload = {
      id,
      title: toast.title || 'Alert',
      body: toast.body || '',
      tone: toast.tone || 'info',
      ttl: toast.ttl || 4500,
    }
    setToasts((prev) => [...prev, payload])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, payload.ttl)
  }

  const value = useMemo(() => ({notify}), [])

  return (
    <NotificationContext.Provider value={value}>
      {children}
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
    </NotificationContext.Provider>
  )
}

export function useNotify() {
  return useContext(NotificationContext).notify
}
