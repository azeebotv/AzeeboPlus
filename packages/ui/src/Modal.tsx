'use client';

import React, { useEffect, useCallback } from 'react';

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
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closeOnEscape) {
        onClose();
      }
    },
    [onClose, closeOnEscape],
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleEscape]);

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
        className={`
          relative w-full ${sizeStyles[size]} bg-bg-secondary rounded-xl shadow-2xl
          transform transition-all duration-300
          animate-in fade-in zoom-in-95
        `}
      >
        {/* Header */}
        {(title || description) && (
          <div className="px-6 pt-6 pb-4">
            {title && (
              <h2
                id="modal-title"
                className="text-xl font-semibold text-text-primary"
              >
                {title}
              </h2>
            )}
            {description && (
              <p
                id="modal-description"
                className="mt-1 text-sm text-text-secondary"
              >
                {description}
              </p>
            )}
          </div>
        )}

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-bg-tertiary transition-colors duration-200"
          aria-label="Close modal"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        {/* Body */}
        <div className="px-6 pb-6">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 bg-bg-tertiary rounded-b-xl border-t border-border-default">
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
            className="px-4 py-2 text-sm font-medium text-text-primary bg-bg-secondary border border-border-default rounded-lg hover:bg-bg-tertiary transition-colors duration-200"
          >
            {cancelLabel}
          </button>
          <button
            onClick={handleConfirm}
            className={`
              px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors duration-200
              ${variant === 'danger'
                ? 'bg-error-500 hover:bg-error-600'
                : 'bg-primary-500 hover:bg-primary-600'
              }
            `}
          >
            {confirmLabel}
          </button>
        </div>
      }
    >
      <p className="text-text-secondary">{description}</p>
    </Modal>
  );
}
