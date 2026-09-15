'use client';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import { Skeleton } from '@azeebo/ui/web';
import { Swords, BookOpen, Drama, Sparkles } from 'lucide-react';
import analytics from '@/lib/analytics';

function getPathIcon(name: string): React.JSX.Element {
  switch (name) {
    case 'Swords':
      return <Swords className="w-8 h-8 text-rose-500" />;
    case 'BookOpen':
      return <BookOpen className="w-8 h-8 text-sky-400" />;
    case 'Drama':
      return <Drama className="w-8 h-8 text-amber-400" />;
    case 'Sparkles':
      return <Sparkles className="w-8 h-8 text-emerald-400" />;
    default:
      return <Sparkles className="w-8 h-8 text-amber-400" />;
  }
}

const PATHS = [
  {
    id: 'warrior',
    name: 'Warrior',
    description: 'Strength, honor, and combat mastery',
    color: '#EF4444',
    icon: 'Swords',
  },
  {
    id: 'sage',
    name: 'Sage',
    description: 'Wisdom, knowledge, and ancient truths',
    color: '#38BDF8',
    icon: 'BookOpen',
  },
  {
    id: 'trickster',
    name: 'Trickster',
    description: 'Cunning, deception, and survival',
    color: '#FBBF24',
    icon: 'Drama',
  },
  {
    id: 'healer',
    name: 'Healer',
    description: 'Compassion, restoration, and balance',
    color: '#34D399',
    icon: 'Sparkles',
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
    <div
      className="min-h-screen"
      style={{ backgroundColor: 'var(--brand-near-black)', color: 'var(--text-primary)' }}
    >
      <AppHeader active="Vertical" logoVariant="light" />
      <main style={{ padding: '100px 24px 60px', maxWidth: 800, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 20,
              background: 'linear-gradient(135deg, #E8420A, #FF6B35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              boxShadow: '0 8px 32px rgba(232, 66, 10, 0.3)',
            }}
          >
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <h1 style={{ fontSize: 36, fontWeight: 700, marginBottom: 8, color: '#ffffff' }}>
            Agbala
          </h1>
          <p
            style={{
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: 18,
              maxWidth: 600,
              margin: '0 auto',
            }}
          >
            Choose your path. Shape your destiny through interactive storytelling.
          </p>
        </div>

        <section style={{ marginBottom: 48 }}>
          <h2
            style={{
              fontSize: 24,
              fontWeight: 600,
              marginBottom: 16,
              textAlign: 'center',
              color: '#ffffff',
            }}
          >
            Your Paths
          </h2>
          {isLoading ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: 16,
              }}
            >
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={`agbala-skeleton-${i}`} height="16rem" borderRadius="16px" />
              ))}
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: 16,
              }}
            >
              {PATHS.map((path) => (
                <Link
                  key={path.id}
                  href={`/vertical/agbala/${path.id}`}
                  style={{
                    display: 'block',
                    padding: 24,
                    borderRadius: 16,
                    border: '1px solid rgba(255,255,255,0.08)',
                    backgroundColor: 'var(--bg-tertiary)',
                    textDecoration: 'none',
                    color: 'var(--text-primary)',
                    transition: 'border-color 0.2s, transform 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = path.color;
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div style={{ marginBottom: 16 }}>{getPathIcon(path.icon)}</div>
                  <h3 style={{ fontWeight: 600, fontSize: 18, marginBottom: 8, color: path.color }}>
                    {path.name}
                  </h3>
                  <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, lineHeight: 1.5 }}>
                    {path.description}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>Your Storyworlds</h2>
          {storyworlds.length > 0 ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                gap: 16,
              }}
            >
              {storyworlds.map((sw) => (
                <Link
                  key={sw.id}
                  href={`/vertical/storyworlds/${sw.id}`}
                  style={{
                    display: 'block',
                    padding: 20,
                    borderRadius: 16,
                    border: '1px solid var(--border-default)',
                    textDecoration: 'none',
                    color: 'var(--text-primary)',
                    transition: 'border-color 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--brand-orange)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--bg-secondary)';
                  }}
                >
                  <h3 style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>{sw.title}</h3>
                  {sw.description && (
                    <p style={{ color: 'var(--text-secondary)', fontSize: 12, lineHeight: 1.4 }}>
                      {sw.description}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
              No storyworlds available yet.
            </p>
          )}
        </section>

        <div style={{ textAlign: 'center', marginTop: 48 }}>
          <Link
            href="/vertical/agbala/quiz"
            style={{
              display: 'inline-block',
              padding: '14px 28px',
              background: 'linear-gradient(135deg, #E8420A, #FFD700)',
              color: 'var(--brand-near-black)',
              textDecoration: 'none',
              borderRadius: 999,
              fontWeight: 700,
              fontSize: 16,
              transition: 'transform 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            Take the Destiny Quiz
          </Link>
        </div>
      </main>
      <AppFooter logoVariant="light" />
    </div>
  );
}
