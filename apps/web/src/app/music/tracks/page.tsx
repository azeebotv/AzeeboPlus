'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Music, Play, Pause, Plus, Share2, Shuffle, Volume2 } from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';
import { ScrollReveal } from '@/components/motion/ScrollReveal';

interface Track {
  id: string;
  rank: number;
  title: string;
  artist: string;
  artistId: string;
  duration: string;
  plays: string;
  quality: string;
  album: string;
}

const TRACKS: Track[] = [
  {
    id: 't1',
    rank: 1,
    title: 'City Boys',
    artist: 'Burna Boy',
    artistId: 'burna-boy',
    duration: '2:33',
    plays: '142.8M',
    quality: 'Hi-Res Lossless',
    album: 'I Told Them...',
  },
  {
    id: 't2',
    rank: 2,
    title: 'Lonely At The Top',
    artist: 'Asake',
    artistId: 'asake',
    duration: '2:37',
    plays: '118.4M',
    quality: 'Spatial Audio',
    album: 'Work of Art',
  },
  {
    id: 't3',
    rank: 3,
    title: 'Calm Down',
    artist: 'Rema',
    artistId: 'rema',
    duration: '3:39',
    plays: '890.2M',
    quality: 'Dolby Atmos',
    album: 'Rave & Climax',
  },
  {
    id: 't4',
    rank: 4,
    title: 'Me & U',
    artist: 'Tems',
    artistId: 'tems',
    duration: '3:12',
    plays: '94.6M',
    quality: 'Hi-Res Lossless',
    album: 'Born in the Wild',
  },
  {
    id: 't5',
    rank: 5,
    title: 'Essence (feat. Tems)',
    artist: 'Wizkid',
    artistId: 'wizkid',
    duration: '4:08',
    plays: '450.1M',
    quality: 'Spatial Audio',
    album: 'Made In Lagos',
  },
];

export default function MusicTracksPage(): React.JSX.Element {
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);

  const togglePlay = (id: string) => {
    setPlayingTrackId((prev) => (prev === id ? null : id));
  };

  return (
    <PageShell maxWidth="full" activeNav="Music">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header Title & Controls */}
        <ScrollReveal>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="rounded-az-pill bg-az-flame/15 px-3 py-1 text-xs font-bold text-az-flame uppercase tracking-wider flex items-center gap-1.5">
                  <Music className="h-3.5 w-3.5" />
                  Official Charts • Top 50 Nigeria
                </span>
              </div>
              <h1 className="az-heading text-az-ink font-extrabold text-3xl sm:text-4xl">
                Trending Tracks & Viral Sounds
              </h1>
              <p className="az-caption text-az-ink-muted mt-1">
                Updated hourly from verified streams across Nigeria, Ghana, UK, and USA.
              </p>
            </div>

            {/* Play All & Shuffle Buttons */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setPlayingTrackId(TRACKS[0]?.id || null)}
                className="rounded-az-pill bg-az-flame px-5 py-2.5 text-xs font-bold text-az-surface-root shadow flex items-center gap-2"
              >
                <Play className="h-4 w-4 fill-current" />
                Play All
              </button>
              <button
                type="button"
                className="rounded-az-pill border border-az-glass-border bg-az-surface-root px-4 py-2.5 text-xs font-bold text-az-ink hover:bg-az-surface-panel transition-colors flex items-center gap-2"
              >
                <Shuffle className="h-4 w-4 text-az-flame" />
                Shuffle
              </button>
            </div>
          </div>
        </ScrollReveal>

        {/* Tracks List */}
        <div className="rounded-az-card border border-az-glass-border bg-az-surface-root overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 px-6 py-3 border-b border-az-glass-border text-[11px] font-bold text-az-ink-muted uppercase tracking-wider">
            <span className="col-span-1">#</span>
            <span className="col-span-5">Title & Artist</span>
            <span className="col-span-3 hidden sm:block">Album & Quality</span>
            <span className="col-span-2 hidden md:block text-right">Streams</span>
            <span className="col-span-1 text-right">Time</span>
          </div>

          {/* Rows */}
          <div className="divide-y divide-az-glass-border">
            {TRACKS.map((track) => {
              const isPlaying = playingTrackId === track.id;
              return (
                <div
                  key={track.id}
                  className={`grid grid-cols-12 items-center px-6 py-3.5 transition-colors hover:bg-az-surface-panel/60 ${
                    isPlaying ? 'bg-az-surface-panel/80' : ''
                  }`}
                >
                  {/* Rank / Play Button */}
                  <div className="col-span-1 flex items-center">
                    <button
                      type="button"
                      onClick={() => togglePlay(track.id)}
                      className="group flex h-8 w-8 items-center justify-center rounded-full hover:bg-az-flame/20 transition-colors"
                      aria-label={isPlaying ? 'Pause track' : 'Play track'}
                    >
                      {isPlaying ? (
                        <Pause className="h-4 w-4 text-az-flame fill-current" />
                      ) : (
                        <>
                          <span className="group-hover:hidden text-xs font-bold text-az-ink-muted">
                            {track.rank}
                          </span>
                          <Play className="hidden group-hover:block h-3.5 w-3.5 text-az-flame fill-current" />
                        </>
                      )}
                    </button>
                  </div>

                  {/* Title & Artist */}
                  <div className="col-span-5 flex flex-col min-w-0 pr-4">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/music/tracks/${track.id}`}
                        className={`text-xs font-bold truncate hover:underline ${
                          isPlaying ? 'text-az-flame' : 'text-az-ink'
                        }`}
                      >
                        {track.title}
                      </Link>
                      {isPlaying && <Volume2 className="h-3 w-3 text-az-flame animate-pulse" />}
                    </div>
                    <Link
                      href={`/music/artists/${track.artistId}`}
                      className="text-[11px] text-az-ink-muted truncate hover:text-az-ink hover:underline"
                    >
                      {track.artist}
                    </Link>
                  </div>

                  {/* Album & Quality Tag */}
                  <div className="col-span-3 hidden sm:flex flex-col text-xs min-w-0 pr-4">
                    <span className="text-az-ink-dim truncate">{track.album}</span>
                    <span className="text-[10px] text-az-success-400 font-semibold">
                      {track.quality}
                    </span>
                  </div>

                  {/* Streams */}
                  <div className="col-span-2 hidden md:block text-right text-xs font-medium text-az-ink-muted">
                    {track.plays}
                  </div>

                  {/* Duration & Quick Actions */}
                  <div className="col-span-1 flex items-center justify-end gap-2 text-xs text-az-ink-muted">
                    <span>{track.duration}</span>
                    <button
                      type="button"
                      className="rounded p-1 hover:text-az-flame transition-colors"
                      title="Add to Playlist"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      className="rounded p-1 hover:text-az-flame transition-colors hidden lg:block"
                      title="Share Track"
                    >
                      <Share2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </PageShell>
  );
}
