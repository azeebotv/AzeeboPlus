'use client';

import { InputHTMLAttributes, forwardRef } from 'react';

interface AccessibleInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
}

// Shared-layer gap: `globals.css` ships no `.az-label--error` / `.az-input--error`
// modifier, and the unlayered sheet always beats a Tailwind `text-*` / `border-*`
// utility, so the error tint stays a token-valued inline declaration.
const ERROR_TINT = { color: 'var(--color-az-error-500)' } as const;
const ERROR_BORDER = { borderColor: 'var(--color-az-error-500)' } as const;

export const AccessibleInput = forwardRef<HTMLInputElement, AccessibleInputProps>(
  ({ label, error, helperText, id, ...props }, ref) => {
    const inputId = id || `input-${label.toLowerCase().replace(/\s+/g, '-')}`;
    const errorId = error ? `${inputId}-error` : undefined;
    const helperId = helperText ? `${inputId}-helper` : undefined;

    return (
      <div className="flex flex-col">
        <label htmlFor={inputId} className="az-label" style={error ? ERROR_TINT : undefined}>
          {label}
        </label>
        <input
          ref={ref}
          id={inputId}
          aria-invalid={!!error}
          aria-describedby={errorId || helperId}
          className="az-input"
          style={error ? ERROR_BORDER : undefined}
          {...props}
        />
        {error && (
          <span id={errorId} className="az-caption mt-1 text-az-error-500" role="alert">
            {error}
          </span>
        )}
        {helperText && !error && (
          <span id={helperId} className="az-caption mt-1 text-az-ink-muted">
            {helperText}
          </span>
        )}
      </div>
    );
  }
);

AccessibleInput.displayName = 'AccessibleInput';
