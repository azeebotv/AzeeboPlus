import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'System Content-unavailable  - Azeebo+',
  description: 'System Content-unavailable  on Azeebo+',
};

import Link from 'next/link';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';

export default function ContentUnavailablePage(): React.JSX.Element {
  return (
    <>
      <AppHeader />
      <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="max-w-md mx-auto px-4 py-16 text-center">
          <div className="text-6xl mb-6"></div>
          <h1 className="text-2xl font-bold mb-3">Content Unavailable</h1>
          <p className="text-gray-400 mb-8">
            This content is currently unavailable. It may have been removed, or it&apos;s not yet
            available in your region.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href="/home"
              className="bg-amber-600 hover:bg-amber-700 px-6 py-3 rounded-lg font-semibold transition text-center"
            >
              Go Home
            </Link>
            <Link
              href="/browse"
              className="bg-gray-800 hover:bg-gray-700 px-6 py-3 rounded-lg font-semibold transition text-center"
            >
              Browse Content
            </Link>
          </div>
        </div>
      </main>
      <AppFooter />
    </>
  );
}
