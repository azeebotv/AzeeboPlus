'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { PageShell } from '@/components/layout/PageShell';
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
    <PageShell maxWidth="2xl" activeNav="Reality">
      <div className="pb-10">
        <Link
          href="/reality"
          className="az-caption mb-6 inline-flex items-center gap-1.5 text-az-ink/50 transition-colors hover:text-az-ink"
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
            {/* Show Stage / Video Player Header — the show artwork is this page's hero */}
            <div className="relative rounded-az-panel overflow-hidden min-h-[460px] flex items-end p-8 sm:p-12 border border-az-glass-border shadow-az-lifted">
              {show.thumbnail && (
                <OptimizedImage
                  src={show.thumbnail}
                  alt={show.title}
                  fill
                  className="object-cover"
                  priority
                />
              )}
              <div className="absolute inset-0 az-scrim--hero" />

              <div className="relative z-10 max-w-2xl">
                <div className="flex items-center gap-3 mb-3">
                  <span className="az-caption inline-flex items-center gap-1.5 rounded-az-pill bg-az-scarlet px-3 py-1 font-bold uppercase tracking-wider text-az-ink animate-pulse">
                    <span className="h-2 w-2 rounded-full bg-az-ink" />
                    LIVE REALITY
                  </span>
                  {show.viewerCount !== undefined && (
                    <span className="az-caption font-semibold text-az-ink/70">
                      {show.viewerCount.toLocaleString()} watching
                    </span>
                  )}
                </div>

                <h1 className="az-headline text-3xl sm:text-5xl text-az-ink mb-4">{show.title}</h1>
                <p className="az-body text-az-ink/70 line-clamp-3 mb-6">
                  {show.description || 'Watch drama unfold live and vote for who stays.'}
                </p>

                <div className="flex flex-wrap items-center gap-4">
                  <Link
                    href={`/reality/episode?id=${show.id}`}
                    className="az-btn-primary az-btn-primary--inline az-btn-primary--sm inline-flex items-center gap-2"
                  >
                    <span></span> Stream Episode
                  </Link>
                  <Link
                    href={`/vote?showId=${show.id}`}
                    className="rounded-az-pill px-6 py-3.5 az-body-strong bg-az-flame text-az-ink transition-all hover:opacity-90"
                  >
                    Vote Now
                  </Link>
                  <Link
                    href={`/reality/results?showId=${show.id}`}
                    className="rounded-az-pill px-6 py-3.5 az-body-strong bg-az-glass-card text-az-ink/80 transition-all hover:bg-az-ink/20"
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
                  <h2 className="az-section-title text-az-ink">Featured Contestants</h2>
                  <Link
                    href={`/vote?showId=${show.id}`}
                    className="az-body-strong text-az-flame hover:underline"
                  >
                    Vote For Contestants →
                  </Link>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                  {contestants.map((c) => (
                    <div key={c.id} className="az-glass p-4 text-center transition-all">
                      <div className="relative w-16 h-16 mx-auto mb-3 rounded-full overflow-hidden border-2 border-az-glass-border">
                        {c.avatar ? (
                          <OptimizedImage
                            src={c.avatar}
                            alt={c.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-az-glass-card font-bold text-az-ink">
                            {c.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <h4 className="az-caption truncate font-semibold text-az-ink">{c.name}</h4>
                      <Link
                        href={`/vote?showId=${show.id}&contestantId=${c.id}`}
                        className="az-caption mt-3 block w-full rounded-az-pill py-1.5 font-bold text-az-ink bg-az-flame/80 transition-colors hover:bg-az-flame"
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
      </div>
    </PageShell>
  );
}
