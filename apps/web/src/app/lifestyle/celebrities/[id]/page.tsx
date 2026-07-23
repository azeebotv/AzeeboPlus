'use client';
import { Suspense, lazy, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import Link from 'next/link';
import { api, ContentItem } from '@/lib/api';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import { OptimizedImage } from '@/components/OptimizedImage';
import analytics from '@/lib/analytics';

function CelebrityDetailContent(): React.JSX.Element {
  const params = useParams();
  const id = params.id as string;

  useEffect(() => {
    analytics.pageView('lifestyle-celebrity-detail');
  }, []);

  const {
    data: celebrity,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['celebrity', id],
    queryFn: async (): Promise<ContentItem | null> => {
      const res = await api.request<ContentItem>(`/api/v1/content/${id}`);
      return (res.success ? res.data : null) as ContentItem | null;
    },
    staleTime: 60000,
    enabled: !!id,
  });

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#1A0A0A' }}>
      <AppHeader active="Lifestyle" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <Link href="/lifestyle/celebrities" className="text-sm text-white/40 hover:text-white/60 transition-colors mb-6 inline-block">
          ← Back to Celebrities
        </Link>

        {isLoading ? (
          <div className="space-y-6">
            <Skeleton height="400px" borderRadius="0px" />
            <Skeleton height="40px" width="50%" />
            <Skeleton height="20px" width="80%" />
            <Skeleton height="20px" width="60%" />
          </div>
        ) : error ? (
          <ErrorState
            title="Failed to load celebrity"
            description={error.message}
            onButtonPress={() => refetch()}
          />
        ) : celebrity ? (
          <div>
            <div className="relative h-[400px] mb-8">
              <OptimizedImage
                src={celebrity.thumbnail}
                alt={celebrity.title}
                fill
                className="object-cover rounded-lg"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1A0A0A] via-transparent to-transparent rounded-lg" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">{celebrity.title}</h1>
            <span
              className="inline-block px-3 py-1 rounded-full text-xs font-medium mb-6"
              style={{ backgroundColor: 'rgba(232,66,10,0.2)', color: '#E8400A' }}
            >
              {celebrity.contentType || 'Celebrity'}
            </span>
            <p className="text-white/60 text-lg leading-relaxed mb-8">{celebrity.description}</p>
            <div className="flex items-center gap-4">
              <Link href={`/watch/${celebrity.id}`} className="az-btn-primary" style={{ width: 'auto', paddingInline: '2rem', display: 'inline-block', textAlign: 'center' }}>
                Watch Now
              </Link>
              <Link
                href="/lifestyle/celebrities"
                className="px-6 py-3 rounded-full text-sm font-semibold text-white transition-all inline-block"
                style={{
                  border: '1px solid rgba(255,255,255,0.2)',
                  backgroundColor: 'rgba(255,255,255,0.08)',
                }}
              >
                View More Celebrities
              </Link>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-lg text-white/50">Celebrity not found</p>
          </div>
        )}
      </div>

      <AppFooter />
    </div>
  );
}

const LazyCelebrityDetail = lazy(() => Promise.resolve({ default: CelebrityDetailContent }));

export default function CelebrityDetailPage(): React.JSX.Element {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#1A0A0A]"><p className="text-white/50 text-lg">Loading...</p></div>}>
      <LazyCelebrityDetail />
    </Suspense>
  );
}
