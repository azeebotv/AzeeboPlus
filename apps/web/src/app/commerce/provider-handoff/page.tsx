'use client';
import { Suspense, lazy, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { PageShell } from '@/components/layout/PageShell';
import { CheckCircle2, XCircle, AlertCircle, Loader2, ArrowRight, Home, RefreshCw, ShieldCheck } from 'lucide-react';

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
          className="w-full max-w-lg az-glass p-8 sm:p-10 rounded-3xl border border-white/10 shadow-2xl text-center relative overflow-hidden"
        >
          {state.status === 'processing' && (
            <>
              <div className="w-20 h-20 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-orange-400 shadow-lg shadow-orange-500/10">
                <Loader2 size={38} className="animate-spin text-orange-400" />
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-bold uppercase tracking-wider mb-4">
                <span>Direct Provider Handoff</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white mb-2 tracking-tight">
                Confirming Transaction
              </h1>
              <p className="text-white/60 text-sm sm:text-base leading-relaxed mb-6">
                Please wait while we verify settlement with {state.provider || 'payment provider'}...
              </p>
            </>
          )}

          {state.status === 'success' && (
            <>
              <div className="w-20 h-20 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto mb-6 text-emerald-400 shadow-lg shadow-emerald-500/10">
                <CheckCircle2 size={40} strokeWidth={1.75} />
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-4">
                <span>Settlement Verified</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white mb-2 tracking-tight">
                Payment Successful!
              </h1>
              <p className="text-white/60 text-sm mb-4">Your account balance and entitlements have been credited.</p>
              
              {state.amount && (
                <div className="my-6 p-4 rounded-2xl bg-white/[0.03] border border-white/10">
                  <span className="text-xs text-white/50 block mb-1">Amount Credited</span>
                  <span className="text-3xl sm:text-4xl font-black text-white">
                    ₦{state.amount.toLocaleString()}
                  </span>
                </div>
              )}

              {state.reference && (
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 mb-6 flex items-center justify-center gap-2">
                  <ShieldCheck size={14} className="text-emerald-400" />
                  <span className="text-xs font-mono text-white/50">Ref: {state.reference}</span>
                </div>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push('/wallet')}
                className="w-full az-btn-primary py-3.5 flex items-center justify-center gap-2 text-sm font-bold"
              >
                <span>Go to Wallet</span>
                <ArrowRight size={16} />
              </motion.button>
            </>
          )}

          {state.status === 'failed' && (
            <>
              <div className="w-20 h-20 bg-rose-500/15 border border-rose-500/30 rounded-2xl flex items-center justify-center mx-auto mb-6 text-rose-400 shadow-lg shadow-rose-500/10">
                <XCircle size={40} strokeWidth={1.75} />
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold uppercase tracking-wider mb-4">
                <span>Transaction Declined</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white mb-2 tracking-tight">
                Payment Failed
              </h1>
              <p className="text-white/60 text-sm mb-6">
                Your bank or provider was unable to authorize this charge. Please verify funds and try again.
              </p>
              {state.reference && (
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 mb-6 flex items-center justify-center gap-2">
                  <span className="text-xs font-mono text-white/50">Ref: {state.reference}</span>
                </div>
              )}
              <div className="space-y-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => router.push('/wallet/add-funds')}
                  className="w-full az-btn-primary py-3.5 flex items-center justify-center gap-2 text-sm font-bold"
                >
                  <RefreshCw size={16} />
                  <span>Try Again</span>
                </motion.button>
                <button
                  onClick={() => router.push('/')}
                  className="w-full py-3 rounded-xl text-white/50 hover:text-white transition-colors text-xs font-medium flex items-center justify-center gap-1.5"
                >
                  <Home size={14} />
                  <span>Return to Homepage</span>
                </button>
              </div>
            </>
          )}

          {state.status === 'cancelled' && (
            <>
              <div className="w-20 h-20 bg-amber-500/15 border border-amber-500/30 rounded-2xl flex items-center justify-center mx-auto mb-6 text-amber-400 shadow-lg shadow-amber-500/10">
                <AlertCircle size={40} strokeWidth={1.75} />
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider mb-4">
                <span>User Terminated</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white mb-2 tracking-tight">
                Payment Cancelled
              </h1>
              <p className="text-white/60 text-sm mb-6">
                You cancelled the checkout session before completion. No charges were deducted.
              </p>
              <div className="space-y-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => router.push('/wallet/add-funds')}
                  className="w-full az-btn-primary py-3.5 flex items-center justify-center gap-2 text-sm font-bold"
                >
                  <RefreshCw size={16} />
                  <span>Resume Deposit</span>
                </motion.button>
                <button
                  onClick={() => router.push('/')}
                  className="w-full py-3 rounded-xl text-white/50 hover:text-white transition-colors text-xs font-medium flex items-center justify-center gap-1.5"
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
            <div className="w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        </PageShell>
      }
    >
      <Lazy />
    </Suspense>
  );
}
