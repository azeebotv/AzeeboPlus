'use client';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import { api } from '@/lib/api';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import { OptimizedImage } from '@/components/OptimizedImage';
import analytics from '@/lib/analytics';

const categories = [
  { name: 'Reality', href: '/reality', icon: '🎭', color: '#E8420A' },
  { name: 'Comedy', href: '/comedy', icon: '😂', color: '#FF6B35' },
  { name: 'Movies', href: '/movies', icon: '🎬', color: '#4ADE80' },
  { name: 'Vertical', href: '/vertical', icon: '📱', color: '#60A5FA' },
  { name: 'Sports', href: '/sports', icon: '⚽', color: '#F59E0B' },
  { name: 'Lifestyle', href: '/lifestyle', icon: '🌟', color: '#EC4899' },
];

export const metadata = {
  title: 'Watch | Azeebo',
  description: 'Discover and stream content across all Azeebo+ universes.',
  openGraph: {
    title: 'Watch | Azeebo',
    description: 'Discover and stream content across all Azeebo+ universes.',
  },
};

export default function WatchPage(): React.JSX.Element {
  useEffect(() => {
    analytics.pageView('watch');
  }, []);

  const trendingQuery = useQuery({
    queryKey: ['trending-content'],
    queryFn: async () => {
      const res = await api.content.getTrendingContent(12);
      if (res.success && res.data) {
        return res.data;
      }
      return [];
    },
    staleTime: 120000,
  });

  const trending = trendingQuery.data || [];

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--brand-near-black)', color: 'var(--text-primary)' }}>
      <AppHeader active="Watch" />
      <main style={{ padding: '100px 24px 60px', maxWidth: 1200, margin: '0 auto' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Watch</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>Discover content across all universes</p>

        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>Browse by Category</h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: 12,
            }}
          >
            {categories.map((cat) => (
              <Link
                key={cat.href}
                href={cat.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: 20,
                  borderRadius: 16,
                  border: '1px solid var(--border-default)',
                  textDecoration: 'none',
                  backgroundColor: 'rgba(26,10,10,0.5)',
                  transition: 'border-color 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = cat.color;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#2A1A1A';
                }}
              >
                <span style={{ fontSize: 24 }}>{cat.icon}</span>
                <span style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-primary)' }}>{cat.name}</span>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>Trending Now</h2>
          {trendingQuery.isLoading ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: 16,
              }}
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} height="280px" borderRadius="16px" />
              ))}
            </div>
          ) : trendingQuery.error ? (
            <ErrorState title="Failed to load trending content" />
          ) : trending.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 40 }}>
              No trending content right now.
            </p>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: 16,
              }}
            >
              {trending.map((item) => (
                <Link
                  key={item.id}
                  href={`/watch/${item.id}`}
                  style={{
                    textDecoration: 'none',
                    borderRadius: 16,
                    overflow: 'hidden',
                    border: '1px solid var(--border-default)',
                  }}
                >
                  <div
                    style={{
                      position: 'relative',
                      aspectRatio: '9/16',
                      backgroundColor: '#140808',
                    }}
                  >
                    {item.thumbnail && (
                      <OptimizedImage src={item.thumbnail} alt="" fill className="object-cover" />
                    )}
                  </div>
                  <div style={{ padding: 12 }}>
                    <h3 style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)', margin: 0 }}>
                      {item.title}
                    </h3>
                    {item.creator && (
                      <p style={{ color: 'var(--text-secondary)', fontSize: 11, margin: '4px 0 0' }}>
                        {item.creator.name}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
      <AppFooter />
    </div>
  );
}
