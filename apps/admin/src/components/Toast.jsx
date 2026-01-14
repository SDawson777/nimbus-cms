import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

/**
 * Enterprise Toast Notification System
 * Provides user feedback for actions with automatic dismissal
 */

const ToastContext = createContext(null);

// Toast types with their styling
const TOAST_TYPES = {
  success: {
    icon: '✓',
    bg: 'linear-gradient(135deg, #059669, #10b981)',
    border: '#059669',
  },
  error: {
    icon: '✕',
    bg: 'linear-gradient(135deg, #dc2626, #ef4444)',
    border: '#dc2626',
  },
  warning: {
    icon: '⚠',
    bg: 'linear-gradient(135deg, #d97706, #f59e0b)',
    border: '#d97706',
  },
  info: {
    icon: 'ℹ',
    bg: 'linear-gradient(135deg, #2563eb, #3b82f6)',
    border: '#2563eb',
  },
  loading: {
    icon: '⟳',
    bg: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    border: '#6366f1',
  },
};

const DEFAULT_DURATION = 4000;
const MAX_TOASTS = 5;

let toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message, type = 'info', options = {}) => {
    const id = ++toastId;
    const duration = options.duration ?? DEFAULT_DURATION;
    const persistent = options.persistent === true;

    const newToast = {
      id,
      message,
      type,
      duration,
      persistent,
      action: options.action,
      actionLabel: options.actionLabel,
    };

    setToasts((prev) => {
      // Keep only the most recent toasts
      const updated = [...prev, newToast];
      if (updated.length > MAX_TOASTS) {
        return updated.slice(-MAX_TOASTS);
      }
      return updated;
    });

    // Auto-dismiss non-persistent toasts
    if (!persistent && duration > 0) {
      setTimeout(() => removeToast(id), duration);
    }

    return id;
  }, [removeToast]);

  const toast = useCallback((message, options) => addToast(message, 'info', options), [addToast]);
  toast.success = (message, options) => addToast(message, 'success', options);
  toast.error = (message, options) => addToast(message, 'error', options);
  toast.warning = (message, options) => addToast(message, 'warning', options);
  toast.info = (message, options) => addToast(message, 'info', options);
  toast.loading = (message, options) => addToast(message, 'loading', { ...options, persistent: true });
  toast.dismiss = removeToast;
  toast.dismissAll = () => setToasts([]);

  // Promise-based toast for async operations
  toast.promise = async (promise, messages) => {
    const id = toast.loading(messages.loading || 'Loading...');
    try {
      const result = await promise;
      removeToast(id);
      toast.success(messages.success || 'Success!');
      return result;
    } catch (error) {
      removeToast(id);
      toast.error(messages.error || error?.message || 'An error occurred');
      throw error;
    }
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

function ToastContainer({ toasts, onDismiss }) {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        maxWidth: '400px',
        pointerEvents: 'none',
      }}
      role="region"
      aria-label="Notifications"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastItem({ toast, onDismiss }) {
  const config = TOAST_TYPES[toast.type] || TOAST_TYPES.info;
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (toast.persistent || toast.duration <= 0) return;
    
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / toast.duration) * 100);
      setProgress(remaining);
      if (remaining <= 0) clearInterval(interval);
    }, 50);

    return () => clearInterval(interval);
  }, [toast.duration, toast.persistent]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      style={{
        background: config.bg,
        borderRadius: '12px',
        padding: '14px 18px',
        color: 'white',
        boxShadow: '0 10px 40px rgba(0,0,0,0.2), 0 4px 12px rgba(0,0,0,0.15)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        pointerEvents: 'auto',
        cursor: 'pointer',
        overflow: 'hidden',
        position: 'relative',
        minWidth: '280px',
      }}
      onClick={() => onDismiss(toast.id)}
      role="alert"
      aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
    >
      {/* Icon */}
      <span
        style={{
          fontSize: '18px',
          width: '28px',
          height: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(255,255,255,0.2)',
          borderRadius: '50%',
          flexShrink: 0,
          animation: toast.type === 'loading' ? 'spin 1s linear infinite' : undefined,
        }}
      >
        {config.icon}
      </span>

      {/* Message */}
      <span style={{ flex: 1, fontSize: '14px', fontWeight: 500, lineHeight: 1.4 }}>
        {toast.message}
      </span>

      {/* Action button */}
      {toast.action && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            toast.action();
            onDismiss(toast.id);
          }}
          style={{
            background: 'rgba(255,255,255,0.2)',
            border: 'none',
            borderRadius: '6px',
            padding: '6px 12px',
            color: 'white',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            textTransform: 'uppercase',
          }}
        >
          {toast.actionLabel || 'Undo'}
        </button>
      )}

      {/* Dismiss button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDismiss(toast.id);
        }}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'rgba(255,255,255,0.7)',
          cursor: 'pointer',
          padding: '4px',
          fontSize: '16px',
          lineHeight: 1,
        }}
        aria-label="Dismiss"
      >
        ×
      </button>

      {/* Progress bar */}
      {!toast.persistent && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            height: '3px',
            width: `${progress}%`,
            background: 'rgba(255,255,255,0.4)',
            transition: 'width 50ms linear',
          }}
        />
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </motion.div>
  );
}

export default { ToastProvider, useToast };
