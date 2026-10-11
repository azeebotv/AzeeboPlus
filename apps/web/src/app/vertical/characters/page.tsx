'use client';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import { apiFetch } from '@/lib/api';
import { OptimizedImage } from '@/components/OptimizedImage';
import PageShell from '@/components/layout/PageShell';
import PageHero from '@/components/layout/PageHero';
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
    <PageShell activeNav="Vertical">
      <PageHero
        eyebrow="Vertical Universe"
        title="Characters"
        subtitle="Explore characters from the Azeebo+ vertical universe"
      />

      {query.isLoading ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} height="240px" borderRadius="16px" />
          ))}
        </div>
      ) : query.error ? (
        <ErrorState title="Failed to load characters" />
      ) : !characters || characters.length === 0 ? (
        <div className="az-glass px-6 py-16 text-center">
          <p className="az-lead text-az-ink mb-1">No characters yet</p>
          <p className="az-body text-az-ink-dim">
            Characters will appear here once created in the storyworlds.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4">
          {characters.map((char) => (
            <Link
              key={char.id}
              href={`/vertical/characters/${char.id}`}
              className="az-glass block overflow-hidden"
            >
              <div className="relative aspect-square bg-az-surface-raised">
                {char.imageUrl && (
                  <OptimizedImage src={char.imageUrl} alt="" fill className="object-cover" />
                )}
              </div>
              <div className="p-3">
                <h3 className="az-body-strong text-az-ink">{char.name}</h3>
                {char.pathName && (
                  <span className="az-chip mt-1 inline-block px-2 py-0.5 az-micro-label text-az-flame">
                    {char.pathName}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </PageShell>
  );
}
