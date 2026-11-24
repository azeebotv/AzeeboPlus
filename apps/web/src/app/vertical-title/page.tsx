'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import PageShell from '@/components/layout/PageShell';
import PageHero from '@/components/layout/PageHero';
import { apiFetch } from '@/lib/api';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import { OptimizedImage } from '@/components/OptimizedImage';
import Link from 'next/link';

interface CharacterItem {
  id: string;
  name: string;
  actor?: string;
  role?: string;
  avatar?: string;
  description?: string;
}

interface LoreItem {
  id: string;
  title: string;
  content: string;
}

interface VerticalTitleData {
  id: string;
  title: string;
  genre?: string;
  universe?: string;
  thumbnail?: string;
  rating?: number;
  episodes?: number;
  synopsis?: string;
  characters?: CharacterItem[];
  lore?: LoreItem[];
}

export default function VerticalTitlePage(): React.JSX.Element {
  const searchParams = useSearchParams();
  const router = useRouter();
  const titleId = searchParams.get('id') || '';

  const [activeTab, setActiveTab] = useState<'overview' | 'characters' | 'lore'>('overview');
  const [titleData, setTitleData] = useState<VerticalTitleData | null>(null);
  const [characters, setCharacters] = useState<CharacterItem[]>([]);
  const [lore, setLore] = useState<LoreItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    const fetchVerticalTitle = async () => {
      setIsLoading(true);
      setError(null);
      try {
        if (titleId) {
          const res = await apiFetch<VerticalTitleData>(`/v1/vertical/titles/${titleId}`);
          if (res.success && res.data) {
            setTitleData(res.data);
            setCharacters(res.data.characters || []);
            setLore(res.data.lore || []);
          }
        } else {
          const res = await apiFetch<VerticalTitleData[] | { items: VerticalTitleData[] }>(
            '/v1/vertical/titles'
          );
          if (res.success && res.data) {
            const list = Array.isArray(res.data) ? res.data : res.data.items || [];
            if (list.length > 0) {
              setTitleData(list[0]);
              setCharacters(list[0].characters || []);
              setLore(list[0].lore || []);
            }
          }
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load vertical title');
      } finally {
        setIsLoading(false);
      }
    };
    fetchVerticalTitle();
  }, [titleId]);

  return (
    <PageShell activeNav="Vertical" maxWidth="xl">
      <Link
        href="/vertical"
        className="az-body mb-6 inline-flex items-center gap-1.5 text-az-ink/50 transition-colors hover:text-az-ink"
      >
        ← Back to Vertical Drama
      </Link>

      {isLoading ? (
        <div className="space-y-6">
          <Skeleton height="380px" borderRadius="24px" />
          <Skeleton height="40px" width="50%" />
          <Skeleton height="100px" />
        </div>
      ) : error || !titleData ? (
        <ErrorState
          title="Title Unavailable"
          description={error || 'Vertical title could not be loaded.'}
          onButtonPress={() => router.push('/vertical')}
        />
      ) : (
        <div className="space-y-8">
          {/* Header Hero */}
          <PageHero
            eyebrow={titleData.universe || 'Vertical Drama'}
            title={titleData.title}
            subtitle={
              titleData.synopsis ||
              'Immerse in mobile-first 9:16 vertical storytelling crafted for quick drama hooks and rich worldbuilding.'
            }
            actions={
              <>
                <Link
                  href={`/watch/${titleData.id}`}
                  className="az-btn-primary az-btn-primary--inline inline-flex items-center gap-2"
                >
                  <span aria-hidden="true"></span> Play Episode 1
                </Link>
                <button
                  type="button"
                  onClick={() => setIsFollowing((f) => !f)}
                  aria-pressed={isFollowing}
                  className={`az-body-strong rounded-az-pill px-6 py-3 transition-colors ${
                    isFollowing
                      ? 'border border-az-ink/30 bg-az-ink/20 text-az-ink'
                      : 'bg-az-glass-card text-az-ink/90 hover:bg-az-ink/15'
                  }`}
                >
                  {isFollowing ? 'Check In Watchlist' : '+ Add to Watchlist'}
                </button>
              </>
            }
          >
            <div className="az-glass flex flex-col items-center gap-6 p-6 sm:flex-row sm:items-start">
              <div className="relative aspect-[9/16] w-48 flex-shrink-0 overflow-hidden rounded-az-panel">
                {titleData.thumbnail && (
                  <OptimizedImage
                    src={titleData.thumbnail}
                    alt={titleData.title}
                    fill
                    className="object-cover"
                    priority
                  />
                )}
              </div>

              <div className="flex flex-1 flex-col gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  {titleData.genre && (
                    <span className="az-caption rounded-az-pill bg-az-glass-card px-3 py-0.5 font-medium text-az-ink/80">
                      {titleData.genre}
                    </span>
                  )}
                  {titleData.episodes && (
                    <span className="az-overline text-az-ink/60">
                      {titleData.episodes} Episodes
                    </span>
                  )}
                </div>
              </div>
            </div>
          </PageHero>

          {/* Tabs */}
          <div className="flex gap-8 border-b border-az-glass-border">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              aria-pressed={activeTab === 'overview'}
              className={`az-body-strong relative pb-3 transition-colors ${
                activeTab === 'overview' ? 'text-az-ink' : 'text-az-ink/40 hover:text-az-ink/70'
              }`}
            >
              Overview
              {activeTab === 'overview' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-az-flame" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('characters')}
              aria-pressed={activeTab === 'characters'}
              className={`az-body-strong relative pb-3 transition-colors ${
                activeTab === 'characters' ? 'text-az-ink' : 'text-az-ink/40 hover:text-az-ink/70'
              }`}
            >
              Characters ({characters.length})
              {activeTab === 'characters' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-az-flame" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('lore')}
              aria-pressed={activeTab === 'lore'}
              className={`az-body-strong relative pb-3 transition-colors ${
                activeTab === 'lore' ? 'text-az-ink' : 'text-az-ink/40 hover:text-az-ink/70'
              }`}
            >
              Universe Lore
              {activeTab === 'lore' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-az-flame" />
              )}
            </button>
          </div>

          {/* Tab Contents */}
          {activeTab === 'overview' && (
            <div className="az-glass space-y-4 p-6">
              <h3 className="az-subtitle text-az-ink">Story Synopsis</h3>
              <p className="az-lead leading-relaxed text-az-ink/70">
                {titleData.synopsis ||
                  'Explore an expansive vertical narrative written for fast-paced visual storytelling and episodic cliffhangers.'}
              </p>
            </div>
          )}

          {activeTab === 'characters' && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {characters.length === 0 ? (
                <p className="az-body col-span-3 py-8 text-center text-az-ink/40">
                  No character details listed.
                </p>
              ) : (
                characters.map((c) => (
                  <div key={c.id} className="az-glass flex items-center gap-4 p-4">
                    <div className="az-subtitle relative flex size-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-az-glass-card text-az-ink">
                      {c.avatar ? (
                        <OptimizedImage src={c.avatar} alt={c.name} fill className="object-cover" />
                      ) : (
                        c.name.charAt(0)
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="az-body-strong truncate text-az-ink">{c.name}</h4>
                      <p className="az-caption truncate text-az-flame">
                        {c.role || 'Main Character'}
                      </p>
                      {c.description && (
                        <p className="az-caption mt-1 line-clamp-1 text-az-ink/50">
                          {c.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'lore' && (
            <div className="space-y-4">
              {lore.length === 0 ? (
                <div className="az-glass p-8 text-center az-body text-az-ink/40">
                  Discover deep world lore and timeline history as episodes are unlocked.
                </div>
              ) : (
                lore.map((item, i) => (
                  <div key={i} className="az-glass space-y-2 p-6">
                    <h4 className="az-body-strong text-az-ink">{item.title}</h4>
                    <p className="az-lead leading-relaxed text-az-ink/70">{item.content}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </PageShell>
  );
}
