'use client';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import { apiFetch } from '@/lib/api';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import { OptimizedImage } from '@/components/OptimizedImage';
import analytics from '@/lib/analytics';

interface Character {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  pathName?: string;
  story?: string;
}

export default function VerticalCharactersPage(): React.JSX.Element {
  useEffect(() => {
    analytics.pageView('vertical-characters');
  }, []);

  const query = useQuery({
    queryKey: ['vertical-characters'],
    queryFn: async () => {
      const res = await apiFetch<Character[] | { items?: Character[] }>('/v1/vertical/characters');
      if (res.success && res.data) {
        const d = res.data;
        return Array.isArray(d) ? d : d.items || [];
      }
      return [];
    },
    staleTime: 120000,
  });

  const characters = query.data as Character[] | undefined;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#1A0A0A', color: '#F5F0EB' }}>
      <AppHeader active="Vertical" />
      <main style={{ padding: '100px 24px 60px', maxWidth: 1200, margin: '0 auto' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Characters</h1>
        <p style={{ color: '#9A8A7A', marginBottom: 32 }}>
          Explore characters from the Azeebo+ vertical universe
        </p>

        {query.isLoading ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: 16,
            }}
          >
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} height="240px" borderRadius="16px" />
            ))}
          </div>
        ) : query.error ? (
          <ErrorState title="Failed to load characters" />
        ) : !characters || characters.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <p style={{ color: '#9A8A7A', fontSize: 16, marginBottom: 8 }}>No characters yet</p>
            <p style={{ color: '#6A5A4A', fontSize: 14 }}>
              Characters will appear here once created in the storyworlds.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: 16,
            }}
          >
            {characters.map((char) => (
              <Link
                key={char.id}
                href={`/vertical/characters/${char.id}`}
                style={{
                  textDecoration: 'none',
                  borderRadius: 16,
                  overflow: 'hidden',
                  border: '1px solid #2A1A1A',
                }}
              >
                <div style={{ position: 'relative', aspectRatio: '1', backgroundColor: '#140808' }}>
                  {char.imageUrl && (
                    <OptimizedImage src={char.imageUrl} alt="" fill className="object-cover" />
                  )}
                </div>
                <div style={{ padding: 12 }}>
                  <h3 style={{ fontWeight: 600, fontSize: 14, color: '#F5F0EB', margin: 0 }}>
                    {char.name}
                  </h3>
                  {char.pathName && (
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: 999,
                        backgroundColor: 'rgba(232,66,10,0.15)',
                        color: '#E8420A',
                        fontSize: 11,
                        fontWeight: 600,
                        marginTop: 4,
                      }}
                    >
                      {char.pathName}
                    </span>
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
