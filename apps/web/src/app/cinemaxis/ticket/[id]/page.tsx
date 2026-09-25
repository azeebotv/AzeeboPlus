'use client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import { Skeleton, ErrorState } from '@azeebo/ui/web';

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
    error,
  } = useQuery({
    queryKey: ['cinemaxis', 'ticket', filmId],
    queryFn: async () => {
      const res = await apiFetch<DigitalTicketProduct>(`/v1/movies/cinemaxis/${filmId}/ticket`);
      return res.success ? res.data : null;
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

  if (error) {
    return (
      <>
        <AppHeader />
        <main className="min-h-screen bg-gray-950 text-white">
          <ErrorState description="Failed to load ticket information. Please try again." />
        </main>
        <AppFooter />
      </>
    );
  }

  return (
    <>
      <AppHeader />
      <main className="min-h-screen bg-gray-950 text-white">
        <div className="max-w-lg mx-auto px-4 py-12">
          {isLoading ? (
            <div className="space-y-6">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-60 w-full" />
            </div>
          ) : product ? (
            <>
              <h1 className="text-2xl font-bold mb-6">Digital Ticket</h1>
              <div className="bg-gray-900 rounded-xl p-6 space-y-4">
                <div>
                  <h2 className="text-xl font-bold">{product.title}</h2>
                  <p className="text-3xl font-bold text-purple-400 mt-2">
                    ₦{product.price.toLocaleString()}
                  </p>
                </div>
                <div className="border-t border-gray-800 pt-4 space-y-2 text-sm text-gray-400">
                  <p>
                    <span className="text-gray-300">Access Duration:</span> {product.accessDuration}
                  </p>
                  <p>
                    <span className="text-gray-300">Access Window:</span> {product.accessWindow}
                  </p>
                  <p>
                    <span className="text-gray-300">Refund Policy:</span> {product.refundPolicy}
                  </p>
                  {product.rightsRestrictions && product.rightsRestrictions.length > 0 && (
                    <p>
                      <span className="text-gray-300">Rights Restrictions:</span>{' '}
                      {product.rightsRestrictions.join(', ')}
                    </p>
                  )}
                </div>
                <div className="border-t border-gray-800 pt-4">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      className="mt-1"
                    />
                    <span className="text-sm text-gray-400">
                      I understand the access duration, refund policy, and terms above.
                    </span>
                  </label>
                </div>
                {user ? (
                  <button
                    onClick={() => purchaseMutation.mutate()}
                    disabled={!agreedToTerms || purchaseMutation.isPending}
                    className="w-full bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg font-semibold transition disabled:opacity-50"
                  >
                    {purchaseMutation.isPending
                      ? 'Processing...'
                      : `Pay ₦${product.price.toLocaleString()}`}
                  </button>
                ) : (
                  <p className="text-center text-gray-400">
                    <a href="/auth/login" className="text-purple-400 hover:underline">
                      Sign in
                    </a>{' '}
                    to purchase.
                  </p>
                )}
              </div>
            </>
          ) : null}
        </div>
      </main>
      <AppFooter />
    </>
  );
}
