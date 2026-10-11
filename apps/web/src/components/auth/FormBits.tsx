import type { LucideIcon } from 'lucide-react';

type AlertProps = {
  variant?: 'error' | 'success';
  children: React.ReactNode;
};

/** Dark-glass-themed inline alert for auth forms. */
export function Alert({ variant = 'error', children }: AlertProps): React.JSX.Element {
  const tone =
    variant === 'success'
      ? 'border-az-success-500 bg-az-success-500/12 text-az-success-500'
      : 'border-az-scarlet bg-az-scarlet/14 text-az-scarlet';
  return (
    <div role="alert" className={`rounded-az-control border px-3.5 py-2.5 ${tone}`}>
      <p className="az-body-strong">{children}</p>
    </div>
  );
}

type SpinnerProps = { className?: string };

/** Small white spinner for inline button loading states. */
export function Spinner({ className = 'size-4' }: SpinnerProps): React.JSX.Element {
  return (
    <svg
      className={`animate-spin ${className}`}
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
        <span className="inline-flex items-center gap-2">
          <Spinner /> {loadingLabel}
        </span>
      ) : (
        children
      )}
    </button>
  );
}

type AuthFieldProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'id' | 'placeholder'> & {
  id: string;
  /** Doubles as the accessible name and the in-field prompt, as Figma draws it. */
  label: string;
  icon: LucideIcon;
  trailing?: React.ReactNode;
};

/** Frosted input with a leading glyph and a screen-reader-only label. */
export function AuthField({
  id,
  label,
  icon: Icon,
  trailing,
  className = '',
  ...inputProps
}: AuthFieldProps): React.JSX.Element {
  return (
    <div className="relative">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <Icon
        className="pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-az-ink-dim"
        aria-hidden="true"
      />
      <input
        id={id}
        {...inputProps}
        placeholder={label}
        className={`az-input az-input--icon ${trailing ? 'az-input--trailing' : ''} ${className}`}
      />
      {trailing && (
        <div className="absolute top-1/2 right-2 flex -translate-y-1/2 items-center">
          {trailing}
        </div>
      )}
    </div>
  );
}
