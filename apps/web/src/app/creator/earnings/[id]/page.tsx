'use client';
import { Suspense, lazy, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
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
  if (query.isLoading)
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--brand-near-black)' }}>
        <AppHeader />
        <div className="max-w-4xl mx-auto px-4 py-12">
          <Skeleton height="300px" borderRadius="16" />
        </div>
      </div>
    );
  if (query.error || !earning)
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--brand-near-black)' }}>
        <AppHeader />
        <div className="max-w-4xl mx-auto px-4 py-12">
          <ErrorState title="Earning not found" />
        </div>
      </div>
    );
  const statusColor =
    earning.status === 'completed'
      ? 'var(--brand-green)'
      : earning.status === 'pending'
        ? 'var(--brand-amber)'
        : 'var(--brand-grey)';
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--brand-near-black)' }}>
      <AppHeader active="Creator" />
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="az-glass p-8"
        >
          <div className="text-center mb-6">
            <p className="text-sm text-white/40 mb-2">
              {earning.type} · {earning.source}
            </p>
            <p className="text-4xl font-bold text-white">₦{earning.amount.toLocaleString()}</p>
            <span
              className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold"
              style={{ backgroundColor: `${statusColor}20`, color: statusColor }}
            >
              {earning.status}
            </span>
          </div>
          <div className="space-y-3 border-t border-white/5 pt-6">
            <InfoRow label="Description" value={earning.description} />
            <InfoRow label="Source" value={earning.source} />
            <InfoRow label="Date" value={new Date(earning.createdAt).toLocaleString('en-NG')} />
            {earning.payoutId && <InfoRow label="Payout ID" value={earning.payoutId} />}
          </div>
          {earning.metadata && Object.keys(earning.metadata).length > 0 && (
            <div
              className="mt-6 p-4 rounded-xl"
              style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
            >
              <h3 className="text-sm font-semibold text-white mb-2">Additional Details</h3>
              {Object.entries(earning.metadata).map(([k, v]) => (
                <p key={k} className="text-xs text-white/40">
                  <span className="text-white/60">{k}:</span> {String(v)}
                </p>
              ))}
            </div>
          )}
        </motion.div>
      </section>
      <AppFooter />
    </div>
  );
}
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-2">
      <span className="text-sm text-white/40">{label}</span>
      <span className="text-sm text-white font-medium">{value}</span>
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
