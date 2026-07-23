'use client';
import { Suspense, lazy, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import Link from 'next/link';
import { api, ContentItem } from '@/lib/api';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import { OptimizedImage } from '@/components/OptimizedImage';
import analytics from '@/lib/analytics';

const CITIES = ['Lagos', 'Nairobi', 'Accra', 'Johannesburg', 'Dar es Salaam'] as const;

function CityGuidePageContent(): React.JSX.Element {
  useEffect(() => {
    analytics.pageView('lifestyle-city-guide');
  }, []);

  const universesQuery = useQuery({
    queryKey: ['universes'],
    queryFn: async () => {
      const res = await api.universe.getUniverses();
      if (!res.success || !res.data) throw new Error(res.message || 'Failed to load universes');
      return res.data;
    },
    staleTime: 300000,
  });

  const lifestyleUniverse = universesQuery.data?.find((u) => u.name?.toLowerCase() === 'lifestyle');

  const {
    data: guides = [],
    isLoading,
    error,
    refetch,
  } = useQuery<ContentItem[], Error>({
    queryKey: ['city-guide-content', lifestyleUniverse?.id],
    queryFn: async () => {
      if (!lifestyleUniverse?.id) throw new Error('Lifestyle universe not found');
      const result = await api.content.getContentByUniverse(lifestyleUniverse.id, 1, 20);
      if (result.success && result.data) {
        return Array.isArray(result.data) ? result.data : result.data.items || [];
      }
      throw new Error(result.message || 'Failed to load city guides.');
    },
    staleTime: 60000,
    enabled: !!lifestyleUniverse?.id,
  });

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#1A0A0A' }}>
      <AppHeader active="Lifestyle" />

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="mb-8">
          <Link href="/lifestyle" className="text-sm text-white/40 hover:text-white/60 transition-colors mb-4 inline-block">
            ← Back to Lifestyle
          </Link>
          <h1 className="text-3xl sm:text-4xl font-bold text-white">City Guide</h1>
          <p className="text-white/50 mt-2">Discover the best spots across Africa</p>
        </div>

        {/* City Tabs */}
        <div className="flex flex-wrap gap-3 mb-8">
          {CITIES.map((city) => (
            <span
              key={city}
              className="px-4 py-2 rounded-full text-sm font-medium cursor-pointer transition-all"
              style={{
                backgroundColor: 'rgba(232,66,10,0.15)',
                color: '#E8400A',
                border: '1px solid rgba(232,66,10,0.3)',
              }}
            >
              {city}
            </span>
          ))}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="az-glass overflow-hidden">
                <Skeleton height="240px" borderRadius="0px" />
                <div className="p-4 space-y-3">
                  <Skeleton height="20px" width="75%" />
                  <Skeleton height="16px" width="50%" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <ErrorState
            title="Failed to load city guides"
            description={error.message}
            onButtonPress={() => refetch()}
          />
        ) : guides.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {guides.map((guide) => (
              <Link key={guide.id} href={`/watch/${guide.id}`}>
                <article
                  className="az-glass overflow-hidden cursor-pointer transition-all hover:scale-[1.02]"
                  style={{ boxShadow: '0 0 20px rgba(255,255,255,0.05)' }}
                >
                  <div className="relative">
                    <OptimizedImage
                      src={guide.thumbnail}
                      alt={guide.title}
                      width={400}
                      height={192}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1A0A0A]/80 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="text-xl font-bold text-white">{guide.title}</h3>
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-white/50 line-clamp-2">{guide.description}</p>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-4xl mb-4">🏙️</p>
            <p className="text-lg text-white/50">No city guides available yet</p>
          </div>
        )}
      </section>

      <AppFooter />
    </div>
  );
}

const LazyCityGuidePage = lazy(() => Promise.resolve({ default: CityGuidePageContent }));

export default function CityGuidePage(): React.JSX.Element {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#1A0A0A]"><p className="text-white/50 text-lg">Loading...</p></div>}>
      <LazyCityGuidePage />
    </Suspense>
  );
}
