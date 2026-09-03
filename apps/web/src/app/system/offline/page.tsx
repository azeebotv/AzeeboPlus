import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'System Offline  - Azeebo+',
  description: 'System Offline  on Azeebo+',
};

'use client';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';

export default function OfflinePage(): React.JSX.Element {
  return (
    <>
      <AppHeader />
      <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="max-w-md mx-auto px-4 py-16 text-center">
          <div className="text-6xl mb-6"></div>
          <h1 className="text-2xl font-bold mb-3">You&apos;re Offline</h1>
          <p className="text-gray-400 mb-8">
            It looks like you&apos;ve lost your internet connection. Some features may not be
            available until you&apos;re back online.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-amber-600 hover:bg-amber-700 px-6 py-3 rounded-lg font-semibold transition"
          >
            Try Again
          </button>
        </div>
      </main>
      <AppFooter />
    </>
  );
}
