type AlertProps = {
  variant?: 'error' | 'success';
  children: React.ReactNode;
};

/** Dark-glass-themed inline alert for auth forms. */
export function Alert({ variant = 'error', children }: AlertProps): React.JSX.Element {
  const color = variant === 'success' ? '#22c55e' : '#CC1C1C';
  return (
    <div
      role="alert"
      style={{
        background: variant === 'success' ? 'rgba(34,197,94,0.12)' : 'rgba(204,28,28,0.14)',
        border: `1px solid ${color}`,
        borderRadius: 10,
        padding: '0.7rem 0.9rem',
      }}
    >
      <p style={{ color, fontSize: '0.85rem', fontWeight: 600 }}>{children}</p>
    </div>
  );
}

type SpinnerProps = { className?: string };

/** Small white spinner for inline button loading states. */
export function Spinner({ className = '' }: SpinnerProps): React.JSX.Element {
  return (
    <svg
      className={`animate-spin ${className}`}
      style={{ width: 16, height: 16 }}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

type SubmitButtonProps = {
  isLoading: boolean;
  children: React.ReactNode;
  loadingLabel: string;
};

/** Primary brand pill button with spinner loading state. */
export function SubmitButton({
  isLoading,
  children,
  loadingLabel,
}: SubmitButtonProps): React.JSX.Element {
  return (
    <button type="submit" className="az-btn-primary" disabled={isLoading}>
      {isLoading ? (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
          <Spinner /> {loadingLabel}
        </span>
      ) : (
        children
      )}
    </button>
  );
}
