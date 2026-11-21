import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { AlertTriangle, AlertCircle, Info, ShieldCheck, X } from 'lucide-react';

export type ConfirmVariant = 'danger' | 'warning' | 'info';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmVariant;
  isDualControl?: boolean;
  dualControlNote?: string;
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
    danger: <AlertTriangle className="w-5 h-5 text-rose-400" />,
    warning: <AlertCircle className="w-5 h-5 text-amber-400" />,
    info: <Info className="w-5 h-5 text-blue-400" />,
  };

  const CONFIRM_BTN_STYLES = {
    danger: 'bg-rose-600 hover:bg-rose-500 text-white',
    warning: 'bg-amber-600 hover:bg-amber-500 text-white',
    info: 'bg-blue-600 hover:bg-blue-500 text-white',
  };

  return (
    <ConfirmContext.Provider value={{ confirm, alert }}>
      {children}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div
            className="w-full max-w-md rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl p-6 overflow-hidden animate-scale-in"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-xl border ${
                    variant === 'danger'
                      ? 'bg-rose-500/10 border-rose-500/20'
                      : variant === 'warning'
                      ? 'bg-amber-500/10 border-amber-500/20'
                      : 'bg-blue-500/10 border-blue-500/20'
                  }`}
                >
                  {VARIANT_ICONS[variant]}
                </div>
                <h3
                  id="confirm-dialog-title"
                  className="text-lg font-semibold text-zinc-100"
                >
                  {options.title}
                </h3>
              </div>
              <button
                onClick={handleCancel}
                className="text-zinc-500 hover:text-zinc-300 p-1 rounded-lg transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-sm text-zinc-300 mb-5 leading-relaxed whitespace-pre-wrap">
              {options.message}
            </p>

            {options.isDualControl && (
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 mb-5">
                <ShieldCheck className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                <div>
                  <span className="font-semibold">Dual Control Required: </span>
                  {options.dualControlNote ||
                    'This action requires second-admin approval before execution. Submitting will create a pending authorization request.'}
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              {!isAlertOnly && (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 rounded-xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium transition-colors"
                >
                  {options.cancelText || 'Cancel'}
                </button>
              )}
              <button
                type="button"
                onClick={handleConfirm}
                autoFocus
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm ${
                  CONFIRM_BTN_STYLES[variant]
                }`}
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
