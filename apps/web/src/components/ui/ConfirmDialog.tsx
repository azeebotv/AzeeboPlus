'use client';
import { useRef, useEffect, useCallback } from 'react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  destructive?: boolean;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  destructive = false,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  const trapFocus = useCallback((e: KeyboardEvent) => {
    if (e.key !== 'Tab' || !dialogRef.current) return;
    const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }, []);

  useEffect(() => {
    if (open) {
      previousFocus.current = document.activeElement as HTMLElement;
      cancelRef.current?.focus();
      document.addEventListener('keydown', trapFocus);
    }
    return () => {
      document.removeEventListener('keydown', trapFocus);
      previousFocus.current?.focus();
    };
  }, [open, trapFocus]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    if (open) document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      ref={dialogRef}
      tabIndex={-1}
    >
      <div className="az-glass text-az-ink max-w-md w-full mx-4 p-6 transition-colors">
        <h2 id="confirm-title" className="az-title text-az-ink mb-2">
          {title}
        </h2>
        <p className="az-body text-az-ink-muted mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            ref={cancelRef}
            onClick={onCancel}
            className="min-h-[44px] px-5 py-2.5 text-sm font-medium text-az-ink/70 bg-az-glass-card rounded-xl hover:bg-az-ink/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-az-flame transition-colors inline-flex items-center justify-center"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`min-h-[44px] px-5 py-2.5 text-sm font-medium text-az-ink rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 transition-all inline-flex items-center justify-center ${
              destructive
                ? 'bg-az-error-500 hover:bg-az-error-600 focus-visible:ring-az-error-500'
                : 'bg-az-flame hover:bg-az-scarlet focus-visible:ring-az-flame'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
