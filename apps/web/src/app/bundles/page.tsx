'use client';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import analytics from '@/lib/analytics';

const TIER_COLORS: Record<string, string> = {
  standard: 'bg-blue-500',
  premium: 'bg-purple-500',
  ultimate: 'bg-amber-500',
};

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

const BUNDLE_PRESETS = [
  {
    id: 'entertainment',
    name: 'Entertainment Bundle',
    description: 'Reality + Comedy + Movies',
    universeIds: ['reality', 'comedy', 'movies'],
    originalPrice: 3000,
    price: 2100,
    discountPercent: 30,
    duration: 30,
    tier: 'standard',
  },
  {
    id: 'creator-pack',
    name: 'Creator Pack',
    description: 'Creator + Lifestyle',
    universeIds: ['creator', 'lifestyle'],
    originalPrice: 2000,
    price: 1500,
    discountPercent: 25,
    duration: 30,
    tier: 'premium',
  },
  {
    id: 'all-access',
    name: 'All Access',
    description: 'All 8 universes',
    universeIds: [
      'reality',
      'comedy',
      'movies',
      'creator',
      'lifestyle',
      'sports',
      'games',
      'vertical',
    ],
    originalPrice: 8000,
    price: 4800,
    discountPercent: 40,
    duration: 30,
    tier: 'ultimate',
  },
  {
    id: 'sports-games',
    name: 'Sports & Games',
    description: 'Sports + Games',
    universeIds: ['sports', 'games'],
    originalPrice: 2000,
    price: 1400,
    discountPercent: 30,
    duration: 30,
    tier: 'standard',
  },
];

function BundlesPageContent(): React.JSX.Element {
  const [selectedTier, setSelectedTier] = useState<string>('all');

  useEffect(() => {
    analytics.pageView('bundles');
  }, []);

  const comparisonQuery = useQuery({
    queryKey: ['bundle-comparison'],
    queryFn: async () => {
      const res = await api.bundle.getBundleComparison();
      if (res.success && res.data) return res.data;
      throw new Error(res.message || 'Failed to load bundles');
    },
    staleTime: 300000,
  });

  const comparison = comparisonQuery.data;
  const isLoading = comparisonQuery.isLoading;
  const error = comparisonQuery.error?.message;

  const apiBundles = comparison?.bundles ?? [];
  const displayBundles = apiBundles.length > 0 ? apiBundles : BUNDLE_PRESETS;
  const filteredBundles =
    selectedTier === 'all' ? displayBundles : displayBundles.filter((b) => b.tier === selectedTier);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950">
        <AppHeader />
        <main className="max-w-7xl mx-auto px-4 py-8">
          <Skeleton className="h-10 w-64 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-80 rounded-xl" />
            ))}
          </div>
        </main>
        <AppFooter />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950">
        <AppHeader />
        <main className="max-w-7xl mx-auto px-4 py-8">
          <ErrorState
            title="Failed to load bundles"
            description={error}
            buttonText="Try Again"
            onButtonPress={() => comparisonQuery.refetch()}
          />
        </main>
        <AppFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <AppHeader />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Bundle Passes</h1>
            <p className="text-gray-400 mt-1">Save big with multi-universe bundles</p>
          </div>
        </div>

        {comparison && apiBundles.length > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-8">
            <div className="flex items-center gap-4 text-sm">
              <span className="text-gray-400">Individual total:</span>
              <span className="line-through text-gray-500">
                ₦{comparison.individualTotal.toLocaleString()}/mo
              </span>
              <span className="text-green-400 font-semibold">
                Bundle savings: ₦{comparison.bundleSavings.toLocaleString()}/mo
              </span>
            </div>
          </div>
        )}

        <div className="flex gap-2 mb-6 overflow-x-auto">
          {['all', 'standard', 'premium', 'ultimate'].map((tier) => (
            <button
              key={tier}
              onClick={() => setSelectedTier(tier)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedTier === tier
                  ? 'bg-cyan-500 text-black'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {tier === 'all' ? 'All' : tier.charAt(0).toUpperCase() + tier.slice(1)}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredBundles.map((bundle, index) => (
            <motion.div
              key={bundle.id || index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:border-cyan-500/50 transition-all"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`text-xs font-semibold px-2 py-1 rounded-full text-white ${TIER_COLORS[bundle.tier] || 'bg-gray-600'}`}
                  >
                    {bundle.tier.toUpperCase()}
                  </span>
                  {bundle.discountPercent >= 30 && (
                    <span className="text-xs font-bold text-green-400">BEST VALUE</span>
                  )}
                </div>

                <h3 className="text-lg font-bold mb-1">{bundle.name}</h3>
                <p className="text-sm text-gray-400 mb-4">{bundle.description}</p>

                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-3xl font-bold text-cyan-400">
                    ₦{Number(bundle.price).toLocaleString()}
                  </span>
                  <span className="text-sm text-gray-500">/mo</span>
                </div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-sm text-gray-500 line-through">
                    ₦{Number(bundle.originalPrice).toLocaleString()}/mo
                  </span>
                  <span className="text-sm font-bold text-green-400">
                    {bundle.discountPercent}% off
                  </span>
                </div>

                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-2">Includes:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {bundle.universeIds.map((uid) => (
                      <span
                        key={uid}
                        className="text-xs bg-gray-800 text-gray-300 px-2 py-0.5 rounded-full"
                      >
                        {UNIVERSE_NAMES[uid] || uid}
                      </span>
                    ))}
                  </div>
                </div>

                <Link
                  href={`/bundles/${bundle.id}`}
                  className="block w-full text-center bg-cyan-500 hover:bg-cyan-400 text-black font-semibold py-2.5 rounded-lg transition-colors"
                >
                  Get Bundle
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </main>
      <AppFooter />
    </div>
  );
}

export default function BundlesPage(): React.JSX.Element {
  return <BundlesPageContent />;
}
