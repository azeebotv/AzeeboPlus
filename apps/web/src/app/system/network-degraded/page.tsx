import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'System Network-degraded  - Azeebo+',
  description: 'System Network-degraded  on Azeebo+',
};

'use client';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';

export default function NetworkDegradedPage(): React.JSX.Element {
  return (
    <>
      <AppHeader />
      <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="max-w-md mx-auto px-4 py-16 text-center">
          <div className="text-6xl mb-6"></div>
          <h1 className="text-2xl font-bold mb-3">Slow Connection Detected</h1>
          <p className="text-gray-400 mb-4">
            Your connection seems slow. We&apos;ve switched to a lighter experience to keep things
            working.
          </p>
          <ul className="text-sm text-gray-500 space-y-2 mb-8 text-left max-w-xs mx-auto">
            <li>• Video quality may be reduced</li>
            <li>• Images load on demand</li>
            <li>• Auto-play is disabled</li>
          </ul>
          <button
            onClick={() => window.location.reload()}
            className="bg-amber-600 hover:bg-amber-700 px-6 py-3 rounded-lg font-semibold transition"
          >
            Reload
          </button>
        </div>
      </main>
      <AppFooter />
    </>
  );
}
