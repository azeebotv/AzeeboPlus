'use client';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import { Skeleton } from '@azeebo/ui/web';
import { OptimizedImage } from '@/components/OptimizedImage';
import analytics from '@/lib/analytics';

interface Character {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  story?: string;
}

interface PathData {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  characters: Character[];
}

const PATH_CONFIG: Record<
  string,
  { name: string; description: string; color: string; icon: string }
> = {
  warrior: {
    name: 'Warrior',
    description:
      'Strength, honor, and combat mastery. Warriors are the backbone of any storyworld, wielding strength and strategy to overcome challenges.',
    color: '#C41E3A',
    icon: '⚔️',
  },
  sage: {
    name: 'Sage',
    description:
      'Wisdom, knowledge, and ancient truths. Sages hold the secrets of the past and guide others through understanding.',
    color: '#1E90FF',
    icon: '📚',
  },
  trickster: {
    name: 'Trickster',
    description:
      'Cunning, deception, and survival. Tricksters navigate the world through wit and cleverness, finding unconventional solutions.',
    color: '#FFD700',
    icon: '🎭',
  },
  healer: {
    name: 'Healer',
    description:
      'Compassion, restoration, and balance. Healers mend what is broken and restore harmony to those around them.',
    color: '#32CD32',
    icon: '✨',
  },
};

export default function AgbalaPathPage() {
  const params = useParams();
  const pathId = (params.id as string) || 'warrior';
  const pathConfig = PATH_CONFIG[pathId] || PATH_CONFIG.warrior;

  useEffect(() => {
    analytics.pageView(`agbala-path-${pathId}`);
  }, [pathId]);

  const { data: pathData, isLoading } = useQuery({
    queryKey: ['agbala', 'path', pathId],
    queryFn: async () => {
      const res = await apiFetch<PathData>(`/v1/vertical/agbala/paths/${pathId}`);
      if (res.success && res.data) return res.data;
      return {
        id: pathId,
        name: pathConfig.name,
        description: pathConfig.description,
        color: pathConfig.color,
        icon: pathConfig.icon,
        characters: [],
      };
    },
    staleTime: 120000,
  });

  const characters = pathData?.characters || [];

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#1A0A0A', color: '#F5F0EB' }}>
      <AppHeader active="Vertical" />
      <main style={{ padding: '100px 24px 60px', maxWidth: 800, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: 20,
              background: `linear-gradient(135deg, ${pathConfig.color}, ${pathConfig.color}CC)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              fontSize: 32,
            }}
          >
            {pathConfig.icon}
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>{pathConfig.name}</h1>
          <p style={{ color: '#9A8A7A', maxWidth: 500, margin: '0 auto' }}>
            {pathConfig.description}
          </p>
        </div>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>
            Characters on this Path
          </h2>
          {isLoading ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                gap: 16,
              }}
            >
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} height="16rem" borderRadius="16px" />
              ))}
            </div>
          ) : characters.length === 0 ? (
            <p style={{ color: '#9A8A7A', textAlign: 'center', padding: 40 }}>
              No characters on this path yet.
            </p>
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
                    display: 'block',
                    padding: 20,
                    borderRadius: 16,
                    border: '1px solid #2A1A1A',
                    textDecoration: 'none',
                    color: '#F5F0EB',
                    transition: 'border-color 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = pathConfig.color;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#2A1A1A';
                  }}
                >
                  {char.imageUrl && (
                    <div
                      style={{
                        position: 'relative',
                        aspectRatio: '1',
                        backgroundColor: '#140808',
                        marginBottom: 12,
                      }}
                    >
                      <OptimizedImage
                        src={char.imageUrl}
                        alt={char.name}
                        className="object-cover"
                      />
                    </div>
                  )}
                  <h3 style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{char.name}</h3>
                  {char.description && (
                    <p style={{ color: '#9A8A7A', fontSize: 12, lineHeight: 1.4 }}>
                      {char.description}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          )}
        </section>

        <div style={{ textAlign: 'center' }}>
          <Link
            href="/vertical/agbala"
            style={{
              display: 'inline-block',
              padding: '10px 20px',
              background: 'rgba(232,66,10,0.15)',
              border: '1px solid #E8420A',
              color: '#E8420A',
              borderRadius: 8,
              textDecoration: 'none',
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            ← Back to All Paths
          </Link>
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
