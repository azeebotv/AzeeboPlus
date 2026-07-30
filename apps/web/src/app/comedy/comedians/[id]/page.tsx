'use client';
import { Suspense, lazy, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api, ContentItem } from '@/lib/api';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import { OptimizedImage } from '@/components/OptimizedImage';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { GlowCard } from '@/components/motion/GlowCard';
import analytics from '@/lib/analytics';

interface ComedianDetail {
  id: string;
  name: string;
  bio: string;
  avatar: string;
  specialCount?: number;
  clipCount?: number;
  socialLinks?: { platform: string; url: string }[];
}

function ComedianDetailContent(): React.JSX.Element {
  const params = useParams();
  const comedianId = params.id as string;

  useEffect(() => {
    analytics.pageView('comedy-comedian-detail');
  }, []);

  const comedianQuery = useQuery({
    queryKey: ['comedy-comedian', comedianId],
    queryFn: async () => {
      if (!comedianId) throw new Error('Comedian ID is required');
      const res = await api.request<ComedianDetail>(`/api/v1/comedy/comedians/${comedianId}`);
      if (res.success && res.data) return res.data;
      throw new Error(res.message || 'Failed to load comedian');
    },
    enabled: !!comedianId,
    staleTime: 60000,
  });

  const contentQuery = useQuery({
    queryKey: ['comedy-comedian-content', comedianId],
    queryFn: async () => {
      if (!comedianId) throw new Error('Comedian ID is required');
      const res = await api.content.getContentByCreator(comedianId, 12);
      if (res.success && res.data) return res.data;
      return [];
    },
    enabled: !!comedianId,
    staleTime: 60000,
  });

  const comedian = comedianQuery.data;
  const content: ContentItem[] = contentQuery.data ?? [];
  const isLoading = comedianQuery.isLoading;
  const error = comedianQuery.error?.message;

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--brand-near-black)' }}>
      <AppHeader active="Comedy" />

      {isLoading ? (
        <Skeleton height="500px" borderRadius="0" />
      ) : error ? (
        <div className="h-[500px] flex items-center justify-center">
          <ErrorState
            title="Failed to load comedian"
            description={error}
            onButtonPress={() => comedianQuery.refetch()}
          />
        </div>
      ) : comedian ? (
        <section className="relative">
          <div className="relative h-[500px]">
            <OptimizedImage
              src={comedian.avatar}
              alt={comedian.name}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1A0A0A] via-[#1A0A0A]/60 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-8 max-w-7xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <span
                  className="px-3 py-1 rounded-full text-xs font-semibold mb-4 inline-block"
                  style={{ backgroundColor: 'rgba(232,66,10,0.2)', color: '#E8420A' }}
                >
                  Comedian
                </span>
                <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3">{comedian.name}</h1>
                <div className="flex items-center gap-4 text-sm text-white/60">
                  {comedian.specialCount != null && <span>{comedian.specialCount} specials</span>}
                  {comedian.clipCount != null && <span>{comedian.clipCount} clips</span>}
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      ) : null}

      {comedian && (
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
          <ScrollReveal>
            <h2 className="text-2xl font-bold text-white mb-4">About</h2>
            <p className="text-white/70 leading-relaxed mb-8">{comedian.bio}</p>

            {comedian.socialLinks && comedian.socialLinks.length > 0 && (
              <div className="flex gap-3 mb-8">
                {comedian.socialLinks.map((link) => (
                  <a
                    key={link.platform}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-full text-sm font-medium text-white transition-all"
                    style={{
                      border: '1px solid rgba(255,255,255,0.2)',
                      backgroundColor: 'rgba(255,255,255,0.08)',
                    }}
                  >
                    {link.platform}
                  </a>
                ))}
              </div>
            )}
          </ScrollReveal>

          {content.length > 0 && (
            <div className="mt-12">
              <ScrollReveal>
                <h2 className="text-2xl font-bold text-white mb-6">Content</h2>
              </ScrollReveal>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {content.map((item) => (
                  <Link key={item.id} href={`/watch/${item.id}`}>
                    <GlowCard universe="comedy" className="overflow-hidden group">
                      <OptimizedImage
                        src={item.thumbnail}
                        alt={item.title}
                        width={400}
                        height={120}
                        className="w-full h-32 object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="p-3">
                        <h3 className="font-semibold text-white text-sm truncate">{item.title}</h3>
                      </div>
                    </GlowCard>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      <AppFooter />
    </div>
  );
}

const LazyComedianDetail = lazy(() => Promise.resolve({ default: ComedianDetailContent }));

export default function ComedianDetailPage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#1A0A0A]">
          <p className="text-white/50 text-lg">Loading...</p>
        </div>
      }
    >
      <LazyComedianDetail />
    </Suspense>
  );
}
