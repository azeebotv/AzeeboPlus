'use client';

import { Suspense, lazy, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import { PageShell } from '@/components/layout/PageShell';
import { PageHero } from '@/components/layout/PageHero';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { ArrowLeft, DollarSign, Clock, CheckCircle2 } from 'lucide-react';
import analytics from '@/lib/analytics';

interface EarningDetail {
  id: string;
  type: string;
  amount: number;
  currency: string;
  description: string;
  source: string;
  sourceId: string;
  status: string;
  createdAt: string;
  payoutId?: string;
  metadata?: Record<string, unknown>;
}

function EarningDetailContent() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  useEffect(() => {
    analytics.pageView('creator-earning-detail');
  }, []);

  const query = useQuery({
    queryKey: ['creator', 'earning', id],
    queryFn: async () => {
      const res = await api.request<EarningDetail>(`/api/v1/creators/earnings/${id}`);
      if (res.success && res.data) return res.data;
      throw new Error('Not found');
    },
    enabled: !!id,
  });

  const earning = query.data;

  if (query.isLoading) {
    return (
      <PageShell glowColor="rgba(232,66,10,0.15)">
        <div className="max-w-xl mx-auto py-20 px-4 space-y-6">
          <Skeleton className="h-10 w-40 rounded-xl" />
          <Skeleton className="h-64 w-full rounded-3xl" />
        </div>
      </PageShell>
    );
  }

  if (query.error || !earning) {
    return (
      <PageShell glowColor="rgba(232,66,10,0.12)">
        <div className="max-w-md mx-auto py-20 px-4">
          <ErrorState
            title="Earning record not found"
            description="Unable to locate the specified settlement receipt."
            onButtonPress={() => router.push('/creator/earnings')}
          />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell glowColor="rgba(232,66,10,0.14)">
      <PageHero
        badge="Settlement Ledger"
        title="Transaction Receipt"
        description="Comprehensive accounting details and payout attribution for this transaction."
      />

      <div className="max-w-xl mx-auto py-4 -mt-4 px-4 sm:px-6 lg:px-8 space-y-6">
        <button
          type="button"
          onClick={() => router.push('/creator/earnings')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-white/50 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Earnings Overview
        </button>

        <ScrollReveal>
          <div className="az-glass p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6">
            <div className="text-center pb-6 border-b border-white/10">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto mb-3">
                <DollarSign className="w-6 h-6" />
              </div>
              <p className="text-xs font-mono uppercase tracking-wider text-white/40 mb-1">
                {earning.type} • {earning.source}
              </p>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                ₦{earning.amount.toLocaleString()}
              </h2>
              <span
                className={`inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase border ${
                  earning.status === 'completed'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                }`}
              >
                {earning.status === 'completed' ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <Clock className="w-3.5 h-3.5" />
                )}
                {earning.status}
              </span>
            </div>

            <div className="space-y-3 divide-y divide-white/5 text-xs">
              <InfoRow label="Description" value={earning.description} />
              <InfoRow label="Source Entity" value={earning.source} />
              <InfoRow
                label="Timestamp"
                value={new Date(earning.createdAt).toLocaleString('en-NG')}
              />
              {earning.payoutId && <InfoRow label="Payout Trace ID" value={earning.payoutId} />}
            </div>

            {earning.metadata && Object.keys(earning.metadata).length > 0 && (
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-white/40 block">
                  Attribution Metadata:
                </span>
                {Object.entries(earning.metadata).map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between text-xs">
                    <span className="text-white/50">{k}:</span>
                    <span className="text-white font-mono">{String(v)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollReveal>
      </div>
    </PageShell>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center pt-3 first:pt-0">
      <span className="text-white/40">{label}</span>
      <span className="text-white font-semibold text-right max-w-[60%] truncate">{value}</span>
    </div>
  );
}

const Lazy = lazy(() => Promise.resolve({ default: EarningDetailContent }));

export default function EarningDetailPage() {
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
