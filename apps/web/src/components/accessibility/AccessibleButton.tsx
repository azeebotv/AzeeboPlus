'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';

interface AccessibleButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  'aria-label': string;
  loading?: boolean;
}

export const AccessibleButton = forwardRef<HTMLButtonElement, AccessibleButtonProps>(
  ({ children, 'aria-label': ariaLabel, loading, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        aria-label={ariaLabel}
        aria-busy={loading}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                width: 16,
                height: 16,
                border: '2px solid currentColor',
                borderTopColor: 'transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
              }}
            />
            <span>Loading...</span>
          </span>
        ) : (
          children
        )}
      </button>
    );
  }
);

AccessibleButton.displayName = 'AccessibleButton';
