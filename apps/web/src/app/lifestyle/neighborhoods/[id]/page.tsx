'use client';

import { Suspense, lazy, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import { PageShell } from '@/components/layout/PageShell';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { GlowCard } from '@/components/motion/GlowCard';
import { Building2, MapPin, Star, ArrowLeft, ArrowRight } from 'lucide-react';
import analytics from '@/lib/analytics';

interface Neighborhood {
  id: string;
  name: string;
  city: string;
  description: string;
  places: { id: string; name: string; category: string; rating: number }[];
}

function NeighborhoodDetailContent() {
  const params = useParams();
  const id = params?.id as string;

  useEffect(() => {
    analytics.pageView('neighborhood-detail');
  }, []);

  const query = useQuery({
    queryKey: ['lifestyle', 'neighborhood', id],
    queryFn: async () => {
      const res = await api.request<Neighborhood>(`/api/v1/lifestyle/neighborhoods/${id}`);
      if (res.success && res.data) return res.data;
      throw new Error(res.message || 'Neighborhood not found');
    },
    enabled: !!id,
  });

  const n = query.data;

  return (
    <PageShell glowColor="rgba(232,66,10,0.15)">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-16 space-y-6">
        <div className="flex items-center justify-between">
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/home' },
              { label: 'Lifestyle', href: '/lifestyle' },
              { label: 'Neighborhoods', href: '/lifestyle/neighborhoods' },
              { label: n?.name || 'District Overview' },
            ]}
          />
          <Link
            href="/lifestyle/neighborhoods"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/50 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            All Neighborhoods
          </Link>
        </div>

        {query.isLoading ? (
          <div className="space-y-6 py-6">
            <Skeleton className="h-10 w-2/3 rounded-lg" />
            <Skeleton className="h-24 w-full rounded-2xl" />
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-20 w-full rounded-2xl" />
              ))}
            </div>
          </div>
        ) : query.error || !n ? (
          <div className="max-w-md mx-auto py-16">
            <ErrorState
              title="District Not Found"
              description={query.error?.message || 'The requested neighborhood could not be loaded.'}
              onButtonPress={() => query.refetch()}
            />
          </div>
        ) : (
          <div className="space-y-8">
            <ScrollReveal>
              <div className="az-glass p-8 rounded-3xl border border-white/10 shadow-2xl space-y-4">
                <div className="flex items-center gap-2 text-xs font-mono text-[var(--brand-orange)]">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{n.city}</span>
                  <span className="text-white/30">•</span>
                  <span className="text-white/50">{n.places?.length || 0} Premier Spots</span>
                </div>

                <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                  {n.name}
                </h1>
                <p className="text-sm sm:text-base text-white/70 leading-relaxed max-w-3xl">
                  {n.description}
                </p>
              </div>
            </ScrollReveal>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[var(--brand-orange)]" />
                  Curated Venues in {n.name}
                </h2>
                <span className="text-xs font-mono text-white/40">
                  {n.places?.length} venues cataloged
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {n.places?.map((p) => (
                  <ScrollReveal key={p.id}>
                    <Link href={`/lifestyle/places/${p.id}`}>
                      <motion.div whileHover={{ y: -2 }}>
                        <GlowCard className="p-4 rounded-2xl border border-white/10 flex items-center justify-between group cursor-pointer">
                          <div className="space-y-1">
                            <h3 className="text-sm font-bold text-white group-hover:text-[var(--brand-orange)] transition-colors">
                              {p.name}
                            </h3>
                            <span className="text-xs text-white/40 font-mono block">
                              {p.category}
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1 text-xs text-amber-400 font-bold">
                              <Star className="w-3.5 h-3.5 fill-amber-400" />
                              <span>{p.rating.toFixed(1)}</span>
                            </div>
                            <ArrowRight className="w-4 h-4 text-white/30 group-hover:text-[var(--brand-orange)] group-hover:translate-x-1 transition-all" />
                          </div>
                        </GlowCard>
                      </motion.div>
                    </Link>
                  </ScrollReveal>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}

const Lazy = lazy(() => Promise.resolve({ default: NeighborhoodDetailContent }));

export default function NeighborhoodDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--brand-near-black)]">
          <p className="text-white/50 text-lg">Loading...</p>
        </div>
      }
    >
      <Lazy />
    </Suspense>
  );
}
