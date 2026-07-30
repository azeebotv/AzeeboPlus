'use client';
import { colors } from '@azeebo/design-tokens';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div style={{ minHeight: '100vh', background: colors.bg.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ textAlign: 'center', maxWidth: '400px' }}>
        <h2 style={{ color: colors.text.primary, fontSize: '24px', marginBottom: '12px' }}>Something went wrong</h2>
        <p style={{ color: colors.text.secondary, marginBottom: '24px' }}>{error.message || 'An unexpected error occurred'}</p>
        <button onClick={reset} style={{ background: colors.primary[500], color: colors.text.inverse, border: 'none', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', fontSize: '16px' }} aria-label="Try again">
          Try Again
        </button>
      </div>
    </div>
  );
}
