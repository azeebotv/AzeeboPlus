'use client';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import { EmptyState } from '@/components/ui/EmptyState';

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

const STATUS_CONFIG: Record<string, { color: string; label: string; icon: string }> = {
  pending: { color: 'text-yellow-400', label: 'Pending Review', icon: 'Hourglass' },
  approved: { color: 'text-green-400', label: 'Approved', icon: 'Check' },
  rejected: { color: 'text-red-400', label: 'Rejected', icon: 'X' },
  completed: { color: 'text-green-400', label: 'Refunded', icon: 'DollarSign' },
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
      <>
        <AppHeader />
        <main className="min-h-screen bg-gray-950 text-white">
          <ErrorState description="Failed to load refund status. Please try again." />
        </main>
        <AppFooter />
      </>
    );
  }

  return (
    <>
      <AppHeader />
      <main className="min-h-screen bg-gray-950 text-white">
        <div className="max-w-3xl mx-auto px-4 py-12">
          <h1 className="text-3xl font-bold mb-2">Refund Status</h1>
          <p className="text-gray-400 mb-8">Track the status of your refund requests.</p>

          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : refunds && refunds.length > 0 ? (
            <div className="space-y-4">
              {refunds.map((refund) => {
                const config = STATUS_CONFIG[refund.status] ?? STATUS_CONFIG.pending;
                return (
                  <div key={refund.id} className="bg-gray-900 rounded-xl p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-bold">Refund for Transaction</p>
                        <p className="text-sm text-gray-400 mt-1">{refund.reason}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          Requested: {new Date(refund.createdAt).toLocaleDateString()}
                        </p>
                        {refund.resolvedAt && (
                          <p className="text-xs text-gray-500">
                            Resolved: {new Date(refund.resolvedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">₦{refund.amount.toLocaleString()}</p>
                        <p className={`text-sm mt-1 ${config.color}`}>
                          {config.icon} {config.label}
                        </p>
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
      <AppFooter />
    </>
  );
}
