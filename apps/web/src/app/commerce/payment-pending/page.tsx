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
          <div className="az-glass p-8 sm:p-10 border border-az-glass-border text-center relative overflow-hidden">
            {/* Background Glow */}
            <div
              className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full blur-3xl pointer-events-none"
              style={{
                background:
                  status === 'pending'
                    ? 'color-mix(in srgb, var(--color-az-warning-500) 15%, transparent)'
                    : 'color-mix(in srgb, var(--brand-purple) 15%, transparent)',
              }}
            />

            {status === 'pending' ? (
              <>
                <div className="w-20 h-20 bg-az-warning-500/10 border border-az-warning-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-az-warning-400 shadow-lg shadow-az-warning-500/10 animate-pulse">
                  <Clock size={38} strokeWidth={1.75} />
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-az-warning-500/10 border border-az-warning-500/20 text-az-warning-400 text-xs font-bold uppercase tracking-wider mb-4">
                  <span className="w-2 h-2 rounded-full bg-az-warning-400 animate-ping" />
                  <span>Processing Payment</span>
                </div>
                <h1 className="az-headline text-2xl sm:text-3xl text-az-ink mb-3">
                  Verification in Progress
                </h1>
                <p className="text-az-ink/60 text-sm sm:text-base leading-relaxed mb-6">
                  Your transaction is being confirmed across secure banking channels. This usually
                  takes less than a minute.
                </p>
                {reference && (
                  <div className="p-3 rounded-xl bg-az-ink/[0.03] border border-az-glass-border mb-6 flex items-center justify-center gap-2">
                    <ShieldCheck size={16} className="text-az-warning-400 flex-shrink-0" />
                    <span className="text-xs font-mono text-az-ink/70">Ref: {reference}</span>
                  </div>
                )}
                <p className="text-xs text-az-ink/40 mb-8">
                  We&apos;ll automatically grant access and update your balance once confirmation
                  completes.
                </p>
              </>
            ) : (
              <>
                <div className="w-20 h-20 bg-az-glass-fill border border-az-glass-border rounded-2xl flex items-center justify-center mx-auto mb-6 text-az-ink/60 shadow-lg">
                  <HelpCircle size={38} strokeWidth={1.75} />
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-az-glass-card border border-az-ink/20 text-az-ink/70 text-xs font-bold uppercase tracking-wider mb-4">
                  <span>Status Inconclusive</span>
                </div>
                <h1 className="az-headline text-2xl sm:text-3xl text-az-ink mb-3">
                  Awaiting Confirmation
                </h1>
                <p className="text-az-ink/60 text-sm sm:text-base leading-relaxed mb-6">
                  We couldn&apos;t confirm your payment status immediately. Our settlement
                  reconciliation service is verifying with your provider.
                </p>
                {reference && (
                  <div className="p-3 rounded-xl bg-az-ink/[0.03] border border-az-glass-border mb-6 flex items-center justify-center gap-2">
                    <ShieldCheck size={16} className="text-az-ink/40 flex-shrink-0" />
                    <span className="text-xs font-mono text-az-ink/70">Ref: {reference}</span>
                  </div>
                )}
                <p className="text-xs text-az-ink/40 mb-8">
                  If your account was debited, your access and receipt will be credited
                  automatically.
                </p>
              </>
            )}

            <div className="flex flex-col gap-3">
              <Link
                href="/wallet/transactions"
                className="az-btn-primary flex items-center justify-center gap-2"
              >
                <span>View Transaction History</span>
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/support"
                className="inline-flex items-center justify-center gap-2 text-az-ink/50 hover:text-az-ink text-xs font-medium py-2.5 transition-colors"
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
            <div className="w-10 h-10 border-2 border-az-flame border-t-transparent rounded-full animate-spin" />
          </div>
        </PageShell>
      }
    >
      <PaymentPendingContent />
    </Suspense>
  );
}
