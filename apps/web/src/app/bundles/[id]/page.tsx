'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import { PageShell } from '@/components/layout/PageShell';
import { PageHero } from '@/components/layout/PageHero';
import { ArrowLeft, Check, Sparkles, Wallet, CreditCard, ShieldCheck } from 'lucide-react';
import analytics from '@/lib/analytics';

const UNIVERSE_NAMES: Record<string, string> = {
  reality: 'Reality TV',
  comedy: 'Comedy',
  movies: 'Cinema & Movies',
  creator: 'Creator Studio',
  lifestyle: 'Lifestyle & Culture',
  sports: 'Sports Arena',
  games: 'Gaming & Trivia',
  vertical: 'Vertical & Lore',
};

function BundleDetailContent(): React.JSX.Element {
  const params = useParams();
  const router = useRouter();
  const bundleId = params.id as string;

  const [paymentMethod, setPaymentMethod] = useState<'external' | 'wallet'>('wallet');

  useEffect(() => {
    analytics.pageView('bundle-detail');
  }, [bundleId]);

  const bundleQuery = useQuery({
    queryKey: ['bundle', bundleId],
    queryFn: async () => {
      const res = await api.bundle.getBundleById(bundleId);
      if (res.success && res.data) return res.data;
      throw new Error(res.message || 'Failed to load bundle');
    },
    enabled: !!bundleId,
  });

  const subscribeMutation = useMutation({
    mutationFn: async () => {
      const res = await api.bundle.subscribe(bundleId, { paymentMethod });
      if (res.success && res.data) return res.data;
      throw new Error(res.message || 'Subscription failed');
    },
    onSuccess: () => {
      if (!bundle) return;
      analytics.subscriptionStarted(bundleId, bundle.name, 'monthly', { bundle: true });
      router.push('/bundles?subscribed=true');
    },
  });

  const bundle = bundleQuery.data;
  const isLoading = bundleQuery.isLoading;
  const error = bundleQuery.error?.message;

  if (isLoading) {
    return (
      <PageShell activeNav="Bundles">
        <div className="max-w-3xl mx-auto space-y-6">
          <Skeleton height="36px" width="160px" />
          <Skeleton height="400px" borderRadius="24px" />
        </div>
      </PageShell>
    );
  }

  if (error || !bundle) {
    return (
      <PageShell activeNav="Bundles">
        <ErrorState
          title="Bundle Not Found"
          description={error || 'This entertainment bundle does not exist or has been retired.'}
          buttonText="Browse All Bundles"
          onButtonPress={() => router.push('/bundles')}
        />
      </PageShell>
    );
  }

  return (
    <PageShell activeNav="Bundles" glowColor="rgba(227, 30, 36, 0.2)">
      <div className="mb-6">
        <Link
          href="/bundles"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-az-ink-muted hover:text-az-ink transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to All Bundles
        </Link>
      </div>

      <div className="max-w-3xl mx-auto">
        <PageHero
          eyebrow="MULTI-UNIVERSE PASS"
          eyebrowColor="var(--color-az-flame)"
          badge={`${bundle.discountPercent}% SAVINGS`}
          title={bundle.name}
          subtitle={bundle.description}
          glowColor="color-mix(in srgb, var(--color-az-scarlet) 25%, transparent)"
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="az-glass p-6 sm:p-10 relative overflow-hidden"
          style={{
            background:
              'linear-gradient(135deg, rgba(24, 21, 30, 0.9) 0%, rgba(35, 18, 14, 0.5) 100%)',
            borderColor: 'color-mix(in srgb, var(--color-az-scarlet) 25%, transparent)',
          }}
        >
          {/* Pricing Header */}
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 pb-6 border-b border-az-glass-border mb-6">
            <div>
              <p className="text-xs uppercase tracking-wider text-az-ink-muted font-semibold mb-1">
                Monthly Pass Subscription
              </p>
              <div className="flex items-baseline gap-3">
                <span className="az-headline text-4xl sm:text-5xl font-extrabold text-az-ink">
                  ₦{Number(bundle.price).toLocaleString()}
                </span>
                <span className="text-az-ink-muted text-base font-medium">/ month</span>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-sm line-through text-az-ink-muted block">
                ₦{Number(bundle.originalPrice).toLocaleString()}/mo
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-az-success-500/15 text-az-success-400 border border-az-success-500/25">
                Save ₦{(Number(bundle.originalPrice) - Number(bundle.price)).toLocaleString()}/month
              </span>
            </div>
          </div>

          {/* Included Universes */}
          <div className="mb-8">
            <h3 className="text-sm font-bold uppercase tracking-wider text-az-ink-muted mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[var(--color-az-flame)]" />
              Included Entertainment Universes
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {bundle.universeIds.map((uid) => (
                <div
                  key={uid}
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-az-glass-fill border border-az-glass-border"
                >
                  <div className="w-5 h-5 rounded-full bg-az-success-500/20 text-az-success-400 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  </div>
                  <span className="text-sm font-semibold text-az-ink-dim">
                    {UNIVERSE_NAMES[uid] || uid}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="mb-8">
            <h3 className="text-sm font-bold uppercase tracking-wider text-az-ink-muted mb-3">
              Select Payment Method
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('wallet')}
                className={`p-4 rounded-2xl border text-left transition-all flex items-center gap-3 ${
                  paymentMethod === 'wallet'
                    ? 'border-[var(--color-az-flame)] bg-[var(--color-az-flame)]/15 text-az-ink shadow-lg'
                    : 'border-az-glass-border bg-az-glass-fill text-az-ink-muted hover:text-az-ink hover:border-az-glass-border'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    paymentMethod === 'wallet'
                      ? 'bg-[var(--color-az-flame)] text-az-surface-root'
                      : 'bg-az-glass-card'
                  }`}
                >
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold">Azeebo Wallet</p>
                  <p className="text-xs text-az-ink-muted">Instant 1-click deduction</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('external')}
                className={`p-4 rounded-2xl border text-left transition-all flex items-center gap-3 ${
                  paymentMethod === 'external'
                    ? 'border-[var(--color-az-flame)] bg-[var(--color-az-flame)]/15 text-az-ink shadow-lg'
                    : 'border-az-glass-border bg-az-glass-fill text-az-ink-muted hover:text-az-ink hover:border-az-glass-border'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    paymentMethod === 'external'
                      ? 'bg-[var(--color-az-flame)] text-az-surface-root'
                      : 'bg-az-glass-card'
                  }`}
                >
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold">Debit / Credit Card</p>
                  <p className="text-xs text-az-ink-muted">Paystack / Flutterwave</p>
                </div>
              </button>
            </div>
          </div>

          {/* Submit CTA */}
          <button
            onClick={() => subscribeMutation.mutate()}
            disabled={subscribeMutation.isPending}
            className="az-btn-primary flex items-center justify-center gap-2 shadow-xl"
          >
            {subscribeMutation.isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-az-ink border-t-transparent rounded-full animate-spin" />
                Processing Activation...
              </>
            ) : (
              <>
                <ShieldCheck className="w-5 h-5" />
                Subscribe to {bundle.name} Now
              </>
            )}
          </button>

          {subscribeMutation.isError && (
            <p className="text-az-error-400 text-xs font-semibold text-center mt-3">
              {(subscribeMutation.error as Error).message}
            </p>
          )}

          <p className="text-[11px] text-az-ink-muted text-center mt-4">
            Secured 256-bit encryption. Cancel anytime directly in your subscription settings.
          </p>
        </motion.div>
      </div>
    </PageShell>
  );
}

export default function BundleDetailPage(): React.JSX.Element {
  return <BundleDetailContent />;
}
