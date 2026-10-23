import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 7);
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
    return id;
  }, [removeToast]);

  const toast = {
    success: (msg, duration) => addToast(msg, 'success', duration),
    error: (msg, duration) => addToast(msg, 'error', duration || 5000),
    warning: (msg, duration) => addToast(msg, 'warning', duration),
    info: (msg, duration) => addToast(msg, 'info', duration),
  };

  return (
    <ToastContext.Provider value={{ toast, addToast, removeToast }}>
      {children}
      {/* Toast Notification Container */}
      <div
        className="toast-container"
        style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          zIndex: 99999,
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          pointerEvents: 'none',
          maxWidth: '420px',
          width: 'calc(100% - 48px)'
        }}
        role="region"
        aria-live="polite"
        aria-label="System notifications"
      >
        {toasts.map((t) => {
          let bg = 'var(--surface)';
          let border = 'var(--border-subtle)';
          let iconColor = 'var(--primary)';
          let Icon = Info;

          if (t.type === 'success') {
            border = 'rgba(16, 185, 129, 0.4)';
            iconColor = '#10b981';
            Icon = CheckCircle2;
          } else if (t.type === 'error') {
            border = 'rgba(239, 68, 68, 0.4)';
            iconColor = '#ef4444';
            Icon = AlertCircle;
          } else if (t.type === 'warning') {
            border = 'rgba(245, 158, 11, 0.4)';
            iconColor = '#f59e0b';
            Icon = AlertTriangle;
          }

          return (
            <div
              key={t.id}
              className="toast-card glass-card animate-slide-in"
              style={{
                pointerEvents: 'auto',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '14px 16px',
                borderRadius: '12px',
                background: 'var(--surface-overlay, #ffffff)',
                border: `1px solid ${border}`,
                boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
                color: 'var(--text-main)',
                fontSize: '0.9rem',
                lineHeight: 1.4
              }}
            >
              <Icon size={20} style={{ color: iconColor, flexShrink: 0, marginTop: '2px' }} />
              <div style={{ flex: 1, wordBreak: 'break-word', fontWeight: 500 }}>
                {t.message}
              </div>
              <button
                onClick={() => removeToast(t.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: '4px'
                }}
                aria-label="Dismiss toast"
              >
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    const fallbackToast = {
      success: (m) => console.log('[SUCCESS]', m),
      error: (m) => console.error('[ERROR]', m),
      warning: (m) => console.warn('[WARN]', m),
      info: (m) => console.log('[INFO]', m)
    };
    return {
      toast: fallbackToast,
      ...fallbackToast,
      addToast: () => {},
      removeToast: () => {}
    };
  }
  return {
    ...context,
    ...context.toast,
  };
};

export default ToastContext;
