'use client';
import { Suspense, lazy, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import { OptimizedImage } from '@/components/OptimizedImage';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { StaggerGrid } from '@/components/motion/StaggerGrid';
import analytics from '@/lib/analytics';

interface Comedian {
  id: string;
  name: string;
  avatar: string;
  bio?: string;
  contentCount?: number;
  specialCount?: number;
}

function ComediansPageContent(): React.JSX.Element {
  useEffect(() => {
    analytics.pageView('comedy-comedians');
  }, []);

  const comediansQuery = useQuery({
    queryKey: ['comedy-comedians'],
    queryFn: async () => {
      const res = await api.request<Comedian[]>('/api/v1/comedy/comedians');
      if (res.success && res.data) return res.data;
      throw new Error(res.message || 'Failed to load comedians');
    },
    staleTime: 300000,
  });

  const comedians: Comedian[] = comediansQuery.data ?? [];
  const isLoading = comediansQuery.isLoading;
  const error = comediansQuery.error?.message;

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--brand-near-black)' }}>
      <AppHeader active="Comedy" />

      {/* Hero */}
      <section
        className="relative py-16 sm:py-20"
        style={{ background: 'linear-gradient(135deg, var(--brand-orange) 0%, var(--brand-red) 100%)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1
            className="text-4xl sm:text-5xl font-bold text-white mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Comedians
          </motion.h1>
          <motion.p
            className="text-xl text-white/80 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            Discover Africa&apos;s funniest comedians and their latest content
          </motion.p>
        </div>
      </section>

      {/* Comedians Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <ScrollReveal>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6 sm:mb-8">All Comedians</h2>
        </ScrollReveal>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="az-glass overflow-hidden text-center">
                <div className="p-6">
                  <Skeleton
                    width="80px"
                    height="80px"
                    borderRadius="50%"
                    className="mx-auto mb-3"
                  />
                  <Skeleton height="20px" width="60%" className="mx-auto mb-2" />
                  <Skeleton height="14px" width="40%" className="mx-auto" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <ErrorState
            title="Failed to load comedians"
            description={error}
            onButtonPress={() => comediansQuery.refetch()}
          />
        ) : comedians.length > 0 ? (
          <StaggerGrid className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-6">
            {comedians.map((comedian) => (
              <Link key={comedian.id} href={`/comedy/comedians/${comedian.id}`}>
                <motion.div
                  className="az-glass overflow-hidden text-center cursor-pointer transition-all hover:scale-[1.02]"
                  whileHover={{ y: -4 }}
                >
                  <div className="p-6">
                    <div
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-full mx-auto mb-4 overflow-hidden flex items-center justify-center"
                      style={{ background: 'linear-gradient(135deg, #E8420A, #CC1C1C)' }}
                    >
                      {comedian.avatar ? (
                        <OptimizedImage
                          src={comedian.avatar}
                          alt={comedian.name}
                          width={96}
                          height={96}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-white text-2xl font-bold">
                          {comedian.name.charAt(0)}
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-white text-sm sm:text-base mb-1">
                      {comedian.name}
                    </h3>
                    {comedian.bio && (
                      <p className="text-xs text-white/50 line-clamp-2 mb-2">{comedian.bio}</p>
                    )}
                    <div className="flex items-center justify-center gap-3 text-xs text-white/40">
                      {comedian.specialCount != null && (
                        <span>{comedian.specialCount} specials</span>
                      )}
                      {comedian.contentCount != null && <span>{comedian.contentCount} clips</span>}
                    </div>
                  </div>
                </motion.div>
              </Link>
            ))}
          </StaggerGrid>
        ) : (
          <div className="text-center py-12">
            <p className="text-lg text-white/50">No comedians available yet</p>
          </div>
        )}
      </section>

      <AppFooter />
    </div>
  );
}

const LazyComediansPage = lazy(() => Promise.resolve({ default: ComediansPageContent }));

export default function ComediansPage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#1A0A0A]">
          <p className="text-white/50 text-lg">Loading...</p>
        </div>
      }
    >
      <LazyComediansPage />
    </Suspense>
  );
}
