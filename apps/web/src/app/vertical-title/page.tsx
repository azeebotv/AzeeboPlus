'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
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
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: 'var(--brand-near-black)', color: 'var(--text-primary)' }}
    >
      <AppHeader active="Vertical" />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        <Link
          href="/vertical"
          className="text-sm text-white/50 hover:text-white mb-6 inline-flex items-center gap-1.5 transition-colors"
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
            <div className="az-glass rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row gap-8 items-center sm:items-start border border-white/10 shadow-2xl">
              <div className="relative w-48 aspect-[9/16] rounded-2xl overflow-hidden shadow-2xl flex-shrink-0 border border-white/10">
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

              <div className="flex-1 text-center sm:text-left">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-3">
                  <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-[var(--brand-orange)] text-white uppercase tracking-wider">
                    {titleData.universe || 'Vertical Drama'}
                  </span>
                  {titleData.genre && (
                    <span className="px-3 py-0.5 rounded-full text-xs font-medium bg-white/10 text-white/80">
                      {titleData.genre}
                    </span>
                  )}
                  {titleData.episodes && (
                    <span className="text-xs text-white/60 font-semibold">
                      {titleData.episodes} Episodes
                    </span>
                  )}
                </div>

                <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
                  {titleData.title}
                </h1>
                <p className="text-white/70 text-sm sm:text-base leading-relaxed mb-6">
                  {titleData.synopsis ||
                    'Immerse in mobile-first 9:16 vertical storytelling crafted for quick drama hooks and rich worldbuilding.'}
                </p>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                  <Link
                    href={`/watch/${titleData.id}`}
                    className="px-7 py-3 rounded-full font-bold text-white transition-transform hover:scale-105 shadow-lg inline-flex items-center gap-2"
                    style={{
                      background: 'linear-gradient(135deg, var(--brand-orange), var(--brand-red))',
                    }}
                  >
                    <span>▶</span> Play Episode 1
                  </Link>
                  <button
                    onClick={() => setIsFollowing((f) => !f)}
                    className={`px-6 py-3 rounded-full font-semibold transition-colors ${
                      isFollowing
                        ? 'bg-white/20 text-white border border-white/30'
                        : 'bg-white/10 text-white/90 hover:bg-white/15'
                    }`}
                  >
                    {isFollowing ? '✓ In Watchlist' : '+ Add to Watchlist'}
                  </button>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/10 gap-8">
              <button
                onClick={() => setActiveTab('overview')}
                className={`pb-3 font-semibold text-sm transition-colors relative ${
                  activeTab === 'overview' ? 'text-white' : 'text-white/40 hover:text-white/70'
                }`}
              >
                Overview
                {activeTab === 'overview' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--brand-orange)]" />
                )}
              </button>
              <button
                onClick={() => setActiveTab('characters')}
                className={`pb-3 font-semibold text-sm transition-colors relative ${
                  activeTab === 'characters' ? 'text-white' : 'text-white/40 hover:text-white/70'
                }`}
              >
                Characters ({characters.length})
                {activeTab === 'characters' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--brand-orange)]" />
                )}
              </button>
              <button
                onClick={() => setActiveTab('lore')}
                className={`pb-3 font-semibold text-sm transition-colors relative ${
                  activeTab === 'lore' ? 'text-white' : 'text-white/40 hover:text-white/70'
                }`}
              >
                Universe Lore
                {activeTab === 'lore' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--brand-orange)]" />
                )}
              </button>
            </div>

            {/* Tab Contents */}
            {activeTab === 'overview' && (
              <div className="az-glass p-6 rounded-3xl space-y-4">
                <h3 className="text-lg font-bold text-white">Story Synopsis</h3>
                <p className="text-white/70 leading-relaxed">
                  {titleData.synopsis ||
                    'Explore an expansive vertical narrative written for fast-paced visual storytelling and episodic cliffhangers.'}
                </p>
              </div>
            )}

            {activeTab === 'characters' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {characters.length === 0 ? (
                  <p className="text-white/40 py-8 col-span-3 text-center">
                    No character details listed.
                  </p>
                ) : (
                  characters.map((c) => (
                    <div
                      key={c.id}
                      className="az-glass p-4 rounded-2xl flex items-center gap-4 border border-white/5"
                    >
                      <div className="w-14 h-14 rounded-full overflow-hidden bg-white/10 flex-shrink-0 flex items-center justify-center font-bold text-white">
                        {c.avatar ? (
                          <OptimizedImage
                            src={c.avatar}
                            alt={c.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          c.name.charAt(0)
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-bold text-white truncate">{c.name}</h4>
                        <p className="text-xs text-[var(--brand-orange)] truncate">
                          {c.role || 'Main Character'}
                        </p>
                        {c.description && (
                          <p className="text-xs text-white/50 line-clamp-1 mt-1">{c.description}</p>
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
                  <div className="az-glass p-8 rounded-3xl text-center text-white/40">
                    Discover deep world lore and timeline history as episodes are unlocked.
                  </div>
                ) : (
                  lore.map((item, i) => (
                    <div
                      key={i}
                      className="az-glass p-6 rounded-2xl border border-white/5 space-y-2"
                    >
                      <h4 className="text-base font-bold text-white">{item.title}</h4>
                      <p className="text-sm text-white/70 leading-relaxed">{item.content}</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </main>

      <AppFooter />
    </div>
  );
}
