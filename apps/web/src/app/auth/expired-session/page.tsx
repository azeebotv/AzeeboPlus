'use client';

import Link from 'next/link';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';

export default function ExpiredSessionPage(): React.JSX.Element {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: 'var(--brand-near-black)', color: 'var(--text-primary)' }}
    >
      <AppHeader />

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="az-glass max-w-md w-full p-8 rounded-3xl text-center border border-white/10 shadow-2xl">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[var(--brand-orange)]/10 border border-[var(--brand-orange)]/30 flex items-center justify-center text-3xl animate-pulse">
            ⌛
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">Session Expired</h1>

          <p className="text-white/60 text-sm leading-relaxed mb-8">
            Your login session has timed out due to inactivity or security policy. Please sign in
            again to continue.
          </p>

          <div className="space-y-3">
            <Link
              href="/auth/login"
              className="block w-full py-3.5 rounded-full font-bold text-white transition-transform hover:scale-105 shadow-lg"
              style={{
                background: 'linear-gradient(135deg, var(--brand-orange), var(--brand-red))',
              }}
            >
              Sign In Again
            </Link>

            <Link
              href="/"
              className="block w-full py-3.5 rounded-full font-semibold text-white/70 bg-white/5 hover:bg-white/10 transition-colors"
            >
              Return to Homepage
            </Link>
          </div>
        </div>
      </main>

      <AppFooter />
    </div>
  );
}
