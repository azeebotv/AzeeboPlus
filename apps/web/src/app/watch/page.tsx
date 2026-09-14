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
import { Tv, Smile, Film, Smartphone, Trophy, Star } from 'lucide-react';

const categories = [
  { name: 'Reality', href: '/reality', icon: Tv, color: 'var(--brand-orange, #E8420A)' },
  { name: 'Comedy', href: '/comedy', icon: Smile, color: '#F59E0B' },
  { name: 'Movies', href: '/movies', icon: Film, color: '#10B981' },
  { name: 'Vertical', href: '/vertical', icon: Smartphone, color: '#8B5CF6' },
  { name: 'Sports', href: '/sports', icon: Trophy, color: '#3B82F6' },
  { name: 'Lifestyle', href: '/lifestyle', icon: Star, color: '#EC4899' },
];

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
    <div
      className="min-h-screen"
      style={{ backgroundColor: 'var(--brand-near-black, #0b090e)', color: 'var(--text-primary)' }}
    >
      <AppHeader active="Watch" logoVariant="light" />
      <main style={{ padding: '100px 24px 60px', maxWidth: 1200, margin: '0 auto' }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8, color: 'white' }}>Watch</h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 32 }}>
          Discover content across all universes
        </p>

        <section style={{ marginBottom: 44 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16, color: 'white' }}>
            Browse by Category
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: 12,
            }}
          >
            {categories.map((cat) => {
              const Icon = cat.icon;
              return (
                <Link
                  key={cat.href}
                  href={cat.href}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '16px 20px',
                    borderRadius: 16,
                    border: '1px solid rgba(255,255,255,0.08)',
                    textDecoration: 'none',
                    backgroundColor: 'var(--brand-surface, #18151e)',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = cat.color;
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: cat.color,
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={20} />
                  </div>
                  <span style={{ fontWeight: 600, fontSize: 15, color: 'white' }}>{cat.name}</span>
                </Link>
              );
            })}
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
                      backgroundColor: 'var(--bg-tertiary)',
                    }}
                  >
                    {item.thumbnail && (
                      <OptimizedImage src={item.thumbnail} alt="" fill className="object-cover" />
                    )}
                  </div>
                  <div style={{ padding: 12 }}>
                    <h3
                      style={{
                        fontWeight: 600,
                        fontSize: 13,
                        color: 'var(--text-primary)',
                        margin: 0,
                      }}
                    >
                      {item.title}
                    </h3>
                    {item.creator && (
                      <p
                        style={{ color: 'var(--text-secondary)', fontSize: 11, margin: '4px 0 0' }}
                      >
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
      <AppFooter logoVariant="light" />
    </div>
  );
}
