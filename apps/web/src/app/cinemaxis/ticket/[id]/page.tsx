'use client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { PageHero } from '@/components/layout/PageHero';
import { PageShell } from '@/components/layout/PageShell';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import { messageOf, requireData } from '@/lib/payload';

interface DigitalTicketProduct {
  id: string;
  filmId: string;
  title: string;
  price: number;
  currency: string;
  accessDuration: string;
  accessWindow: string;
  refundPolicy: string;
  rightsRestrictions?: string[];
}

export default function DigitalTicketPage(): React.JSX.Element {
  const params = useParams();
  const filmId = params.id as string;
  const router = useRouter();
  const { user } = useAuth();
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const {
    data: product,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['cinemaxis', 'ticket', filmId],
    queryFn: async () => {
      const res = await apiFetch<DigitalTicketProduct>(`/v1/movies/cinemaxis/${filmId}/ticket`);
      return requireData(res) ?? null;
    },
  });

  const purchaseMutation = useMutation({
    mutationFn: () =>
      apiFetch<{ reference: string }>(`/v1/movies/cinemaxis/${filmId}/ticket/purchase`, {
        method: 'POST',
      }),
    onSuccess: (data) => {
      const d = data as unknown as { reference: string } | null;
      router.push(`/commerce/payment-pending?reference=${d?.reference ?? ''}`);
    },
  });

  if (isError) {
    return (
      <PageShell maxWidth="md" activeNav="Cinemaxis">
        <div className="py-12">
          <ErrorState
            title="Ticket information unavailable"
            description={messageOf(error)}
            onButtonPress={() => refetch()}
          />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell maxWidth="md" activeNav="Cinemaxis">
      <PageHero eyebrow="Cinemaxis" title="Digital Ticket" />

      <div className="-mt-4 pb-12">
        {isLoading ? (
          <div className="space-y-6">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-60 w-full" />
          </div>
        ) : product ? (
          <div className="az-glass p-6 space-y-4">
            <div>
              <h2 className="az-title text-az-ink">{product.title}</h2>
              <p className="az-section-title mt-2 text-az-flame">
                ₦{product.price.toLocaleString()}
              </p>
            </div>
            <div className="border-t border-az-ink/10 pt-4 space-y-2 az-body text-az-ink-dim">
              <p>
                <span className="text-az-ink-muted">Access Duration:</span> {product.accessDuration}
              </p>
              <p>
                <span className="text-az-ink-muted">Access Window:</span> {product.accessWindow}
              </p>
              <p>
                <span className="text-az-ink-muted">Refund Policy:</span> {product.refundPolicy}
              </p>
              {product.rightsRestrictions && product.rightsRestrictions.length > 0 && (
                <p>
                  <span className="text-az-ink-muted">Rights Restrictions:</span>{' '}
                  {product.rightsRestrictions.join(', ')}
                </p>
              )}
            </div>
            <div className="border-t border-az-ink/10 pt-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-1 accent-az-flame"
                />
                <span className="az-body text-az-ink-muted">
                  I understand the access duration, refund policy, and terms above.
                </span>
              </label>
            </div>
            {user ? (
              <button
                onClick={() => purchaseMutation.mutate()}
                disabled={!agreedToTerms || purchaseMutation.isPending}
                className="az-btn-primary disabled:cursor-not-allowed disabled:opacity-50"
              >
                {purchaseMutation.isPending
                  ? 'Processing...'
                  : `Pay ₦${product.price.toLocaleString()}`}
              </button>
            ) : (
              <p className="az-body text-center text-az-ink-dim">
                <a href="/auth/login" className="text-az-flame hover:underline">
                  Sign in
                </a>{' '}
                to purchase.
              </p>
            )}
          </div>
        ) : null}
      </div>
    </PageShell>
  );
}
