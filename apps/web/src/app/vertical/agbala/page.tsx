'use client';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import PageShell from '@/components/layout/PageShell';
import { Skeleton } from '@azeebo/ui/web';
import { Swords, BookOpen, Drama, Sparkles } from 'lucide-react';
import analytics from '@/lib/analytics';

const PATHS = [
  {
    id: 'warrior',
    name: 'Warrior',
    description: 'Strength, honor, and combat mastery',
    tint: 'text-az-scarlet',
    Icon: Swords,
  },
  {
    id: 'sage',
    name: 'Sage',
    description: 'Wisdom, knowledge, and ancient truths',
    tint: 'text-az-secondary-400',
    Icon: BookOpen,
  },
  {
    id: 'trickster',
    name: 'Trickster',
    description: 'Cunning, deception, and survival',
    tint: 'text-az-warning-400',
    Icon: Drama,
  },
  {
    id: 'healer',
    name: 'Healer',
    description: 'Compassion, restoration, and balance',
    tint: 'text-az-success-400',
    Icon: Sparkles,
  },
];

export default function AgbalaPage(): React.JSX.Element {
  useEffect(() => {
    analytics.pageView('agbala');
  }, []);

  const { data: storyworlds = [], isLoading } = useQuery({
    queryKey: ['agbala', 'storyworlds'],
    queryFn: async () => {
      const res = await apiFetch<Array<{ id: string; title: string; description?: string }>>(
        '/v1/vertical/storyworlds'
      );
      if (res.success && res.data) return res.data;
      return [];
    },
    staleTime: 120000,
  });

  return (
    <PageShell activeNav="Vertical" maxWidth="md">
      <header className="mb-12 text-center">
        <span
          className="mx-auto mb-5 flex size-18 items-center justify-center rounded-az-feature"
          style={{
            background: 'var(--gradient-az-cta)',
            boxShadow: 'var(--shadow-az-glow)',
          }}
        >
          <BookOpen className="size-8 text-az-ink" />
        </span>
        <h1 className="az-headline text-az-heading text-az-ink mb-2">Agbala</h1>
        <p className="az-subtitle text-az-ink-muted mx-auto max-w-xl">
          Choose your path. Shape your destiny through interactive storytelling.
        </p>
      </header>

      <section className="mb-12">
        <h2 className="az-section-title text-az-ink mb-4 text-center">Your Paths</h2>
        {isLoading ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={`agbala-skeleton-${i}`} height="16rem" borderRadius="16px" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
            {PATHS.map((path) => (
              <Link
                key={path.id}
                href={`/vertical/agbala/${path.id}`}
                className="az-glass block p-6"
              >
                <path.Icon className={`mb-4 size-8 ${path.tint}`} />
                <h3 className={`az-subtitle mb-2 ${path.tint}`}>{path.name}</h3>
                <p className="az-caption text-az-ink-muted">{path.description}</p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="text-center">
        <h2 className="az-title text-az-ink mb-3">Your Storyworlds</h2>
        {storyworlds.length > 0 ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4 text-left">
            {storyworlds.map((sw) => (
              <Link
                key={sw.id}
                href={`/vertical/storyworlds/${sw.id}`}
                className="az-glass block p-5"
              >
                <h3 className="az-body-strong text-az-ink mb-1">{sw.title}</h3>
                {sw.description && <p className="az-caption text-az-ink-muted">{sw.description}</p>}
              </Link>
            ))}
          </div>
        ) : (
          <p className="az-body text-az-ink-muted">No storyworlds available yet.</p>
        )}
      </section>

      <div className="mx-auto mt-12 max-w-xs">
        <Link href="/vertical/agbala/quiz" className="az-btn-primary">
          Take the Destiny Quiz
        </Link>
      </div>
    </PageShell>
  );
}
