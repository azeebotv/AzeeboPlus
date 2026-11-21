'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Music, Play, Pause, Plus, Share2, Shuffle, Volume2 } from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';
import { ScrollReveal } from '@/components/motion/ScrollReveal';

interface Track {
  id: string;
  rank: number;
  title: string;
  artist: string;
  album: string;
  streams: string;
  duration: string;
  genre: string;
  cover: string;
  audioQuality: string;
}

export default function MusicTracksPage() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [selectedGenre, setSelectedGenre] = useState('all');

  useEffect(() => {
    let isMounted = true;
    async function loadTracks() {
      try {
        const res = await fetch('/api/music/tracks');
        const json = await res.json();
        if (json.success && isMounted) {
          setTracks(json.data);
          if (json.data[0]) {
            setPlayingId(json.data[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load music tracks:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadTracks();
    return () => {
      isMounted = false;
    };
  }, []);

  const genres = ['all', ...Array.from(new Set(tracks.map((t) => t.genre)))];

  const filteredTracks = tracks.filter((t) => {
    if (selectedGenre === 'all') return true;
    return t.genre.toLowerCase() === selectedGenre.toLowerCase();
  });

  const currentTrack = tracks.find((t) => t.id === playingId) || tracks[0];

  return (
    <PageShell>
      <div className="min-h-screen bg-az-surface-root text-az-ink pb-32 pt-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Header */}
        <ScrollReveal>
          <div className="border-b border-az-glass-border pb-6 mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-az-flame text-sm font-semibold tracking-wider uppercase mb-2">
                <Music className="h-4 w-4" />
                <span>Pan-African Soundboard</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                Viral Sounds & Top 50 Chart
              </h1>
              <p className="text-az-ink-muted mt-2 text-sm sm:text-base max-w-2xl">
                The most streamed records, viral street anthems, and high-fidelity Afrobeats audio,
                queried directly from Azeebo Music DB.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const random = tracks[Math.floor(Math.random() * tracks.length)];
                  if (random) setPlayingId(random.id);
                }}
                className="px-4 py-2.5 rounded-xl bg-az-surface-panel border border-az-glass-border text-white text-xs font-semibold hover:bg-az-surface-panel/80 transition-colors flex items-center gap-2"
              >
                <Shuffle className="h-4 w-4" />
                Shuffle Play
              </button>
              <Link
                href="/music/artists"
                className="px-4 py-2.5 rounded-xl bg-az-flame text-az-surface-root text-xs font-bold hover:opacity-90 transition-opacity"
              >
                Explore Artists
              </Link>
            </div>
          </div>
        </ScrollReveal>

        {/* Genre Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 no-scrollbar">
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

        {/* Tracks Table */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-16 rounded-xl bg-az-surface-panel/40 animate-pulse border border-az-glass-border"
              />
            ))}
          </div>
        ) : filteredTracks.length === 0 ? (
          <div className="rounded-xl border border-dashed border-az-glass-border p-12 text-center">
            <Music className="h-10 w-10 text-az-ink-muted mx-auto mb-3 opacity-40" />
            <h3 className="text-lg font-semibold text-white">No tracks available</h3>
            <p className="text-sm text-az-ink-muted mt-1">
              Check back shortly as new tracks are ingested.
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-az-glass-border bg-az-surface-panel/20 overflow-hidden">
            <div className="grid grid-cols-12 gap-4 px-5 py-3 text-xs font-bold uppercase tracking-wider text-az-ink-muted border-b border-az-glass-border bg-az-surface-panel/40">
              <div className="col-span-1 text-center">#</div>
              <div className="col-span-6 sm:col-span-5">Title</div>
              <div className="hidden sm:block col-span-3">Album / Vibe</div>
              <div className="hidden md:block col-span-2 text-right">Streams</div>
              <div className="col-span-5 sm:col-span-1 text-right">Time</div>
            </div>

            <div className="divide-y divide-az-glass-border/60">
              {filteredTracks.map((track) => {
                const isPlaying = playingId === track.id;
                return (
                  <div
                    key={track.id}
                    onClick={() => setPlayingId(track.id)}
                    className={`grid grid-cols-12 gap-4 px-5 py-3.5 items-center cursor-pointer transition-colors group ${
                      isPlaying
                        ? 'bg-az-flame/10 text-white'
                        : 'hover:bg-az-surface-panel/60 text-az-ink'
                    }`}
                  >
                    {/* Rank / Play Toggle */}
                    <div className="col-span-1 flex items-center justify-center">
                      {isPlaying ? (
                        <Volume2 className="h-4 w-4 text-az-flame animate-pulse" />
                      ) : (
                        <span className="text-xs font-mono font-bold text-az-ink-muted group-hover:hidden">
                          {track.rank}
                        </span>
                      )}
                      <Play
                        className={`h-4 w-4 text-white fill-current hidden ${
                          !isPlaying ? 'group-hover:block' : ''
                        }`}
                      />
                    </div>

                    {/* Title + Artist + Cover */}
                    <div className="col-span-6 sm:col-span-5 flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-lg overflow-hidden flex-shrink-0 border border-az-glass-border">
                        <img
                          src={track.cover}
                          alt={track.title}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-sm text-white truncate">{track.title}</h4>
                        <div className="flex items-center gap-2 text-xs text-az-ink-muted truncate">
                          <span>{track.artist}</span>
                          <span className="hidden lg:inline px-1.5 py-0.2 rounded text-[10px] bg-az-surface-panel border border-az-glass-border text-az-flame">
                            {track.audioQuality}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Album */}
                    <div className="hidden sm:block col-span-3 text-xs text-az-ink-muted truncate">
                      {track.album}
                    </div>

                    {/* Streams */}
                    <div className="hidden md:block col-span-2 text-right text-xs font-mono text-az-ink-muted">
                      {track.streams}
                    </div>

                    {/* Duration & Actions */}
                    <div className="col-span-5 sm:col-span-1 flex items-center justify-end gap-2 text-xs font-mono text-az-ink-muted">
                      <span>{track.duration}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                        className="p-1 rounded hover:bg-az-surface-panel text-az-ink-muted hover:text-white"
                        title="Add to Playlist"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Sticky Player Bottom Bar */}
        {currentTrack && (
          <div className="fixed bottom-0 inset-x-0 bg-az-surface-panel/95 backdrop-blur-xl border-t border-az-glass-border p-4 z-40">
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-12 w-12 rounded-lg overflow-hidden flex-shrink-0 border border-az-glass-border">
                  <img
                    src={currentTrack.cover}
                    alt={currentTrack.title}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-sm text-white truncate">{currentTrack.title}</h4>
                  <p className="text-xs text-az-ink-muted truncate">{currentTrack.artist}</p>
                </div>
              </div>

              {/* Player Controls */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setPlayingId(playingId ? null : currentTrack.id)}
                  className="p-3 rounded-full bg-az-flame text-az-surface-root hover:opacity-90 transition-opacity"
                  title={playingId ? 'Pause' : 'Play'}
                >
                  {playingId ? (
                    <Pause className="h-5 w-5 fill-current" />
                  ) : (
                    <Play className="h-5 w-5 fill-current" />
                  )}
                </button>
              </div>

              <div className="hidden sm:flex items-center gap-4 text-xs text-az-ink-muted">
                <span className="px-2 py-1 rounded bg-az-surface-root border border-az-glass-border font-mono text-az-flame">
                  {currentTrack.audioQuality}
                </span>
                <button
                  type="button"
                  className="p-2 rounded-lg hover:bg-az-surface-root"
                  title="Share Track"
                >
                  <Share2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}
