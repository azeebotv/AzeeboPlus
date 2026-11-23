'use client';

import React, { useEffect, useRef } from 'react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  closeOnOverlayClick = true,
  closeOnEscape = true,
}: ModalProps) {
  const modalContentRef = useRef<HTMLDivElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    previousActiveElementRef.current = document.activeElement as HTMLElement | null;
    document.body.style.overflow = 'hidden';

    // Focus the first focusable element inside the modal
    const focusTimer = setTimeout(() => {
      if (modalContentRef.current) {
        const focusable = modalContentRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length > 0) {
          focusable[0].focus();
        } else {
          modalContentRef.current.focus();
        }
      }
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closeOnEscape) {
        onClose();
        return;
      }

      if (e.key === 'Tab' && modalContentRef.current) {
        const focusable = modalContentRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) {
          e.preventDefault();
          return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (
            document.activeElement === first ||
            !modalContentRef.current.contains(document.activeElement)
          ) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (
            document.activeElement === last ||
            !modalContentRef.current.contains(document.activeElement)
          ) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(focusTimer);
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
      if (
        previousActiveElementRef.current &&
        typeof previousActiveElementRef.current.focus === 'function'
      ) {
        previousActiveElementRef.current.focus();
      }
    };
  }, [isOpen, onClose, closeOnEscape]);

  if (!isOpen) return null;

  const sizeStyles = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-4xl',
  };

  return (
    <div
      className="fixed inset-0 z-modal flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
      aria-describedby={description ? 'modal-description' : undefined}
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={closeOnOverlayClick ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Modal Content */}
      <div
        ref={modalContentRef}
        tabIndex={-1}
        className={`
          relative w-full ${sizeStyles[size]} bg-az-surface-raised rounded-xl shadow-2xl
          transform transition-all duration-300
          animate-in fade-in zoom-in-95
          outline-none
        `}
      >
        {/* Header */}
        {(title || description) && (
          <div className="px-6 pt-6 pb-4">
            {title && (
              <h2 id="modal-title" className="text-xl font-semibold text-az-ink">
                {title}
              </h2>
            )}
            {description && (
              <p id="modal-description" className="mt-1 text-sm text-az-ink-dim">
                {description}
              </p>
            )}
          </div>
        )}

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-az-ink-muted hover:text-az-ink hover:bg-az-surface-panel transition-colors duration-200"
          aria-label="Close modal"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        {/* Body */}
        <div className="px-6 pb-6">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 bg-az-surface-panel rounded-b-xl border-t border-az-glass-border">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'danger';
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
}: ConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      size="sm"
      footer={
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-az-ink bg-az-surface-raised border border-az-glass-border rounded-lg hover:bg-az-surface-panel transition-colors duration-200"
          >
            {cancelLabel}
          </button>
          <button
            onClick={handleConfirm}
            className={`
              px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors duration-200
              ${
                variant === 'danger'
                  ? 'bg-az-error-600 hover:bg-az-error-700'
                  : 'bg-az-primary-500 hover:bg-az-primary-600'
              }
            `}
          >
            {confirmLabel}
          </button>
        </div>
      }
    >
      <p className="text-az-ink-dim">{description}</p>
    </Modal>
  );
}

export interface StoryBranchOption {
  id: string;
  label: string;
  description?: string;
  icon?: string;
  targetEpisodeId?: string;
  targetPathId?: string;
}

export interface BranchingDecisionModalProps {
  isOpen: boolean;
  title: string;
  prompt: string;
  options: StoryBranchOption[];
  onSelectOption: (option: StoryBranchOption) => void;
  countdownSeconds?: number;
  onTimeout?: () => void;
}

export function BranchingDecisionModal({
  isOpen,
  title,
  prompt,
  options,
  onSelectOption,
  countdownSeconds = 15,
  onTimeout,
}: BranchingDecisionModalProps) {
  const [secondsRemaining, setSecondsRemaining] = React.useState(countdownSeconds);

  React.useEffect(() => {
    if (!isOpen) {
      setSecondsRemaining(countdownSeconds);
      return;
    }
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onTimeout?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, countdownSeconds, onTimeout]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-modal flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-300"
      role="dialog"
      aria-modal="true"
      aria-labelledby="branching-title"
    >
      <div className="relative w-full max-w-lg bg-az-surface-raised border border-az-warning-500/40 rounded-2xl shadow-2xl p-6 text-center">
        {/* Countdown pill */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-az-warning-500/20 text-az-warning-400 text-xs font-bold mb-4 border border-az-warning-500/30">
          <span>⏳ DECISION REQUIRED</span>
          <span className="font-mono text-sm">({secondsRemaining}s)</span>
        </div>

        <h2 id="branching-title" className="text-2xl font-black text-az-ink tracking-tight mb-2">
          {title}
        </h2>
        <p className="text-sm text-az-ink-dim leading-relaxed mb-6">
          {prompt}
        </p>

        {/* Options grid */}
        <div className="grid grid-cols-1 gap-3">
          {options.map((option) => (
            <button
              key={option.id}
              onClick={() => onSelectOption(option)}
              className="group relative flex items-center justify-between p-4 rounded-xl border border-az-glass-border bg-az-glass-fill hover:bg-az-warning-500/10 hover:border-az-warning-500/50 transition-all text-left outline-none focus-visible:ring-2 focus-visible:ring-az-warning-400"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{option.icon || '⚔️'}</span>
                <div>
                  <h3 className="font-bold text-az-ink group-hover:text-az-warning-400 transition-colors text-sm sm:text-base">
                    {option.label}
                  </h3>
                  {option.description && (
                    <p className="text-xs text-az-ink-dim mt-0.5">{option.description}</p>
                  )}
                </div>
              </div>
              <span className="text-az-ink-muted group-hover:text-az-warning-400 transition-colors text-lg font-bold">
                →
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

