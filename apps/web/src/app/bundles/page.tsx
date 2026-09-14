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
    <div
      className="min-h-screen relative overflow-x-hidden"
      style={{ background: 'var(--hp-bg)', color: 'var(--text-primary)' }}
    >
      <AppHeader active="Bundles" logoVariant="light" />

      {/* Top Ambient Glow */}
      <div
        className="pointer-events-none absolute -top-32 left-1/3 -translate-x-1/2 w-[650px] h-[450px] rounded-full blur-[140px] -z-0"
        style={{
          background:
            'radial-gradient(circle, rgba(232,66,10,0.18) 0%, rgba(204,28,28,0.06) 50%, transparent 80%)',
        }}
        aria-hidden="true"
      />

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-3 border border-white/10 bg-white/5">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand-orange)] animate-pulse" />
              <span className="tracking-widest uppercase text-white/70">ALL-IN-ONE ACCESS</span>
            </div>
            <h1 className="az-headline font-extrabold text-white text-3xl sm:text-4xl tracking-tight">
              Bundle Passes
            </h1>
            <p className="text-white/60 mt-1 text-sm sm:text-base">
              Save big with multi-universe entertainment passes
            </p>
          </div>
        </div>

        {comparison && apiBundles.length > 0 && (
          <div
            className="rounded-2xl p-4 mb-8 border border-white/10"
            style={{ background: 'var(--hp-card-bg)' }}
          >
            <div className="flex items-center gap-4 text-sm">
              <span className="text-white/60">Individual total:</span>
              <span className="line-through text-white/40">
                ₦{comparison.individualTotal.toLocaleString()}/mo
              </span>
              <span className="text-green-400 font-semibold">
                Bundle savings: ₦{comparison.bundleSavings.toLocaleString()}/mo
              </span>
            </div>
          </div>
        )}

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {['all', 'standard', 'premium', 'ultimate'].map((tier) => (
            <button
              key={tier}
              onClick={() => setSelectedTier(tier)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedTier === tier
                  ? 'bg-[var(--brand-orange)] text-white'
                  : 'bg-white/5 border border-white/10 text-white/70 hover:text-white'
              }`}
            >
              {tier === 'all' ? 'All Tiers' : tier.charAt(0).toUpperCase() + tier.slice(1)}
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
              className="rounded-2xl border border-[var(--hp-card-border)] overflow-hidden transition-all duration-300 hover:border-[rgba(232,66,10,0.5)] hover:shadow-[0_8px_30px_rgba(232,66,10,0.18)]"
              style={{ background: 'var(--hp-card-bg)' }}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full text-white ${TIER_COLORS[bundle.tier] || 'bg-white/10'}`}
                  >
                    {bundle.tier.toUpperCase()}
                  </span>
                  {bundle.discountPercent >= 30 && (
                    <span className="text-xs font-bold text-green-400">BEST VALUE</span>
                  )}
                </div>

                <h3 className="text-lg font-bold text-white mb-1">{bundle.name}</h3>
                <p className="text-sm text-white/50 mb-4">{bundle.description}</p>

                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-3xl font-extrabold text-white">
                    ₦{Number(bundle.price).toLocaleString()}
                  </span>
                  <span className="text-sm text-white/40">/mo</span>
                </div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-sm text-white/40 line-through">
                    ₦{Number(bundle.originalPrice).toLocaleString()}/mo
                  </span>
                  <span className="text-sm font-bold text-green-400">
                    {bundle.discountPercent}% off
                  </span>
                </div>

                <div className="mb-6">
                  <p className="text-xs text-white/40 mb-2">Includes:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {bundle.universeIds.map((uid) => (
                      <span
                        key={uid}
                        className="text-xs bg-white/5 border border-white/5 text-white/70 px-2.5 py-0.5 rounded-full"
                      >
                        {UNIVERSE_NAMES[uid] || uid}
                      </span>
                    ))}
                  </div>
                </div>

                <Link
                  href={`/bundles/${bundle.id}`}
                  className="az-btn-primary block w-full text-center py-2.5 rounded-xl font-semibold"
                >
                  Get Bundle
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </main>
      <AppFooter logoVariant="light" />
    </div>
  );
}

export default function BundlesPage(): React.JSX.Element {
  return <BundlesPageContent />;
}
