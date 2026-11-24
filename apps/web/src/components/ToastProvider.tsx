'use client';
import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ToastContextValue {
  showToast: (message: string, type?: Toast['type']) => void;
}

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} });

export function useToast(): ToastContextValue {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        style={{
          position: 'fixed',
          bottom: 'var(--spacing-az-xl)',
          right: 'var(--spacing-az-xl)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--spacing-az-sm)',
        }}
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            onClick={() => removeToast(toast.id)}
            style={{
              padding: 'var(--spacing-az-md) var(--spacing-az-gutter)',
              borderRadius: 'var(--radius-az-card)',
              backgroundColor:
                toast.type === 'error'
                  ? 'var(--color-az-scarlet)'
                  : toast.type === 'success'
                    ? 'var(--color-az-success-600)'
                    : 'var(--color-az-flame)',
              border: '1px solid color-mix(in srgb, var(--color-az-ink) 15%, transparent)',
              color: 'var(--color-az-ink)',
              boxShadow: 'var(--shadow-az-lifted)',
              fontSize: 'var(--text-az-body)',
              fontWeight: 500,
              cursor: 'pointer',
              animation: 'fadeIn 0.2s ease',
              backdropFilter: 'blur(var(--blur-az-glass))',
            }}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export default ToastProvider;
