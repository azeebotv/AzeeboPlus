'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import { apiFetch } from '@/lib/api';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import { OptimizedImage } from '@/components/OptimizedImage';
import Link from 'next/link';

interface RealityContestant {
  id: string;
  name: string;
  avatar?: string;
  votes?: number;
  rank?: number;
  status?: string;
}

interface RealityShowDetail {
  id: string;
  title: string;
  description?: string;
  thumbnail?: string;
  viewerCount?: number;
  status?: string;
  seasonNumber?: number;
  episodes?: Array<{
    id: string;
    title: string;
    episodeNumber: number;
    duration?: number;
    thumbnail?: string;
  }>;
}

export default function RealityShowViewerPage(): React.JSX.Element {
  const searchParams = useSearchParams();
  const router = useRouter();
  const showId = searchParams.get('id') || searchParams.get('showId') || '';

  const [show, setShow] = useState<RealityShowDetail | null>(null);
  const [contestants, setContestants] = useState<RealityContestant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchShowData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        if (showId) {
          const res = await apiFetch<RealityShowDetail>(`/v1/reality/shows/${showId}`);
          if (res.success && res.data) {
            setShow(res.data);
          }
          const cRes = await apiFetch<RealityContestant[] | { items: RealityContestant[] }>(
            `/v1/reality/shows/${showId}/contestants`
          );
          if (cRes.success && cRes.data) {
            setContestants(Array.isArray(cRes.data) ? cRes.data : cRes.data.items || []);
          }
        } else {
          const allShows = await apiFetch<RealityShowDetail[] | { items: RealityShowDetail[] }>(
            '/v1/reality/shows'
          );
          if (allShows.success && allShows.data) {
            const list = Array.isArray(allShows.data) ? allShows.data : allShows.data.items || [];
            if (list.length > 0) {
              setShow(list[0]);
              const cRes = await apiFetch<RealityContestant[] | { items: RealityContestant[] }>(
                `/v1/reality/shows/${list[0].id}/contestants`
              );
              if (cRes.success && cRes.data) {
                setContestants(Array.isArray(cRes.data) ? cRes.data : cRes.data.items || []);
              }
            }
          }
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load show data');
      } finally {
        setIsLoading(false);
      }
    };
    fetchShowData();
  }, [showId]);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: 'var(--brand-near-black)', color: 'var(--text-primary)' }}
    >
      <AppHeader active="Reality" />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        <Link
          href="/reality"
          className="text-sm text-white/50 hover:text-white mb-6 inline-flex items-center gap-1.5 transition-colors"
        >
          ← Back to Reality Universe
        </Link>

        {isLoading ? (
          <div className="space-y-6">
            <Skeleton height="450px" borderRadius="24px" />
            <div className="grid grid-cols-3 gap-4">
              <Skeleton height="120px" borderRadius="16px" />
              <Skeleton height="120px" borderRadius="16px" />
              <Skeleton height="120px" borderRadius="16px" />
            </div>
          </div>
        ) : error || !show ? (
          <ErrorState
            title="Reality Show Unavailable"
            description={error || 'Could not load reality show details.'}
            onButtonPress={() => router.push('/reality')}
          />
        ) : (
          <div className="space-y-10">
            {/* Show Stage / Video Player Header */}
            <div className="relative rounded-3xl overflow-hidden min-h-[460px] flex items-end p-8 sm:p-12 border border-white/10 shadow-2xl">
              {show.thumbnail && (
                <OptimizedImage
                  src={show.thumbnail}
                  alt={show.title}
                  fill
                  className="object-cover"
                  priority
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--brand-near-black)] via-[var(--brand-near-black)]/60 to-transparent" />

              <div className="relative z-10 max-w-2xl">
                <div className="flex items-center gap-3 mb-3">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-600 text-white uppercase tracking-wider animate-pulse flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-white" />
                    LIVE REALITY
                  </span>
                  {show.viewerCount !== undefined && (
                    <span className="text-xs text-white/70 font-semibold">
                      {show.viewerCount.toLocaleString()} watching
                    </span>
                  )}
                </div>

                <h1 className="text-3xl sm:text-5xl font-extrabold text-white mb-4 leading-tight">
                  {show.title}
                </h1>
                <p className="text-white/70 text-base line-clamp-3 mb-6">
                  {show.description || 'Watch drama unfold live and vote for who stays.'}
                </p>

                <div className="flex flex-wrap items-center gap-4">
                  <Link
                    href={`/reality/episode?id=${show.id}`}
                    className="px-8 py-3.5 rounded-full font-bold text-white transition-all hover:scale-105 shadow-xl inline-flex items-center gap-2"
                    style={{
                      background: 'linear-gradient(135deg, var(--brand-orange), var(--brand-red))',
                    }}
                  >
                    <span></span> Stream Episode
                  </Link>
                  <Link
                    href={`/vote?showId=${show.id}`}
                    className="px-6 py-3.5 rounded-full font-semibold text-white bg-[var(--brand-orange)] hover:opacity-90 transition-all"
                  >
                    Vote Now
                  </Link>
                  <Link
                    href={`/reality/results?showId=${show.id}`}
                    className="px-6 py-3.5 rounded-full font-semibold text-white/80 bg-white/10 hover:bg-white/20 transition-all"
                  >
                    Results & Leaderboard
                  </Link>
                </div>
              </div>
            </div>

            {/* Contestants Section */}
            {contestants.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">Featured Contestants</h2>
                  <Link
                    href={`/vote?showId=${show.id}`}
                    className="text-sm font-semibold text-[var(--brand-orange)] hover:underline"
                  >
                    Vote For Contestants →
                  </Link>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                  {contestants.map((c) => (
                    <div
                      key={c.id}
                      className="az-glass p-4 rounded-2xl text-center border border-white/5 hover:border-[var(--brand-orange)]/50 transition-all"
                    >
                      <div className="relative w-16 h-16 mx-auto mb-3 rounded-full overflow-hidden border-2 border-white/10">
                        {c.avatar ? (
                          <OptimizedImage
                            src={c.avatar}
                            alt={c.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-white/10 font-bold text-white">
                            {c.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <h4 className="text-xs font-semibold text-white truncate">{c.name}</h4>
                      <Link
                        href={`/vote?showId=${show.id}&contestantId=${c.id}`}
                        className="mt-3 block w-full py-1.5 rounded-full text-xs font-bold text-white bg-[var(--brand-orange)]/80 hover:bg-[var(--brand-orange)] transition-colors"
                      >
                        Vote
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <AppFooter />
    </div>
  );
}
