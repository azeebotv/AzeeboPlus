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
import { Swords, BookOpen, Drama, Sparkles, ArrowLeft } from 'lucide-react';
import analytics from '@/lib/analytics';

function getPathIcon(name: string): React.JSX.Element {
  switch (name) {
    case 'Swords':
      return <Swords className="w-8 h-8 text-white" />;
    case 'BookOpen':
      return <BookOpen className="w-8 h-8 text-white" />;
    case 'Drama':
      return <Drama className="w-8 h-8 text-white" />;
    case 'Sparkles':
      return <Sparkles className="w-8 h-8 text-white" />;
    default:
      return <Sparkles className="w-8 h-8 text-white" />;
  }
}

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
    color: '#EF4444',
    icon: 'Swords',
  },
  sage: {
    name: 'Sage',
    description:
      'Wisdom, knowledge, and ancient truths. Sages hold the secrets of the past and guide others through understanding.',
    color: '#38BDF8',
    icon: 'BookOpen',
  },
  trickster: {
    name: 'Trickster',
    description:
      'Cunning, deception, and survival. Tricksters navigate the world through wit and cleverness, finding unconventional solutions.',
    color: '#FBBF24',
    icon: 'Drama',
  },
  healer: {
    name: 'Healer',
    description:
      'Compassion, restoration, and balance. Healers mend what is broken and restore harmony to those around them.',
    color: '#34D399',
    icon: 'Sparkles',
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
    <div
      className="min-h-screen"
      style={{ backgroundColor: 'var(--brand-near-black)', color: 'var(--text-primary)' }}
    >
      <AppHeader active="Vertical" logoVariant="light" />
      <main style={{ padding: '100px 24px 60px', maxWidth: 800, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 20,
              background: `linear-gradient(135deg, ${pathConfig.color}, ${pathConfig.color}CC)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              boxShadow: `0 8px 32px ${pathConfig.color}40`,
            }}
          >
            {getPathIcon(pathConfig.icon)}
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, color: '#ffffff' }}>
            {pathConfig.name}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', maxWidth: 500, margin: '0 auto' }}>
            {pathConfig.description}
          </p>
        </div>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16, color: '#ffffff' }}>
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
            <p style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center', padding: 40 }}>
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
                    border: '1px solid rgba(255,255,255,0.08)',
                    backgroundColor: 'var(--bg-tertiary)',
                    textDecoration: 'none',
                    color: 'var(--text-primary)',
                    transition: 'border-color 0.2s, transform 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = pathConfig.color;
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  {char.imageUrl && (
                    <div
                      style={{
                        position: 'relative',
                        aspectRatio: '1',
                        backgroundColor: 'rgba(255,255,255,0.04)',
                        borderRadius: 12,
                        overflow: 'hidden',
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
                  <h3 style={{ fontWeight: 600, fontSize: 15, marginBottom: 4, color: '#ffffff' }}>
                    {char.name}
                  </h3>
                  {char.description && (
                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, lineHeight: 1.4 }}>
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
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '10px 20px',
              background: 'rgba(232,66,10,0.15)',
              border: '1px solid #E8420A',
              color: 'var(--brand-orange)',
              borderRadius: 8,
              textDecoration: 'none',
              fontSize: 14,
              fontWeight: 600,
              transition: 'background-color 0.2s',
            }}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to All Paths</span>
          </Link>
        </div>
      </main>
      <AppFooter logoVariant="light" />
    </div>
  );
}
