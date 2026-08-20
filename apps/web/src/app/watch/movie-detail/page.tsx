'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
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
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--brand-near-black)', color: 'var(--text-primary)' }}>
      <AppHeader active="Movies" />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        <Link
          href="/movies"
          className="text-sm text-white/50 hover:text-white mb-6 inline-flex items-center gap-1.5 transition-colors"
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
            {/* Hero Banner */}
            <div className="relative rounded-3xl overflow-hidden min-h-[420px] flex items-end p-8 sm:p-12 border border-white/10 shadow-2xl">
              {movie.thumbnail && (
                <OptimizedImage
                  src={movie.thumbnail}
                  alt={movie.title}
                  fill
                  className="object-cover"
                  priority
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--brand-near-black)] via-[var(--brand-near-black)]/60 to-transparent" />

              <div className="relative z-10 max-w-2xl">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-[var(--brand-orange)] text-white uppercase tracking-wider mb-4 inline-block">
                  {movie.contentType || 'Movie'}
                </span>
                <h1 className="text-3xl sm:text-5xl font-extrabold text-white mb-4 leading-tight">
                  {movie.title}
                </h1>
                <p className="text-white/70 text-base line-clamp-3 mb-6">
                  {movie.description || 'Experience premium cinema streaming on Azeebo+ Cinemaxis.'}
                </p>

                <div className="flex flex-wrap items-center gap-4">
                  <Link
                    href={`/watch/${movie.id}`}
                    className="px-8 py-3.5 rounded-full font-bold text-white transition-all hover:scale-105 shadow-xl inline-flex items-center gap-2"
                    style={{ background: 'linear-gradient(135deg, var(--brand-orange), var(--brand-red))' }}
                  >
                    <span>▶</span> Watch Movie
                  </Link>
                  <Link
                    href={`/movies/${movie.id}`}
                    className="px-6 py-3.5 rounded-full font-semibold text-white/80 bg-white/10 hover:bg-white/20 transition-all"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>

            {/* Related Movies */}
            {related.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-6">More Movies You May Like</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                  {related.map((item) => (
                    <Link
                      key={item.id}
                      href={`/watch/movie-detail?id=${item.id}`}
                      className="group block rounded-2xl overflow-hidden border border-white/5 bg-white/[0.02] hover:border-[var(--brand-orange)]/50 transition-all hover:scale-102"
                    >
                      <div className="relative aspect-[2/3] w-full bg-white/5">
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
                        <h4 className="text-xs font-semibold text-white truncate group-hover:text-[var(--brand-orange)] transition-colors">
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
      </main>

      <AppFooter />
    </div>
  );
}
