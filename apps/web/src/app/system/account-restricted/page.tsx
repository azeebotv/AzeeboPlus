import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'System Account-restricted  - Azeebo+',
  description: 'System Account-restricted  on Azeebo+',
};

import Link from 'next/link';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';

export default function AccountRestrictedPage(): React.JSX.Element {
  return (
    <>
      <AppHeader />
      <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="max-w-md mx-auto px-4 py-16 text-center">
          <div className="text-6xl mb-6"></div>
          <h1 className="text-2xl font-bold mb-3">Account Restricted</h1>
          <p className="text-gray-400 mb-4">
            Your account has been temporarily restricted due to a policy violation.
          </p>
          <p className="text-sm text-gray-500 mb-8">
            If you believe this is an error, please contact our support team for assistance.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href="/support"
              className="bg-amber-600 hover:bg-amber-700 px-6 py-3 rounded-lg font-semibold transition text-center"
            >
              Contact Support
            </Link>
            <Link
              href="/auth/login"
              className="bg-gray-800 hover:bg-gray-700 px-6 py-3 rounded-lg font-semibold transition text-center"
            >
              Sign In
            </Link>
          </div>
        </div>
      </main>
      <AppFooter />
    </>
  );
}
