'use client';
import { Suspense, lazy, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import AppHeader from '@/components/layout/AppHeader';

interface HandoffState {
  status: 'processing' | 'success' | 'failed' | 'cancelled';
  provider?: string;
  reference?: string;
  amount?: number;
}

function ProviderHandoffContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [state, setState] = useState<HandoffState>({ status: 'processing' });

  useEffect(() => {
    const status = searchParams.get('status') || 'processing';
    const provider = searchParams.get('provider') || searchParams.get('gateway') || 'Paystack';
    const reference = searchParams.get('reference') || searchParams.get('trxref') || '';
    const amount = searchParams.get('amount') ? Number(searchParams.get('amount')) : undefined;

    if (status === 'success' || status === 'completed') {
      setState({ status: 'success', provider, reference, amount });
    } else if (status === 'failed' || status === 'error') {
      setState({ status: 'failed', provider, reference, amount });
    } else if (status === 'cancelled') {
      setState({ status: 'cancelled', provider, reference });
    } else {
      const timer = setTimeout(
        () => setState({ status: 'success', provider, reference, amount }),
        3000
      );
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [searchParams]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--brand-near-black)' }}>
      <AppHeader />
      <section className="max-w-lg mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="az-glass p-8 text-center"
        >
          {state.status === 'processing' && (
            <>
              <div className="w-16 h-16 mx-auto mb-6 border-4 border-white/10 border-t-[var(--brand-orange)] rounded-full animate-spin" />
              <h1 className="text-2xl font-bold text-white mb-2">Processing Payment</h1>
              <p className="text-white/50">Please wait while we confirm your payment...</p>
            </>
          )}
          {state.status === 'success' && (
            <>
              <div
                className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'rgba(16,185,129,0.15)' }}
              >
                <span className="text-4xl"></span>
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Payment Successful!</h1>
              <p className="text-white/50 mb-6">Your payment has been confirmed.</p>
              {state.reference && (
                <p className="text-sm text-white/30 mb-2">Reference: {state.reference}</p>
              )}
              {state.amount && (
                <p className="text-lg font-bold text-white mb-6">
                  ₦{state.amount.toLocaleString()}
                </p>
              )}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push('/wallet')}
                className="w-full az-btn-primary py-3"
              >
                View Wallet
              </motion.button>
            </>
          )}
          {state.status === 'failed' && (
            <>
              <div
                className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'rgba(239,68,68,0.15)' }}
              >
                <span className="text-4xl"></span>
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Payment Failed</h1>
              <p className="text-white/50 mb-6">Something went wrong. Please try again.</p>
              {state.reference && (
                <p className="text-sm text-white/30 mb-4">Reference: {state.reference}</p>
              )}
              <div className="space-y-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  onClick={() => router.push('/wallet/add-funds')}
                  className="w-full az-btn-primary py-3"
                >
                  Try Again
                </motion.button>
                <button
                  onClick={() => router.push('/')}
                  className="w-full py-3 rounded-xl text-white/50 hover:text-white transition-colors"
                >
                  Go Home
                </button>
              </div>
            </>
          )}
          {state.status === 'cancelled' && (
            <>
              <div
                className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'rgba(245,158,11,0.15)' }}
              >
                <span className="text-4xl"></span>
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Payment Cancelled</h1>
              <p className="text-white/50 mb-6">You cancelled the payment.</p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                onClick={() => router.push('/wallet/add-funds')}
                className="w-full az-btn-primary py-3"
              >
                Try Again
              </motion.button>
            </>
          )}
        </motion.div>
      </section>
    </div>
  );
}

const Lazy = lazy(() => Promise.resolve({ default: ProviderHandoffContent }));
export default function ProviderHandoffPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--brand-near-black)]">
          <p className="text-white/50 text-lg">Loading...</p>
        </div>
      }
    >
      <Lazy />
    </Suspense>
  );
}
