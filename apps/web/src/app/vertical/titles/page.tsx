'use client';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import { api } from '@/lib/api';
import { useUniversesQuery } from '@/hooks/useUniverses';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import { OptimizedImage } from '@/components/OptimizedImage';
import analytics from '@/lib/analytics';

export default function VerticalTitlesPage(): React.JSX.Element {
  useEffect(() => {
    analytics.pageView('vertical-titles');
  }, []);

  const universesQuery = useUniversesQuery();

  const verticalUniverse = universesQuery.data?.find((u) => u.name?.toLowerCase() === 'vertical');

  const titlesQuery = useQuery({
    queryKey: ['vertical-titles', verticalUniverse?.id],
    queryFn: async () => {
      if (!verticalUniverse?.id) throw new Error('Vertical universe not found');
      const res = await api.content.getContentByUniverse(verticalUniverse.id, 1, 50);
      if (res.success && res.data) {
        return Array.isArray(res.data) ? res.data : res.data.items || [];
      }
      throw new Error(res.message || 'Failed to load vertical titles');
    },
    enabled: !!verticalUniverse?.id,
    staleTime: 60000,
  });

  const titles = titlesQuery.data || [];

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: 'var(--brand-near-black)', color: 'var(--text-primary)' }}
    >
      <AppHeader active="Vertical" />
      <main style={{ padding: '100px 24px 60px', maxWidth: 1200, margin: '0 auto' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Vertical Titles</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>
          Short-form vertical content from the Azeebo+ universe
        </p>

        {titlesQuery.isLoading ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: 16,
            }}
          >
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} height="340px" borderRadius="16px" />
            ))}
          </div>
        ) : titlesQuery.error ? (
          <ErrorState title="Failed to load vertical titles" />
        ) : titles.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 40 }}>
            No vertical titles available yet.
          </p>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: 16,
            }}
          >
            {titles.map((title) => (
              <Link
                key={title.id}
                href={`/vertical/titles/${title.id}`}
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
                  {title.thumbnail && (
                    <OptimizedImage src={title.thumbnail} alt="" fill className="object-cover" />
                  )}
                </div>
                <div style={{ padding: 12 }}>
                  <h3
                    style={{
                      fontWeight: 600,
                      fontSize: 14,
                      color: 'var(--text-primary)',
                      margin: 0,
                    }}
                  >
                    {title.title}
                  </h3>
                  {title.description && (
                    <p
                      style={{
                        color: 'var(--text-secondary)',
                        fontSize: 12,
                        margin: '4px 0 0',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {title.description}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
      <AppFooter />
    </div>
  );
}
