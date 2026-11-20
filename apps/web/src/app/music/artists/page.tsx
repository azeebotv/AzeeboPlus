'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Music2, Search, CheckCircle2, Headphones, Play } from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { GlowCard } from '@/components/motion/GlowCard';

interface Artist {
  id: string;
  name: string;
  genre: string;
  monthlyListeners: string;
  topTrack: string;
  avatar: string;
  followers: string;
  verified: boolean;
}

const ARTISTS: Artist[] = [
  {
    id: 'burna-boy',
    name: 'Burna Boy',
    genre: 'Afro-fusion',
    monthlyListeners: '18.4M',
    topTrack: 'City Boys',
    avatar: '🦍',
    followers: '9.2M',
    verified: true,
  },
  {
    id: 'wizkid',
    name: 'Wizkid',
    genre: 'Afrobeats',
    monthlyListeners: '14.8M',
    topTrack: 'Essence',
    avatar: '🦅',
    followers: '11.5M',
    verified: true,
  },
  {
    id: 'asake',
    name: 'Asake',
    genre: 'Amapiano / Fuji',
    monthlyListeners: '9.6M',
    topTrack: 'Lonely At The Top',
    avatar: '⚡',
    followers: '4.8M',
    verified: true,
  },
  {
    id: 'tems',
    name: 'Tems',
    genre: 'Afro R&B',
    monthlyListeners: '12.1M',
    topTrack: 'Me & U',
    avatar: '✨',
    followers: '6.4M',
    verified: true,
  },
  {
    id: 'rema',
    name: 'Rema',
    genre: 'Afrorave',
    monthlyListeners: '22.3M',
    topTrack: 'Calm Down',
    avatar: '🦇',
    followers: '8.7M',
    verified: true,
  },
  {
    id: 'ayra-starr',
    name: 'Ayra Starr',
    genre: 'Afropop',
    monthlyListeners: '11.2M',
    topTrack: 'Rush',
    avatar: '🌟',
    followers: '5.1M',
    verified: true,
  },
];

const GENRES = ['All', 'Afrobeats', 'Afro-fusion', 'Amapiano / Fuji', 'Afro R&B', 'Afrorave'];

export default function MusicArtistsPage(): React.JSX.Element {
  const [search, setSearch] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [following, setFollowing] = useState<Record<string, boolean>>({});

  const toggleFollow = (id: string) => {
    setFollowing((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredArtists = ARTISTS.filter((artist) => {
    const matchesSearch =
      artist.name.toLowerCase().includes(search.toLowerCase()) ||
      artist.topTrack.toLowerCase().includes(search.toLowerCase());
    const matchesGenre = selectedGenre === 'All' || artist.genre === selectedGenre;
    return matchesSearch && matchesGenre;
  });

  return (
    <PageShell maxWidth="full" activeNav="Music">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <ScrollReveal>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="rounded-az-pill bg-az-flame/15 px-3 py-1 text-xs font-bold text-az-flame uppercase tracking-wider flex items-center gap-1.5">
                  <Music2 className="h-3.5 w-3.5" />
                  Music Universe • Artists Directory
                </span>
              </div>
              <h1 className="az-heading text-az-ink font-extrabold text-3xl sm:text-4xl">
                African & Global Hitmakers
              </h1>
              <p className="az-caption text-az-ink-muted mt-1">
                Explore discographies, tour dates, and exclusive Azeebo+ sound releases.
              </p>
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-az-ink-muted" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search artists or tracks..."
                className="w-full rounded-az-pill border border-az-glass-border bg-az-surface-root pl-10 pr-4 py-2 text-xs text-az-ink focus:border-az-flame focus:outline-none"
              />
            </div>
          </div>
        </ScrollReveal>

        {/* Genre Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-hide">
          {GENRES.map((genre) => (
            <button
              key={genre}
              type="button"
              onClick={() => setSelectedGenre(genre)}
              className={`rounded-az-pill px-4 py-1.5 text-xs font-bold transition-all whitespace-nowrap ${
                selectedGenre === genre
                  ? 'bg-az-flame text-az-surface-root shadow-sm'
                  : 'border border-az-glass-border bg-az-surface-root text-az-ink-muted hover:text-az-ink'
              }`}
            >
              {genre}
            </button>
          ))}
        </div>

        {/* Artists Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArtists.map((artist) => {
            const isFollowed = following[artist.id];
            return (
              <GlowCard key={artist.id} universe="music" className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-full bg-az-surface-panel flex items-center justify-center text-3xl shadow-inner border border-az-glass-border">
                      {artist.avatar}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="az-title text-az-ink font-bold">{artist.name}</h3>
                        {artist.verified && (
                          <CheckCircle2 className="h-4 w-4 text-az-secondary-400 fill-current" />
                        )}
                      </div>
                      <span className="text-xs text-az-flame font-medium">{artist.genre}</span>
                      <div className="flex items-center gap-1.5 text-[11px] text-az-ink-muted mt-1">
                        <Headphones className="h-3 w-3" />
                        <span>{artist.monthlyListeners} monthly listeners</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleFollow(artist.id)}
                    className={`rounded-az-pill px-3.5 py-1 text-xs font-bold transition-colors ${
                      isFollowed
                        ? 'border border-az-flame text-az-flame hover:bg-az-flame/10'
                        : 'bg-az-surface-panel text-az-ink hover:bg-az-glass-card border border-az-glass-border'
                    }`}
                  >
                    {isFollowed ? 'Following' : 'Follow'}
                  </button>
                </div>

                <div className="mt-5 pt-4 border-t border-az-glass-border flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-az-ink-dim">
                    <Play className="h-3 w-3 text-az-flame fill-current" />
                    <span className="font-medium">Top Hit:</span>
                    <span className="font-bold text-az-ink">{artist.topTrack}</span>
                  </div>

                  <Link
                    href={`/music/artists/${artist.id}`}
                    className="text-xs font-bold text-az-flame hover:underline"
                  >
                    View Catalog →
                  </Link>
                </div>
              </GlowCard>
            );
          })}
        </div>
      </div>
    </PageShell>
  );
}
