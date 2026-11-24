'use client';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import PageShell from '@/components/layout/PageShell';
import { Skeleton } from '@azeebo/ui/web';
import { OptimizedImage } from '@/components/OptimizedImage';
import { Swords, BookOpen, Drama, Sparkles } from 'lucide-react';
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
  characters: Character[];
}

/** Each path keeps its own hue, expressed as a token rather than a loose hex. */
const PATH_CONFIG: Record<
  string,
  {
    name: string;
    description: string;
    tone: 'primary-500' | 'secondary-400' | 'warning-400' | 'success-400';
    Icon: typeof Swords;
  }
> = {
  warrior: {
    name: 'Warrior',
    description:
      'Strength, honor, and combat mastery. Warriors are the backbone of any storyworld, wielding strength and strategy to overcome challenges.',
    tone: 'primary-500',
    Icon: Swords,
  },
  sage: {
    name: 'Sage',
    description:
      'Wisdom, knowledge, and ancient truths. Sages hold the secrets of the past and guide others through understanding.',
    tone: 'secondary-400',
    Icon: BookOpen,
  },
  trickster: {
    name: 'Trickster',
    description:
      'Cunning, deception, and survival. Tricksters navigate the world through wit and cleverness, finding unconventional solutions.',
    tone: 'warning-400',
    Icon: Drama,
  },
  healer: {
    name: 'Healer',
    description:
      'Compassion, restoration, and balance. Healers mend what is broken and restore harmony to those around them.',
    tone: 'success-400',
    Icon: Sparkles,
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
        characters: [],
      };
    },
    staleTime: 120000,
  });

  const characters = pathData?.characters || [];
  const tone = `var(--color-az-${pathConfig.tone})`;

  return (
    <PageShell activeNav="Vertical" maxWidth="md">
      <header className="mb-8 text-center">
        <span
          className="mx-auto mb-4 flex size-18 items-center justify-center rounded-az-feature"
          style={{
            background: `linear-gradient(135deg, ${tone}, color-mix(in srgb, ${tone} 80%, transparent))`,
          }}
        >
          <pathConfig.Icon className="size-8 text-az-ink" />
        </span>
        <h1 className="az-headline text-az-heading text-az-ink mb-2">{pathConfig.name}</h1>
        <p className="az-body text-az-ink-muted mx-auto max-w-lg">{pathConfig.description}</p>
      </header>

      <section className="mb-8">
        <h2 className="az-title text-az-ink mb-4">Characters on this Path</h2>
        {isLoading ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} height="16rem" borderRadius="16px" />
            ))}
          </div>
        ) : characters.length === 0 ? (
          <p className="az-body text-az-ink-dim py-10 text-center">
            No characters on this path yet.
          </p>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4">
            {characters.map((char) => (
              <Link
                key={char.id}
                href={`/vertical/characters/${char.id}`}
                className="az-glass block p-5"
              >
                {char.imageUrl && (
                  <div className="relative mb-3 aspect-square overflow-hidden rounded-az-control bg-az-glass-fill">
                    <OptimizedImage src={char.imageUrl} alt={char.name} className="object-cover" />
                  </div>
                )}
                <h3 className="az-body-strong text-az-ink mb-1">{char.name}</h3>
                {char.description && (
                  <p className="az-caption text-az-ink-muted">{char.description}</p>
                )}
              </Link>
            ))}
          </div>
        )}
      </section>

      <div className="mx-auto max-w-[220px]">
        <Link href="/vertical/agbala" className="az-btn-social">
          Back to all paths
        </Link>
      </div>
    </PageShell>
  );
}
