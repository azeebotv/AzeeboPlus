'use client';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { Clock, HelpCircle, ArrowRight, ShieldCheck, Headphones } from 'lucide-react';

function PaymentPendingContent(): React.JSX.Element {
  const searchParams = useSearchParams();
  const reference = searchParams.get('reference');
  const status = searchParams.get('status') ?? 'pending';

  return (
    <PageShell activeNav="Wallet">
      <main className="min-h-[75vh] flex items-center justify-center px-4 py-16">
        <ScrollReveal className="w-full max-w-lg">
          <div className="az-glass p-8 sm:p-10 rounded-3xl border border-white/10 shadow-2xl text-center relative overflow-hidden">
            {/* Background Glow */}
            <div
              className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full blur-3xl pointer-events-none"
              style={{
                background: status === 'pending' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(139, 92, 246, 0.15)',
              }}
            />

            {status === 'pending' ? (
              <>
                <div className="w-20 h-20 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-amber-400 shadow-lg shadow-amber-500/10 animate-pulse">
                  <Clock size={38} strokeWidth={1.75} />
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider mb-4">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  <span>Processing Payment</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white mb-3 tracking-tight">
                  Verification in Progress
                </h1>
                <p className="text-white/60 text-sm sm:text-base leading-relaxed mb-6">
                  Your transaction is being confirmed across secure banking channels. This usually takes less than a minute.
                </p>
                {reference && (
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 mb-6 flex items-center justify-center gap-2">
                    <ShieldCheck size={16} className="text-amber-400 flex-shrink-0" />
                    <span className="text-xs font-mono text-white/70">Ref: {reference}</span>
                  </div>
                )}
                <p className="text-xs text-white/40 mb-8">
                  We&apos;ll automatically grant access and update your balance once confirmation completes.
                </p>
              </>
            ) : (
              <>
                <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-white/60 shadow-lg">
                  <HelpCircle size={38} strokeWidth={1.75} />
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white/70 text-xs font-bold uppercase tracking-wider mb-4">
                  <span>Status Inconclusive</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white mb-3 tracking-tight">
                  Awaiting Confirmation
                </h1>
                <p className="text-white/60 text-sm sm:text-base leading-relaxed mb-6">
                  We couldn&apos;t confirm your payment status immediately. Our settlement reconciliation service is verifying with your provider.
                </p>
                {reference && (
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 mb-6 flex items-center justify-center gap-2">
                    <ShieldCheck size={16} className="text-white/40 flex-shrink-0" />
                    <span className="text-xs font-mono text-white/70">Ref: {reference}</span>
                  </div>
                )}
                <p className="text-xs text-white/40 mb-8">
                  If your account was debited, your access and receipt will be credited automatically.
                </p>
              </>
            )}

            <div className="flex flex-col gap-3">
              <Link
                href="/wallet/transactions"
                className="az-btn-primary w-full flex items-center justify-center gap-2 py-3.5 text-sm font-bold"
              >
                <span>View Transaction History</span>
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/support"
                className="inline-flex items-center justify-center gap-2 text-white/50 hover:text-white text-xs font-medium py-2.5 transition-colors"
              >
                <Headphones size={14} />
                <span>Contact Concierge Support</span>
              </Link>
            </div>
          </div>
        </ScrollReveal>
      </main>
    </PageShell>
  );
}

export default function PaymentPendingPage(): React.JSX.Element {
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
      <PaymentPendingContent />
    </Suspense>
  );
}
