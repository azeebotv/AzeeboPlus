'use client';

import { InputHTMLAttributes, forwardRef } from 'react';

interface AccessibleInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
}

export const AccessibleInput = forwardRef<HTMLInputElement, AccessibleInputProps>(
  ({ label, error, helperText, id, ...props }, ref) => {
    const inputId = id || `input-${label.toLowerCase().replace(/\s+/g, '-')}`;
    const errorId = error ? `${inputId}-error` : undefined;
    const helperId = helperText ? `${inputId}-helper` : undefined;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <label
          htmlFor={inputId}
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: error ? 'var(--brand-red)' : 'var(--text-primary)',
          }}
        >
          {label}
        </label>
        <input
          ref={ref}
          id={inputId}
          aria-invalid={!!error}
          aria-describedby={errorId || helperId}
          style={{
            padding: '12px 16px',
            borderRadius: 12,
            border: `1px solid ${error ? 'var(--brand-red)' : 'var(--glass-border)'}`,
            backgroundColor: 'var(--glass-bg)',
            color: 'var(--text-primary)',
            fontSize: 14,
            outline: 'none',
          }}
          {...props}
        />
        {error && (
          <span id={errorId} style={{ fontSize: 12, color: 'var(--brand-red)' }} role="alert">
            {error}
          </span>
        )}
        {helperText && !error && (
          <span id={helperId} style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {helperText}
          </span>
        )}
      </div>
    );
  }
);

AccessibleInput.displayName = 'AccessibleInput';
