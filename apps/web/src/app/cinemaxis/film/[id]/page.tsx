'use client';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { PageShell } from '@/components/layout/PageShell';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import { messageOf, requireData } from '@/lib/payload';

interface CinemaxisFilm {
  id: string;
  title: string;
  description: string;
  posterUrl?: string;
  backdropUrl?: string;
  duration: number;
  rating: string;
  releaseDate: string;
  genres: string[];
  cast: string[];
  director: string;
  ticketPrice: number;
  currency: string;
  hasTicket: boolean;
  accessExpiry?: string;
  territory: string;
}

export default function CinemaxisFilmDetailPage(): React.JSX.Element {
  const params = useParams();
  const filmId = params.id as string;
  const { user } = useAuth();

  const {
    data: film,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['cinemaxis', 'film', filmId],
    queryFn: async () => {
      const res = await apiFetch<CinemaxisFilm>(`/v1/movies/cinemaxis/${filmId}`);
      return requireData(res) ?? null;
    },
  });

  if (isError) {
    return (
      <PageShell maxWidth="2xl" activeNav="Cinemaxis">
        <div className="py-12">
          <ErrorState
            title="Film details unavailable"
            description={messageOf(error)}
            onButtonPress={() => refetch()}
          />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell maxWidth="2xl" activeNav="Cinemaxis">
      {isLoading ? (
        <div className="py-12 space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-[50vh] w-full rounded-az-card" />
        </div>
      ) : film ? (
        <>
          {/* Backdrop hero — the film's own artwork is this page's hero */}
          <div className="relative h-[60vh] rounded-az-panel overflow-hidden bg-gradient-to-b from-[var(--brand-purple)]/40 to-az-surface-root">
            {film.backdropUrl && (
              <img
                src={film.backdropUrl}
                alt=""
                className="absolute inset-0 w-full h-full object-cover opacity-40"
              />
            )}
            <div className="absolute inset-0 az-scrim--hero" />
            <div className="absolute bottom-0 left-0 right-0 px-4 pb-12">
              <Link
                href="/cinemaxis"
                className="az-body-strong mb-4 inline-block text-az-flame hover:underline"
              >
                ← Cinemaxis
              </Link>
              <h1 className="az-headline mb-2 text-4xl text-az-ink">{film.title}</h1>
              <div className="flex items-center gap-4 az-body text-az-ink-muted">
                <span>{film.rating}</span>
                <span>
                  {Math.floor(film.duration / 60)}h {film.duration % 60}m
                </span>
                <span>{film.releaseDate}</span>
                <span>{film.territory}</span>
              </div>
            </div>
          </div>
          <div className="py-12">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="md:col-span-2 space-y-8">
                <section>
                  <p className="az-lead leading-relaxed text-az-ink-muted">{film.description}</p>
                </section>
                <section>
                  <h2 className="az-title mb-3 text-az-ink">Details</h2>
                  <div className="space-y-2 az-body text-az-ink-dim">
                    <p>
                      <span className="text-az-ink-muted">Director:</span> {film.director}
                    </p>
                    <p>
                      <span className="text-az-ink-muted">Cast:</span> {film.cast.join(', ')}
                    </p>
                    <p>
                      <span className="text-az-ink-muted">Genres:</span> {film.genres.join(', ')}
                    </p>
                  </div>
                </section>
              </div>
              <div className="space-y-4">
                <div className="az-glass p-6 sticky top-24">
                  {film.hasTicket ? (
                    <>
                      <p className="az-body-strong mb-2 text-az-success-400">
                        Digital Ticket Active
                      </p>
                      {film.accessExpiry && (
                        <p className="az-caption mb-4 text-az-ink-dim">
                          Access expires: {new Date(film.accessExpiry).toLocaleDateString()}
                        </p>
                      )}
                      <Link
                        href={`/cinemaxis/watch/${film.id}`}
                        className="az-btn-primary block text-center"
                      >
                        Watch Now
                      </Link>
                    </>
                  ) : (
                    <>
                      <p className="az-section-title">{`₦${film.ticketPrice.toLocaleString()}`}</p>
                      <p className="az-caption mb-4 text-az-ink-dim">Digital Ticket</p>
                      {user ? (
                        <Link
                          href={`/cinemaxis/ticket/${film.id}`}
                          className="az-btn-primary block text-center"
                        >
                          Buy Digital Ticket
                        </Link>
                      ) : (
                        <Link href="/auth/login" className="az-btn-primary block text-center">
                          Sign in to Purchase
                        </Link>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </PageShell>
  );
}
