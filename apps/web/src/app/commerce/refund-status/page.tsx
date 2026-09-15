'use client';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import { EmptyState } from '@/components/ui/EmptyState';
import { Clock, CheckCircle, XCircle, DollarSign, LucideIcon } from 'lucide-react';

interface RefundRequest {
  id: string;
  transactionId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  reason: string;
  createdAt: string;
  resolvedAt?: string;
}

const STATUS_CONFIG: Record<
  string,
  { color: string; label: string; icon: LucideIcon; badgeBg: string }
> = {
  pending: {
    color: 'text-amber-400',
    label: 'Pending Review',
    icon: Clock,
    badgeBg: 'rgba(245,158,11,0.12)',
  },
  approved: {
    color: 'text-emerald-400',
    label: 'Approved',
    icon: CheckCircle,
    badgeBg: 'rgba(16,185,129,0.12)',
  },
  rejected: {
    color: 'text-rose-400',
    label: 'Rejected',
    icon: XCircle,
    badgeBg: 'rgba(244,63,94,0.12)',
  },
  completed: {
    color: 'text-emerald-400',
    label: 'Refunded',
    icon: DollarSign,
    badgeBg: 'rgba(16,185,129,0.12)',
  },
};

export default function RefundStatusPage(): React.JSX.Element {
  const {
    data: refunds,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['refunds'],
    queryFn: async () => {
      const res = await apiFetch<RefundRequest[]>('/v1/payments/refunds');
      return res.success ? res.data : null;
    },
  });

  if (error) {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <AppHeader logoVariant="light" />
        <main className="flex-1 max-w-3xl mx-auto px-4 py-16 text-white w-full">
          <ErrorState description="Failed to load refund status. Please try again." />
        </main>
        <AppFooter logoVariant="light" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <AppHeader logoVariant="light" />
      <main className="flex-1 text-white">
        <div className="max-w-3xl mx-auto px-4 py-12">
          <h1 className="text-3xl font-bold mb-2">Refund Status</h1>
          <p className="text-white/60 mb-8">Track the status of your refund requests.</p>

          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-2xl" />
              ))}
            </div>
          ) : refunds && refunds.length > 0 ? (
            <div className="space-y-4">
              {refunds.map((refund) => {
                const config = STATUS_CONFIG[refund.status] ?? STATUS_CONFIG.pending;
                const StatusIcon = config.icon;
                return (
                  <div
                    key={refund.id}
                    className="az-glass rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-bold text-white text-base">Refund for Transaction</p>
                        <p className="text-sm text-white/60 mt-1">{refund.reason}</p>
                        <p className="text-xs text-white/40 mt-2">
                          Requested: {new Date(refund.createdAt).toLocaleDateString()}
                        </p>
                        {refund.resolvedAt && (
                          <p className="text-xs text-white/40">
                            Resolved: {new Date(refund.resolvedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-lg text-white">
                          ₦{refund.amount.toLocaleString()}
                        </p>
                        <div
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mt-2 ${config.color}`}
                          style={{ backgroundColor: config.badgeBg }}
                        >
                          <StatusIcon size={14} />
                          <span>{config.label}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon="DollarSign"
              title="No refund requests found"
              description="You haven't requested any refunds yet"
              action={{
                label: 'View transaction history',
                onClick: () => (window.location.href = '/wallet/transactions'),
              }}
            />
          )}
        </div>
      </main>
      <AppFooter logoVariant="light" />
    </div>
  );
}
