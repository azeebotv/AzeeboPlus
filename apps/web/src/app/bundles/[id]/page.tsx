'use client';
import { useEffect, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import analytics from '@/lib/analytics';

const UNIVERSE_NAMES: Record<string, string> = {
  reality: 'Reality',
  comedy: 'Comedy',
  movies: 'Movies',
  creator: 'Creator',
  lifestyle: 'Lifestyle',
  sports: 'Sports',
  games: 'Games',
  vertical: 'Vertical',
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
      <div className="min-h-screen bg-gray-950 text-white">
        <AppHeader />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <Skeleton className="h-8 w-48 mb-6" />
          <Skeleton className="h-6 w-96 mb-4" />
          <Skeleton className="h-64 rounded-xl" />
        </main>
        <AppFooter />
      </div>
    );
  }

  if (error || !bundle) {
    return (
      <div className="min-h-screen bg-gray-950 text-white">
        <AppHeader />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <ErrorState
            title="Bundle not found"
            description={error || 'This bundle does not exist or has been removed.'}
            buttonText="Browse Bundles"
            onButtonPress={() => router.push('/bundles')}
          />
        </main>
        <AppFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <AppHeader />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <Link
          href="/bundles"
          className="text-cyan-400 hover:text-cyan-300 text-sm mb-6 inline-block"
        >
          &larr; Back to Bundles
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-900 border border-gray-800 rounded-xl p-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs font-semibold px-2 py-1 rounded-full text-white bg-cyan-600">
              {bundle.tier.toUpperCase()}
            </span>
          </div>

          <h1 className="text-3xl font-bold mb-2">{bundle.name}</h1>
          <p className="text-gray-400 mb-6">{bundle.description}</p>

          <div className="flex items-baseline gap-3 mb-6">
            <span className="text-5xl font-bold text-cyan-400">
              ₦{Number(bundle.price).toLocaleString()}
            </span>
            <span className="text-lg text-gray-500">/mo</span>
            <span className="text-lg text-gray-500 line-through">
              ₦{Number(bundle.originalPrice).toLocaleString()}/mo
            </span>
            <span className="text-lg font-bold text-green-400">{bundle.discountPercent}% off</span>
          </div>

          <div className="mb-8">
            <h3 className="font-semibold mb-3">Included Universes:</h3>
            <div className="flex flex-wrap gap-2">
              {bundle.universeIds.map((uid) => (
                <span
                  key={uid}
                  className="bg-gray-800 text-gray-200 px-3 py-1.5 rounded-lg text-sm"
                >
                  {UNIVERSE_NAMES[uid] || uid}
                </span>
              ))}
            </div>
          </div>

          <div className="mb-8">
            <h3 className="font-semibold mb-3">Payment Method:</h3>
            <div className="flex gap-3">
              <button
                onClick={() => setPaymentMethod('wallet')}
                className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  paymentMethod === 'wallet'
                    ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400'
                    : 'border-gray-700 text-gray-400 hover:border-gray-500'
                }`}
              >
                Wallet
              </button>
              <button
                onClick={() => setPaymentMethod('external')}
                className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  paymentMethod === 'external'
                    ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400'
                    : 'border-gray-700 text-gray-400 hover:border-gray-500'
                }`}
              >
                Pay with Card
              </button>
            </div>
          </div>

          <button
            onClick={() => subscribeMutation.mutate()}
            disabled={subscribeMutation.isPending}
            className="w-full bg-cyan-500 hover:bg-cyan-400 disabled:bg-gray-700 text-black font-bold py-3 rounded-lg transition-colors text-lg"
          >
            {subscribeMutation.isPending ? 'Processing...' : 'Subscribe Now'}
          </button>

          {subscribeMutation.isError && (
            <p className="text-red-400 text-sm mt-3">
              {(subscribeMutation.error as Error).message}
            </p>
          )}
        </motion.div>
      </main>
      <AppFooter />
    </div>
  );
}

export default function BundleDetailPage(): React.JSX.Element {
  return <BundleDetailContent />;
}
