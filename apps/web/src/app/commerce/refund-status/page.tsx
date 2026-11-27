'use client';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { PageHero } from '@/components/layout/PageHero';
import { PageShell } from '@/components/layout/PageShell';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import { EmptyState } from '@/components/ui/EmptyState';
import { messageOf, requireArray } from '@/lib/payload';
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

const STATUS_CONFIG: Record<string, { label: string; icon: LucideIcon; badge: string }> = {
  pending: {
    label: 'Pending Review',
    icon: Clock,
    badge: 'bg-az-warning-500/12 text-az-warning-400',
  },
  approved: {
    label: 'Approved',
    icon: CheckCircle,
    badge: 'bg-az-success-500/12 text-az-success-400',
  },
  rejected: {
    label: 'Rejected',
    icon: XCircle,
    badge: 'bg-az-error-500/12 text-az-error-400',
  },
  completed: {
    label: 'Refunded',
    icon: DollarSign,
    badge: 'bg-az-success-500/12 text-az-success-400',
  },
};

export default function RefundStatusPage(): React.JSX.Element {
  const {
    data: refunds,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['refunds'],
    queryFn: async () => {
      const res = await apiFetch<RefundRequest[]>('/v1/payments/refunds');
      return requireArray(res);
    },
  });

  if (isError) {
    return (
      <PageShell maxWidth="md">
        <ErrorState
          title="Refund status unavailable"
          description={messageOf(error)}
          onButtonPress={() => refetch()}
        />
      </PageShell>
    );
  }

  return (
    <PageShell maxWidth="md">
      <PageHero title="Refund Status" description="Track the status of your refund requests." />

      <div className="pb-16">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-az-card" />
            ))}
          </div>
        ) : refunds && refunds.length > 0 ? (
          <div className="space-y-4">
            {refunds.map((refund) => {
              const config = STATUS_CONFIG[refund.status] ?? STATUS_CONFIG.pending;
              const StatusIcon = config.icon;
              return (
                <div key={refund.id} className="az-glass p-6 transition-all">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="az-body-strong text-az-ink">Refund for Transaction</p>
                      <p className="az-caption mt-1 text-az-ink-muted">{refund.reason}</p>
                      <p className="az-micro-label mt-2 text-az-ink/40">
                        Requested: {new Date(refund.createdAt).toLocaleDateString()}
                      </p>
                      {refund.resolvedAt && (
                        <p className="az-micro-label text-az-ink/40">
                          Resolved: {new Date(refund.resolvedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className="az-title text-az-ink">₦{refund.amount.toLocaleString()}</p>
                      <div
                        className={`az-micro-label mt-2 inline-flex items-center gap-1.5 rounded-az-pill px-3 py-1 ${config.badge}`}
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
    </PageShell>
  );
}
