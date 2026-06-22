'use client';

import React, { useState, useCallback, createContext, useContext } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  success: (title: string, message?: string, duration?: number) => void;
  error: (title: string, message?: string, duration?: number) => void;
  warning: (title: string, message?: string, duration?: number) => void;
  info: (title: string, message?: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

let toastCounter = 0;

export function useToast(): ToastContextType {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (toast: Omit<Toast, 'id'>) => {
      const id = `toast-${++toastCounter}`;
      const newToast = { ...toast, id };
      setToasts((prev) => [...prev, newToast]);

      const duration = toast.duration ?? 3000;
      if (duration > 0) {
        setTimeout(() => removeToast(id), duration);
      }
    },
    [removeToast]
  );

  const success = useCallback(
    (title: string, message?: string, duration?: number) => {
      addToast({ type: 'success', title, message, duration });
    },
    [addToast]
  );

  const error = useCallback(
    (title: string, message?: string, duration?: number) => {
      addToast({ type: 'error', title, message, duration: duration ?? 5000 });
    },
    [addToast]
  );

  const warning = useCallback(
    (title: string, message?: string, duration?: number) => {
      addToast({ type: 'warning', title, message, duration });
    },
    [addToast]
  );

  const info = useCallback(
    (title: string, message?: string, duration?: number) => {
      addToast({ type: 'info', title, message, duration });
    },
    [addToast]
  );

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, success, error, warning, info }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}

function ToastContainer() {
  const { toasts, removeToast } = useToast();

  return (
    <div
      className="fixed top-4 right-4 z-toast flex flex-col gap-3 max-w-sm w-full pointer-events-none"
      aria-live="polite"
      aria-atomic="true"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const icons: Record<ToastType, React.ReactNode> = {
    success: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
    error: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    ),
    warning: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
    info: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    ),
  };

  const styles: Record<ToastType, string> = {
    success: 'bg-bg-secondary border-success-500/30',
    error: 'bg-bg-secondary border-error-500/30',
    warning: 'bg-bg-secondary border-warning-500/30',
    info: 'bg-bg-secondary border-primary-500/30',
  };

  const iconColors: Record<ToastType, string> = {
    success: 'text-success-400',
    error: 'text-error-400',
    warning: 'text-warning-400',
    info: 'text-primary-400',
  };

  return (
    <div
      className={`
        pointer-events-auto p-4 rounded-lg border shadow-lg
        transform transition-all duration-300 animate-in slide-in-from-right
        ${styles[toast.type]}
      `}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <div className={`flex-shrink-0 ${iconColors[toast.type]}`}>{icons[toast.type]}</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text-primary">{toast.title}</p>
          {toast.message && <p className="mt-1 text-sm text-text-secondary">{toast.message}</p>}
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 text-text-tertiary hover:text-text-primary transition-colors"
          aria-label="Dismiss notification"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
