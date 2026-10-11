'use client';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import PageShell from '@/components/layout/PageShell';
import PageHero from '@/components/layout/PageHero';
import analytics from '@/lib/analytics';

/* Tier swatches are categorical labels, so they take the token ramp
   (secondary/purple/warning) rather than the semantic status colours. */
const TIER_COLORS: Record<string, string> = {
  standard: 'bg-az-secondary-500',
  premium: 'bg-[var(--brand-purple)]',
  ultimate: 'bg-az-warning-500',
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

  const tierTabs = ['all', 'standard', 'premium', 'ultimate'].map((tier) => {
    const selected = selectedTier === tier;
    return (
      <button
        key={tier}
        type="button"
        onClick={() => setSelectedTier(tier)}
        aria-pressed={selected}
        className={`az-body-strong whitespace-nowrap rounded-az-pill px-4 py-2 transition-colors ${
          selected
            ? 'bg-az-flame text-az-ink'
            : 'border border-az-glass-border bg-az-glass-fill text-az-ink-muted hover:text-az-ink'
        }`}
      >
        {tier === 'all' ? 'All Tiers' : tier.charAt(0).toUpperCase() + tier.slice(1)}
      </button>
    );
  });

  return (
    <PageShell activeNav="Bundles" maxWidth="7xl">
      <PageHero
        eyebrow="ALL-IN-ONE ACCESS"
        title="Bundle Passes"
        subtitle="Save big with multi-universe entertainment passes"
        actions={<div className="flex items-center gap-2 overflow-x-auto">{tierTabs}</div>}
      />

      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="az-glass h-80 p-4">
              <Skeleton className="h-full w-full rounded-az-panel" />
            </div>
          ))}
        </div>
      ) : error ? (
        <ErrorState
          title="Failed to load bundles"
          description={error}
          buttonText="Try Again"
          onButtonPress={() => comparisonQuery.refetch()}
        />
      ) : (
        <>
          {comparison && apiBundles.length > 0 && (
            <div className="mb-8 rounded-az-panel border border-az-glass-border bg-az-glass-fill p-4">
              <div className="az-body flex items-center gap-4">
                <span className="text-az-ink-muted">Individual total:</span>
                <span className="text-az-ink-muted line-through">
                  ₦{comparison.individualTotal.toLocaleString()}/mo
                </span>
                <span className="az-body-strong text-az-success-400">
                  Bundle savings: ₦{comparison.bundleSavings.toLocaleString()}/mo
                </span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {filteredBundles.map((bundle, index) => (
              <motion.div
                key={bundle.id || index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="overflow-hidden rounded-az-panel border border-az-glass-border bg-az-glass-fill transition-all duration-300 hover:border-az-scarlet/50 hover:shadow-az-glow"
              >
                <div className="p-6">
                  <div className="mb-3 flex items-center justify-between">
                    <span
                      className={`az-caption rounded-az-pill px-2.5 py-1 text-az-ink ${TIER_COLORS[bundle.tier] || 'bg-az-glass-card'}`}
                    >
                      {bundle.tier.toUpperCase()}
                    </span>
                    {bundle.discountPercent >= 30 && (
                      <span className="az-caption font-bold text-az-success-400">BEST VALUE</span>
                    )}
                  </div>

                  <h3 className="az-subtitle mb-1 text-az-ink">{bundle.name}</h3>
                  <p className="az-body mb-4 text-az-ink-muted">{bundle.description}</p>

                  <div className="mb-1 flex items-baseline gap-2">
                    <span className="az-headline text-3xl text-az-ink">
                      ₦{Number(bundle.price).toLocaleString()}
                    </span>
                    <span className="az-body text-az-ink-muted">/mo</span>
                  </div>
                  <div className="mb-4 flex items-center gap-2">
                    <span className="az-body text-az-ink-muted line-through">
                      ₦{Number(bundle.originalPrice).toLocaleString()}/mo
                    </span>
                    <span className="az-body-strong text-az-success-400">
                      {bundle.discountPercent}% off
                    </span>
                  </div>

                  <div className="mb-6">
                    <p className="az-caption mb-2 text-az-ink-muted">Includes:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {bundle.universeIds.map((uid) => (
                        <span
                          key={uid}
                          className="az-micro-label rounded-az-pill border border-az-glass-border bg-az-glass-fill px-2.5 py-0.5 text-az-ink-muted"
                        >
                          {UNIVERSE_NAMES[uid] || uid}
                        </span>
                      ))}
                    </div>
                  </div>

                  <Link href={`/bundles/${bundle.id}`} className="az-btn-primary block text-center">
                    Get Bundle
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </>
      )}
    </PageShell>
  );
}

export default function BundlesPage(): React.JSX.Element {
  return <BundlesPageContent />;
}
