'use client';
import { Suspense, lazy, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api, ContentItem } from '@/lib/api';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import { PageShell } from '@/components/layout/PageShell';
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
    <PageShell activeNav="Comedy" maxWidth="lg">
      {isLoading ? (
        <Skeleton height="500px" borderRadius="16px" />
      ) : error ? (
        <div className="flex h-[500px] items-center justify-center">
          <ErrorState
            title="Failed to load comedian"
            description={error}
            onButtonPress={() => comedianQuery.refetch()}
          />
        </div>
      ) : comedian ? (
        <section className="py-4">
          <div className="relative h-[400px] overflow-hidden rounded-az-feature sm:h-[500px]">
            <OptimizedImage
              src={comedian.avatar}
              alt={comedian.name}
              fill
              className="object-cover"
              priority
            />
            <div className="az-scrim--hero absolute inset-0" />
            <div className="absolute bottom-0 left-0 right-0 p-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <span className="az-micro-label mb-4 inline-block rounded-az-pill bg-az-scarlet/20 px-3 py-1 text-az-flame">
                  Comedian
                </span>
                <h1 className="az-headline mb-3 text-4xl text-az-ink sm:text-5xl">
                  {comedian.name}
                </h1>
                <div className="az-caption flex items-center gap-4 text-az-ink-muted">
                  {comedian.specialCount != null && <span>{comedian.specialCount} specials</span>}
                  {comedian.clipCount != null && <span>{comedian.clipCount} clips</span>}
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      ) : null}

      {comedian && (
        <section className="py-10 sm:py-12">
          <ScrollReveal>
            <h2 className="az-section-title mb-4 text-az-ink">About</h2>
            <p className="az-lead mb-8 leading-relaxed text-az-ink-muted">{comedian.bio}</p>

            {comedian.socialLinks && comedian.socialLinks.length > 0 && (
              <div className="mb-8 flex gap-3">
                {comedian.socialLinks.map((link) => (
                  <a
                    key={link.platform}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="az-body-strong rounded-az-pill border border-az-ink/20 bg-az-ink/5 px-4 py-2 text-az-ink transition-all hover:bg-az-ink/10"
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
                <h2 className="az-section-title mb-6 text-az-ink">Content</h2>
              </ScrollReveal>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {content.map((item) => (
                  <Link key={item.id} href={`/watch/${item.id}`}>
                    <GlowCard universe="comedy" className="group overflow-hidden">
                      <OptimizedImage
                        src={item.thumbnail}
                        alt={item.title}
                        width={400}
                        height={120}
                        className="h-32 w-full object-cover transition-transform group-hover:scale-105"
                      />
                      <div className="p-3">
                        <h3 className="az-body-strong truncate text-az-ink">{item.title}</h3>
                      </div>
                    </GlowCard>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </section>
      )}
    </PageShell>
  );
}

const LazyComedianDetail = lazy(() => Promise.resolve({ default: ComedianDetailContent }));

export default function ComedianDetailPage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-az-surface-root">
          <p className="az-lead text-az-ink-muted">Loading...</p>
        </div>
      }
    >
      <LazyComedianDetail />
    </Suspense>
  );
}
