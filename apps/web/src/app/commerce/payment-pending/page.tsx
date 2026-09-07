'use client';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import { Suspense } from 'react';

function PaymentPendingContent(): React.JSX.Element {
  const searchParams = useSearchParams();
  const reference = searchParams.get('reference');
  const status = searchParams.get('status') ?? 'pending';

  return (
    <>
      <AppHeader />
      <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="max-w-md mx-auto px-4 py-16 text-center">
          {status === 'pending' ? (
            <>
              <div className="w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl"></span>
              </div>
              <h1 className="text-2xl font-bold mb-3">Payment Processing</h1>
              <p className="text-gray-400 mb-6">
                Your payment is being processed. This may take a few minutes.
              </p>
              {reference && <p className="text-sm text-gray-500 mb-6">Reference: {reference}</p>}
              <p className="text-sm text-gray-400 mb-8">
                We&apos;ll notify you once your payment is confirmed.
              </p>
            </>
          ) : (
            <>
              <div className="w-20 h-20 bg-gray-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">HelpCircle</span>
              </div>
              <h1 className="text-2xl font-bold mb-3">Payment Status Unknown</h1>
              <p className="text-gray-400 mb-6">
                We couldn&apos;t confirm your payment status. Don&apos;t worry — we&apos;ll check
                with our payment provider.
              </p>
              {reference && <p className="text-sm text-gray-500 mb-6">Reference: {reference}</p>}
              <p className="text-sm text-gray-400 mb-8">
                If you were charged, your access will be granted shortly.
              </p>
            </>
          )}
          <div className="flex flex-col gap-3">
            <Link
              href="/wallet/transactions"
              className="bg-amber-600 hover:bg-amber-700 px-6 py-3 rounded-lg font-semibold transition"
            >
              View Transaction History
            </Link>
            <Link href="/support" className="text-gray-400 hover:text-white text-sm transition">
              Contact Support
            </Link>
          </div>
        </div>
      </main>
      <AppFooter />
    </>
  );
}

export default function PaymentPendingPage(): React.JSX.Element {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-950" />}>
      <PaymentPendingContent />
    </Suspense>
  );
}
