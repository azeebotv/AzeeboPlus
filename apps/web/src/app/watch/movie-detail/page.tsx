'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { PageShell } from '@/components/layout/PageShell';
import { api, ContentItem } from '@/lib/api';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import { OptimizedImage } from '@/components/OptimizedImage';
import Link from 'next/link';

export default function MovieDetailPage(): React.JSX.Element {
  const searchParams = useSearchParams();
  const router = useRouter();
  const movieId = searchParams.get('id');

  const [movie, setMovie] = useState<ContentItem | null>(null);
  const [related, setRelated] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMovie = async () => {
      setIsLoading(true);
      setError(null);
      try {
        if (movieId) {
          const res = await api.content.getContent(movieId);
          if (res.success && res.data) {
            setMovie(res.data as ContentItem);
          }
        } else {
          const featured = await api.content.getFeaturedContent(1);
          if (featured.success && featured.data?.[0]) {
            setMovie(featured.data[0]);
          }
        }
        const relatedRes = await api.content.getTrendingContent(6);
        if (relatedRes.success && relatedRes.data) {
          setRelated(relatedRes.data);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load movie details');
      } finally {
        setIsLoading(false);
      }
    };
    fetchMovie();
  }, [movieId]);

  return (
    <PageShell maxWidth="2xl" activeNav="Movies">
      <div className="pb-10">
        <Link
          href="/movies"
          className="az-caption mb-6 inline-flex items-center gap-1.5 text-az-ink/50 transition-colors hover:text-az-ink"
        >
          ← Back to Movies
        </Link>

        {isLoading ? (
          <div className="space-y-6">
            <Skeleton height="420px" borderRadius="24px" />
            <Skeleton height="40px" width="40%" />
            <Skeleton height="20px" width="70%" />
          </div>
        ) : error || !movie ? (
          <ErrorState
            title="Movie Unavailable"
            description={error || 'Could not find the requested movie.'}
            onButtonPress={() => router.push('/movies')}
          />
        ) : (
          <div className="space-y-12">
            {/* Hero Banner — the movie's own artwork is this page's hero */}
            <div className="relative rounded-az-panel overflow-hidden min-h-[420px] flex items-end p-8 sm:p-12 border border-az-glass-border shadow-az-lifted">
              {movie.thumbnail && (
                <OptimizedImage
                  src={movie.thumbnail}
                  alt={movie.title}
                  fill
                  className="object-cover"
                  priority
                />
              )}
              <div className="absolute inset-0 az-scrim--hero" />

              <div className="relative z-10 max-w-2xl">
                <span className="az-caption inline-block rounded-az-pill bg-az-flame px-3 py-1 font-bold uppercase tracking-wider text-az-surface-root mb-4">
                  {movie.contentType || 'Movie'}
                </span>
                <h1 className="az-headline text-3xl sm:text-5xl text-az-ink mb-4">{movie.title}</h1>
                <p className="az-body text-az-ink/70 line-clamp-3 mb-6">
                  {movie.description || 'Experience premium cinema streaming on Azeebo+ Cinemaxis.'}
                </p>

                <div className="flex flex-wrap items-center gap-4">
                  <Link
                    href={`/watch/${movie.id}`}
                    className="az-btn-primary az-btn-primary--inline az-btn-primary--sm inline-flex items-center gap-2"
                  >
                    <span></span> Watch Movie
                  </Link>
                  <Link
                    href={`/movies/${movie.id}`}
                    className="rounded-az-pill px-6 py-3.5 az-body-strong bg-az-glass-card text-az-ink/80 transition-all hover:bg-az-ink/20"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>

            {/* Related Movies */}
            {related.length > 0 && (
              <div>
                <h2 className="az-section-title text-az-ink mb-6">More Movies You May Like</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                  {related.map((item) => (
                    <Link
                      key={item.id}
                      href={`/watch/movie-detail?id=${item.id}`}
                      className="group block rounded-az-card overflow-hidden border border-az-ink/5 bg-az-ink/[0.02] transition-all hover:border-az-flame/50 hover:scale-[1.02]"
                    >
                      <div className="relative aspect-[2/3] w-full bg-az-glass-fill">
                        {item.thumbnail && (
                          <OptimizedImage
                            src={item.thumbnail}
                            alt={item.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        )}
                      </div>
                      <div className="p-3">
                        <h4 className="az-caption truncate font-semibold text-az-ink transition-colors group-hover:text-az-flame">
                          {item.title}
                        </h4>
                      </div>
                    </Link>
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
