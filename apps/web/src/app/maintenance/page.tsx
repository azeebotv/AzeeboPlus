'use client';
import React from 'react';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';

export default function MaintenancePage(): React.JSX.Element {
  return (
    <div style={{ backgroundColor: '#1A0A0A', minHeight: '100vh', color: '#F5F0EB' }}>
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
                'linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(245,158,11,0.1) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
              fontSize: 36,
            }}
          >
            🔧
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 12 }}>Under Maintenance</h1>
          <p style={{ color: '#9A8A7A', marginBottom: 16, lineHeight: 1.6 }}>
            We&apos;re currently performing scheduled maintenance. We&apos;ll be back shortly.
          </p>
          <p style={{ color: '#6B5A4A', fontSize: 14 }}>Follow us on social media for updates.</p>
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
