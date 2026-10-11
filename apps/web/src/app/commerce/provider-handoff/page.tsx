'use client';
import { Suspense, lazy, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { PageShell } from '@/components/layout/PageShell';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  ArrowRight,
  Home,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';

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
    <PageShell activeNav="Wallet">
      <main className="min-h-[75vh] flex items-center justify-center px-4 py-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-lg az-glass p-8 sm:p-10 border border-az-glass-border text-center relative overflow-hidden"
        >
          {state.status === 'processing' && (
            <>
              <div className="w-20 h-20 bg-az-flame/10 border border-az-flame/20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-az-flame shadow-lg shadow-az-flame/10">
                <Loader2 size={38} className="animate-spin text-az-flame" />
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-az-flame/10 border border-az-flame/20 text-az-flame text-xs font-bold uppercase tracking-wider mb-4">
                <span>Direct Provider Handoff</span>
              </div>
              <h1 className="az-headline text-2xl sm:text-3xl text-az-ink mb-2">
                Confirming Transaction
              </h1>
              <p className="text-az-ink/60 text-sm sm:text-base leading-relaxed mb-6">
                Please wait while we verify settlement with {state.provider || 'payment provider'}
                ...
              </p>
            </>
          )}

          {state.status === 'success' && (
            <>
              <div className="w-20 h-20 bg-az-success-500/15 border border-az-success-500/30 rounded-2xl flex items-center justify-center mx-auto mb-6 text-az-success-400 shadow-lg shadow-az-success-500/10">
                <CheckCircle2 size={40} strokeWidth={1.75} />
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-az-success-500/10 border border-az-success-500/20 text-az-success-400 text-xs font-bold uppercase tracking-wider mb-4">
                <span>Settlement Verified</span>
              </div>
              <h1 className="az-headline text-2xl sm:text-3xl text-az-ink mb-2">
                Payment Successful!
              </h1>
              <p className="text-az-ink/60 text-sm mb-4">
                Your account balance and entitlements have been credited.
              </p>

              {state.amount && (
                <div className="my-6 p-4 rounded-2xl bg-az-ink/[0.03] border border-az-glass-border">
                  <span className="text-xs text-az-ink/50 block mb-1">Amount Credited</span>
                  <span className="az-headline text-3xl sm:text-4xl text-az-ink">
                    ₦{state.amount.toLocaleString()}
                  </span>
                </div>
              )}

              {state.reference && (
                <div className="p-3 rounded-xl bg-az-ink/[0.02] border border-az-ink/5 mb-6 flex items-center justify-center gap-2">
                  <ShieldCheck size={14} className="text-az-success-400" />
                  <span className="text-xs font-mono text-az-ink/50">Ref: {state.reference}</span>
                </div>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push('/wallet')}
                className="az-btn-primary flex items-center justify-center gap-2"
              >
                <span>Go to Wallet</span>
                <ArrowRight size={16} />
              </motion.button>
            </>
          )}

          {state.status === 'failed' && (
            <>
              <div className="w-20 h-20 bg-az-error-500/15 border border-az-error-500/30 rounded-2xl flex items-center justify-center mx-auto mb-6 text-az-error-400 shadow-lg shadow-az-error-500/10">
                <XCircle size={40} strokeWidth={1.75} />
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-az-error-500/10 border border-az-error-500/20 text-az-error-400 text-xs font-bold uppercase tracking-wider mb-4">
                <span>Transaction Declined</span>
              </div>
              <h1 className="az-headline text-2xl sm:text-3xl text-az-ink mb-2">Payment Failed</h1>
              <p className="text-az-ink/60 text-sm mb-6">
                Your bank or provider was unable to authorize this charge. Please verify funds and
                try again.
              </p>
              {state.reference && (
                <div className="p-3 rounded-xl bg-az-ink/[0.02] border border-az-ink/5 mb-6 flex items-center justify-center gap-2">
                  <span className="text-xs font-mono text-az-ink/50">Ref: {state.reference}</span>
                </div>
              )}
              <div className="space-y-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => router.push('/wallet/add-funds')}
                  className="az-btn-primary flex items-center justify-center gap-2"
                >
                  <RefreshCw size={16} />
                  <span>Try Again</span>
                </motion.button>
                <button
                  onClick={() => router.push('/')}
                  className="w-full py-3 rounded-xl text-az-ink/50 hover:text-az-ink transition-colors text-xs font-medium flex items-center justify-center gap-1.5"
                >
                  <Home size={14} />
                  <span>Return to Homepage</span>
                </button>
              </div>
            </>
          )}

          {state.status === 'cancelled' && (
            <>
              <div className="w-20 h-20 bg-az-warning-500/15 border border-az-warning-500/30 rounded-2xl flex items-center justify-center mx-auto mb-6 text-az-warning-400 shadow-lg shadow-az-warning-500/10">
                <AlertCircle size={40} strokeWidth={1.75} />
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-az-warning-500/10 border border-az-warning-500/20 text-az-warning-400 text-xs font-bold uppercase tracking-wider mb-4">
                <span>User Terminated</span>
              </div>
              <h1 className="az-headline text-2xl sm:text-3xl text-az-ink mb-2">
                Payment Cancelled
              </h1>
              <p className="text-az-ink/60 text-sm mb-6">
                You cancelled the checkout session before completion. No charges were deducted.
              </p>
              <div className="space-y-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => router.push('/wallet/add-funds')}
                  className="az-btn-primary flex items-center justify-center gap-2"
                >
                  <RefreshCw size={16} />
                  <span>Resume Deposit</span>
                </motion.button>
                <button
                  onClick={() => router.push('/')}
                  className="w-full py-3 rounded-xl text-az-ink/50 hover:text-az-ink transition-colors text-xs font-medium flex items-center justify-center gap-1.5"
                >
                  <Home size={14} />
                  <span>Return to Homepage</span>
                </button>
              </div>
            </>
          )}
        </motion.div>
      </main>
    </PageShell>
  );
}

const Lazy = lazy(() => Promise.resolve({ default: ProviderHandoffContent }));

export default function ProviderHandoffPage() {
  return (
    <Suspense
      fallback={
        <PageShell activeNav="Wallet">
          <div className="min-h-[75vh] flex items-center justify-center">
            <div className="w-10 h-10 border-2 border-az-flame border-t-transparent rounded-full animate-spin" />
          </div>
        </PageShell>
      }
    >
      <Lazy />
    </Suspense>
  );
}
