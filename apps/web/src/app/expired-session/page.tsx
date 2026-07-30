'use client';
import Link from 'next/link';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';

export default function ExpiredSessionPage(): React.JSX.Element {
  return (
    <div style={{ backgroundColor: 'var(--brand-near-black)', minHeight: '100vh', color: 'var(--text-primary)' }}>
      <AppHeader />
      <main
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 'calc(100vh - 200px)',
          padding: '100px 24px 60px',
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: 400 }}>
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background:
                'linear-gradient(135deg, rgba(232,66,10,0.15) 0%, rgba(204,28,28,0.1) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
              fontSize: 36,
            }}
          >
            ⏰
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 12 }}>Session Expired</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 32, lineHeight: 1.6 }}>
            Your session has expired for security reasons. Please sign in again to continue.
          </p>
          <Link
            href="/auth/login"
            style={{
              display: 'inline-block',
              padding: '14px 32px',
              borderRadius: 999,
              background: 'linear-gradient(135deg, var(--brand-orange) 0%, var(--brand-red) 100%)',
              color: 'var(--brand-white)',
              fontWeight: 700,
              fontSize: 16,
              textDecoration: 'none',
            }}
          >
            Sign In Again
          </Link>
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
