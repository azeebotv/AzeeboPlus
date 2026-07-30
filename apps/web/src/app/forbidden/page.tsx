'use client';
import Link from 'next/link';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';

export default function ForbiddenPage(): React.JSX.Element {
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
                'linear-gradient(135deg, rgba(204,28,28,0.15) 0%, rgba(204,28,28,0.1) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
              fontSize: 36,
            }}
          >
            🚫
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 12 }}>Access Denied</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 32, lineHeight: 1.6 }}>
            You don&apos;t have permission to access this page. Contact support if you believe this
            is an error.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <Link
              href="/"
              style={{
                padding: '14px 32px',
                borderRadius: 999,
                background: 'linear-gradient(135deg, var(--brand-orange) 0%, var(--brand-red) 100%)',
                color: 'var(--brand-white)',
                fontWeight: 700,
                fontSize: 16,
                textDecoration: 'none',
              }}
            >
              Go Home
            </Link>
            <Link
              href="/support"
              style={{
                padding: '14px 32px',
                borderRadius: 999,
                border: '1px solid var(--border-default)',
                background: 'transparent',
                color: 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: 16,
                textDecoration: 'none',
              }}
            >
              Contact Support
            </Link>
          </div>
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
