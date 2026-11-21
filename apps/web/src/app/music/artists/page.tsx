'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users, CheckCircle2, Headphones, Music, UserPlus, UserCheck, Search } from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { GlowCard } from '@/components/motion/GlowCard';

interface Artist {
  id: string;
  name: string;
  slug: string;
  genre: string;
  bio: string;
  monthlyListeners: number;
  followersCount: number;
  image: string;
  isVerified: boolean;
  topTracks: string[];
}

export default function MusicArtistsPage() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [following, setFollowing] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let isMounted = true;
    async function loadArtists() {
      try {
        const res = await fetch('/api/music/artists');
        const json = await res.json();
        if (json.success && isMounted) {
          setArtists(json.data);
        }
      } catch (err) {
        console.error('Failed to load music artists:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadArtists();
    return () => {
      isMounted = false;
    };
  }, []);

  const toggleFollow = (id: string) => {
    setFollowing((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const genres = ['all', ...Array.from(new Set(artists.map((a) => a.genre)))];

  const filteredArtists = artists.filter((artist) => {
    const matchesSearch =
      artist.name.toLowerCase().includes(search.toLowerCase()) ||
      artist.genre.toLowerCase().includes(search.toLowerCase());
    const matchesGenre = selectedGenre === 'all' || artist.genre === selectedGenre;
    return matchesSearch && matchesGenre;
  });

  return (
    <PageShell>
      <div className="min-h-screen bg-az-surface-root text-az-ink pb-20 pt-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Header */}
        <ScrollReveal>
          <div className="border-b border-az-glass-border pb-6 mb-8">
            <div className="flex items-center gap-2 text-az-flame text-sm font-semibold tracking-wider uppercase mb-2">
              <Users className="h-4 w-4" />
              <span>Music Universe Directory</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Pan-African Hitmakers & Artists
            </h1>
            <p className="text-az-ink-muted mt-2 text-sm sm:text-base max-w-2xl">
              Verified Afrobeats giants, Amapiano pioneers, and breakout stars shaping the sound of
              the continent.
            </p>
          </div>
        </ScrollReveal>

        {/* Filter & Search Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-az-ink-muted" />
            <input
              type="text"
              placeholder="Search by artist or genre..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-az-surface-panel border border-az-glass-border text-sm text-white placeholder-az-ink-dim focus:outline-none focus:border-az-flame transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
            {genres.map((g) => (
              <button
                key={g}
                onClick={() => setSelectedGenre(g)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors capitalize ${
                  selectedGenre === g
                    ? 'bg-az-flame text-az-surface-root'
                    : 'bg-az-surface-panel text-az-ink-muted hover:text-white border border-az-glass-border'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* Artists Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-72 rounded-2xl bg-az-surface-panel/40 animate-pulse border border-az-glass-border"
              />
            ))}
          </div>
        ) : filteredArtists.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-az-glass-border p-12 text-center">
            <Users className="h-10 w-10 text-az-ink-muted mx-auto mb-3 opacity-40" />
            <h3 className="text-lg font-semibold text-white">No artists found</h3>
            <p className="text-sm text-az-ink-muted mt-1">
              Try a different search term or genre filter.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArtists.map((artist) => {
              const isFollowing = !!following[artist.id];
              return (
                <GlowCard key={artist.id}>
                  <div className="p-5 flex flex-col justify-between h-full">
                    <div>
                      {/* Artist Banner / Image */}
                      <div className="relative rounded-xl overflow-hidden aspect-[4/3] mb-4 border border-az-glass-border">
                        <img
                          src={artist.image}
                          alt={artist.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 left-2 px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-black/70 text-white backdrop-blur-sm border border-az-glass-border">
                          {artist.genre}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-xl font-bold text-white">{artist.name}</h3>
                          {artist.isVerified && (
                            <CheckCircle2 className="h-4 w-4 text-az-flame fill-current" />
                          )}
                        </div>
                      </div>

                      <p className="text-xs text-az-ink-muted mt-1.5 line-clamp-2">{artist.bio}</p>

                      {/* Listener Stats */}
                      <div className="flex items-center gap-4 text-xs text-az-ink-muted mt-4 pt-3 border-t border-az-glass-border/60">
                        <span className="flex items-center gap-1">
                          <Headphones className="h-3.5 w-3.5 text-az-flame" />
                          <strong className="text-white font-mono">
                            {artist.monthlyListeners.toLocaleString()}
                          </strong>{' '}
                          listeners
                        </span>
                        <span className="flex items-center gap-1">
                          <Music className="h-3.5 w-3.5 text-az-ink-muted" />
                          <strong className="text-white font-mono">
                            {artist.followersCount.toLocaleString()}
                          </strong>{' '}
                          followers
                        </span>
                      </div>

                      {/* Top Tracks Tags */}
                      {artist.topTracks && artist.topTracks.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {artist.topTracks.map((track) => (
                            <span
                              key={track}
                              className="text-[10px] px-2 py-0.5 rounded bg-az-surface-panel text-az-ink-muted border border-az-glass-border"
                            >
                              🎵 {track}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Bottom CTA */}
                    <div className="mt-5 pt-3 border-t border-az-glass-border flex items-center gap-2">
                      <button
                        onClick={() => toggleFollow(artist.id)}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                          isFollowing
                            ? 'bg-az-surface-panel border border-az-glass-border text-white'
                            : 'bg-az-flame text-az-surface-root hover:opacity-90'
                        }`}
                      >
                        {isFollowing ? (
                          <>
                            <UserCheck className="h-3.5 w-3.5" /> Following
                          </>
                        ) : (
                          <>
                            <UserPlus className="h-3.5 w-3.5" /> Follow Artist
                          </>
                        )}
                      </button>

                      <Link
                        href={`/music/tracks?artist=${encodeURIComponent(artist.name)}`}
                        className="px-3 py-2 rounded-xl border border-az-glass-border bg-az-surface-panel hover:bg-az-surface-panel/80 text-xs font-semibold text-white transition-colors"
                      >
                        Discography
                      </Link>
                    </div>
                  </div>
                </GlowCard>
              );
            })}
          </div>
        )}
      </div>
    </PageShell>
  );
}
