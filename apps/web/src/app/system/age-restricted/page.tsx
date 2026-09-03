import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'System Age-restricted  - Azeebo+',
  description: 'System Age-restricted  on Azeebo+',
};

'use client';
import Link from 'next/link';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';

export default function AgeRestrictedPage(): React.JSX.Element {
  return (
    <>
      <AppHeader />
      <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="max-w-md mx-auto px-4 py-16 text-center">
          <div className="text-6xl mb-6"></div>
          <h1 className="text-2xl font-bold mb-3">Age-Restricted Content</h1>
          <p className="text-gray-400 mb-4">
            This content requires you to be of a certain age to access.
          </p>
          <p className="text-sm text-gray-500 mb-8">
            Please verify your age in your profile settings to access this content.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href="/profile"
              className="bg-amber-600 hover:bg-amber-700 px-6 py-3 rounded-lg font-semibold transition text-center"
            >
              Update Profile
            </Link>
            <Link
              href="/home"
              className="bg-gray-800 hover:bg-gray-700 px-6 py-3 rounded-lg font-semibold transition text-center"
            >
              Go Home
            </Link>
          </div>
        </div>
      </main>
      <AppFooter />
    </>
  );
}
