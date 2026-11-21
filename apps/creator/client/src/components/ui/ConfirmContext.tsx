import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export type ConfirmVariant = 'danger' | 'warning' | 'info';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmVariant;
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  alert: (title: string, message: string) => Promise<void>;
}

const ConfirmContext = createContext<ConfirmContextType | null>(null);

export const ConfirmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    options: ConfirmOptions;
    isAlertOnly?: boolean;
  }>({
    isOpen: false,
    options: { title: '', message: '' },
    isAlertOnly: false,
  });

  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setDialogState({
        isOpen: true,
        options: {
          confirmText: 'Confirm',
          cancelText: 'Cancel',
          variant: 'danger',
          ...options,
        },
        isAlertOnly: false,
      });
    });
  }, []);

  const alert = useCallback((title: string, message: string): Promise<void> => {
    return new Promise((resolve) => {
      resolverRef.current = () => resolve();
      setDialogState({
        isOpen: true,
        options: {
          title,
          message,
          confirmText: 'OK',
          variant: 'info',
        },
        isAlertOnly: true,
      });
    });
  }, []);

  const handleConfirm = () => {
    setDialogState((prev) => ({ ...prev, isOpen: false }));
    if (resolverRef.current) {
      resolverRef.current(true);
      resolverRef.current = null;
    }
  };

  const handleCancel = () => {
    setDialogState((prev) => ({ ...prev, isOpen: false }));
    if (resolverRef.current) {
      resolverRef.current(false);
      resolverRef.current = null;
    }
  };

  const { isOpen, options, isAlertOnly } = dialogState;
  const variant = options.variant || 'danger';

  const VARIANT_ICONS = {
    danger: <AlertTriangle size={20} color="var(--creator-red, #cc1c1c)" />,
    warning: <AlertCircle size={20} color="#f59e0b" />,
    info: <Info size={20} color="#3b82f6" />,
  };

  const CONFIRM_BTN_BACKGROUND = {
    danger: 'linear-gradient(135deg, #cc1c1c 0%, #991b1b 100%)',
    warning: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    info: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
  };

  return (
    <ConfirmContext.Provider value={{ confirm, alert }}>
      {children}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 440,
              borderRadius: 16,
              backgroundColor: 'var(--creator-surface, #18151e)',
              border: '1px solid var(--creator-border, rgba(255,255,255,0.08))',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              padding: 24,
              color: 'var(--creator-text, #f5f0eb)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    padding: 8,
                    borderRadius: 10,
                    backgroundColor: 'rgba(255,255,255,0.04)',
                    border: '1px solid var(--creator-border, rgba(255,255,255,0.08))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {VARIANT_ICONS[variant]}
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>
                  {options.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={handleCancel}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--creator-text-muted, #9a8a7a)',
                  cursor: 'pointer',
                  padding: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={18} />
              </button>
            </div>

            <p
              style={{
                fontSize: 14,
                lineHeight: 1.5,
                color: 'var(--creator-text-muted, #9a8a7a)',
                marginBottom: 24,
              }}
            >
              {options.message}
            </p>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12 }}>
              {!isAlertOnly && (
                <button
                  type="button"
                  onClick={handleCancel}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 500,
                    color: 'var(--creator-text, #f5f0eb)',
                    backgroundColor: 'transparent',
                    border: '1px solid var(--creator-border, rgba(255,255,255,0.08))',
                    cursor: 'pointer',
                  }}
                >
                  {options.cancelText || 'Cancel'}
                </button>
              )}
              <button
                type="button"
                onClick={handleConfirm}
                style={{
                  padding: '8px 18px',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#ffffff',
                  background: CONFIRM_BTN_BACKGROUND[variant],
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                {options.confirmText || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
};

export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) {
    // Graceful fallback for unit tests or bare rendering without ConfirmProvider
    return async (options: ConfirmOptions) => {
      if (typeof window !== 'undefined' && typeof window.confirm === 'function') {
        return window.confirm(options.message || options.title);
      }
      return true;
    };
  }
  return context.confirm;
};

export const useAlert = () => {
  const context = useContext(ConfirmContext);
  if (!context) {
    return async (title: string, message: string) => {
      if (typeof window !== 'undefined' && typeof window.alert === 'function') {
        window.alert(`${title}: ${message}`);
      }
    };
  }
  return context.alert;
};
